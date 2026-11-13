import { GoogleGenAI, Type } from "@google/genai";

// Módulo único de acesso ao Gemini com failover.
// Usado por api/extract-technicians.ts, api/test-gemini.ts e server.ts.
//
// Cadeia: para cada chave -> para cada modelo -> até 2 tentativas (retry só em erro transitório).
// Modelos podem ser trocados sem deploy de código via GEMINI_MODELS="a,b,c".

export const DEFAULT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-flash-latest",
];

const ATTEMPT_TIMEOUT_MS = 20_000;
const TOTAL_BUDGET_MS = 50_000; // abaixo do maxDuration de 60s da Vercel
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;

export type Attempt = {
  model: string;
  keyIdx: number;
  ok: boolean;
  kind?: ErrorKind;
  status?: number;
  ms: number;
  error?: string;
};

export type ErrorKind =
  | "abort" // 400: imagem/prompt inválido, trocar de modelo não ajuda
  | "next-key" // 401/403: chave ruim
  | "bad-model" // 404: modelo inexistente
  | "backoff" // 429
  | "retry" // 5xx / timeout / rede
  | "invalid-output" // resposta sem JSON/schema válido
  | "empty"; // resposta válida, mas sem nenhum técnico

export class ExtractError extends Error {
  kind: ErrorKind | "no-key" | "exhausted";
  httpStatus: number;
  attempts: Attempt[];
  constructor(
    kind: ExtractError["kind"],
    message: string,
    httpStatus: number,
    attempts: Attempt[]
  ) {
    super(message);
    this.kind = kind;
    this.httpStatus = httpStatus;
    this.attempts = attempts;
  }
}

export type Technician = { name: string; region: string; city: string; obs: string };
export type TechData = { moto: Technician[]; car: Technician[] };

export function getApiKeys(): string[] {
  // Somente variáveis de servidor. NÃO ler VITE_* (vai para o bundle do front).
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2]
    .map((k) => (k || "").trim())
    .filter(Boolean);
}

export function getModels(): string[] {
  const fromEnv = (process.env.GEMINI_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_MODELS;
}

// ---------- circuit breaker (em memória, por instância) ----------
const failures = new Map<string, { count: number; openUntil: number }>();
const badModels = new Set<string>();

const breaker = {
  isOpen(model: string) {
    if (badModels.has(model)) return true;
    const f = failures.get(model);
    return !!f && f.openUntil > Date.now();
  },
  fail(model: string) {
    const f = failures.get(model) || { count: 0, openUntil: 0 };
    f.count += 1;
    if (f.count >= BREAKER_THRESHOLD) {
      f.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
      f.count = 0;
    }
    failures.set(model, f);
  },
  success(model: string) {
    failures.delete(model);
  },
};

// ---------- classificação de erro ----------
function errorStatus(e: any): number | undefined {
  const raw = e?.status ?? e?.code ?? e?.error?.code;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 100) return n;
  const msg = String(e?.message || "");
  const m = msg.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
  if (m) return Number(m[1]);
  if (/UNAVAILABLE|high demand|overloaded/i.test(msg)) return 503;
  if (/RESOURCE_EXHAUSTED|quota|rate/i.test(msg)) return 429;
  return undefined;
}

function classify(e: any): { kind: ErrorKind; status?: number } {
  const status = errorStatus(e);
  if (status === 400) return { kind: "abort", status };
  if (status === 401 || status === 403) return { kind: "next-key", status };
  if (status === 404) return { kind: "bad-model", status };
  if (status === 429) return { kind: "backoff", status };
  return { kind: "retry", status }; // 5xx, timeout, rede
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withTimeout<T>(p: Promise<T>, ms: number, controller: AbortController): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error(`Timeout de ${ms}ms`), { status: 504 }));
    }, ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t)) as Promise<T>;
}

// ---------- prompt e schema ----------
const PROMPT = `Você vai ler a imagem de uma escala de técnicos de campo. Ela costuma ter duas tabelas: "TÉCNICOS DE MOTO" e "TÉCNICOS DE CARRO".
Cada tabela tem colunas como: Técnico | Região de atendimento | Cidade | Observações.

Para CADA linha (cada técnico) da tabela, extraia os 4 campos, lendo cada coluna pelo título do cabeçalho:
- name: o que está na coluna "Técnico" (nome ou identificação).
- region: o que está na coluna "Região de atendimento" (bairros/setores). Mantenha o texto completo, por exemplo "Todas as regiões" ou a lista de bairros separados por " · ".
- city: o que está na coluna "Cidade" (ex.: Peruíbe, Itanhaém, Mongaguá, Praia Grande). TODA linha que tem uma cidade escrita na tabela deve vir com city preenchido; nunca deixe city vazio se a coluna "Cidade" tem valor naquela linha.
- obs: o que está na coluna "Observações" (ex.: NOTURNO, avisos). Se a célula estiver vazia, use "".

Regras:
- Inclua todos os técnicos de cada tabela, na ordem em que aparecem, sem pular linhas.
- Técnicos da tabela de MOTO vão em "moto"; os da tabela de CARRO vão em "car".
- Copie os textos exatamente como estão escritos, sem inventar, traduzir ou resumir.
- Use "" (string vazia) apenas quando a célula realmente estiver vazia na imagem.
- Se uma tabela não existir, retorne o array vazio [] para ela.

Retorne EXCLUSIVAMENTE o JSON no formato do schema.`;

const techItem = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Coluna "Técnico"' },
    region: { type: Type.STRING, description: 'Coluna "Região de atendimento"' },
    city: { type: Type.STRING, description: 'Coluna "Cidade" (obrigatória quando houver valor na linha)' },
    obs: { type: Type.STRING, description: 'Coluna "Observações" ("" se vazia)' },
  },
  // todos obrigatórios: com só "name" obrigatório o modelo costumava omitir cidade/região
  required: ["name", "region", "city", "obs"],
  propertyOrdering: ["name", "region", "city", "obs"],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    moto: { type: Type.ARRAY, items: techItem },
    car: { type: Type.ARRAY, items: techItem },
  },
  required: ["moto", "car"],
};

// ---------- parse + validação ----------
function stripFences(text: string) {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseJson(text: string): any {
  const clean = stripFences(text);
  try {
    return JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Resposta sem JSON");
    return JSON.parse(m[0]);
  }
}

function normalizeList(list: any): Technician[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: Technician[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const name = String(raw.name ?? "").trim();
    if (!name) continue;
    const item = {
      name,
      region: String(raw.region ?? "").trim(),
      city: String(raw.city ?? "").trim(),
      obs: String(raw.obs ?? "").trim(),
    };
    const key = `${item.name}|${item.region}|${item.city}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function validateTechData(parsed: any): TechData {
  if (!parsed || typeof parsed !== "object" || (!("moto" in parsed) && !("car" in parsed))) {
    throw new Error("JSON fora do schema esperado");
  }
  return { moto: normalizeList(parsed.moto), car: normalizeList(parsed.car) };
}

// ---------- núcleo do failover ----------
type CallFn = (ai: GoogleGenAI, model: string, signal: AbortSignal) => Promise<string>;
type Handle = (text: string) => any; // lança se inválido (kind invalid-output) / EmptyResult

class EmptyResult extends Error {}

/** Leitura que veio completa em nomes, mas sem nenhuma cidade (provável falha de leitura da coluna). */
class WeakResult<T> extends Error {
  data: T;
  constructor(data: T) {
    super("Cidades não foram extraídas");
    this.data = data;
  }
}

async function runChain<T>(call: CallFn, handle: (text: string) => T): Promise<{
  value: T;
  model: string;
  attempts: Attempt[];
  latencyMs: number;
}> {
  const keys = getApiKeys();
  const attempts: Attempt[] = [];
  const started = Date.now();

  if (!keys.length) {
    throw new ExtractError(
      "no-key",
      "Nenhuma chave GEMINI_API_KEY configurada nas variáveis de ambiente do servidor.",
      500,
      attempts
    );
  }

  const models = getModels();
  const deadline = started + TOTAL_BUDGET_MS;
  let sawEmpty = false;
  let sawNonAuthError = false;
  let weak: { value: T; model: string; count: number } | null = null;

  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const ai = new GoogleGenAI({ apiKey: keys[keyIdx] });
    let keyDead = false;

    for (const model of models) {
      if (keyDead) break;
      if (breaker.isOpen(model)) continue;

      for (let retry = 0; retry < 2; retry++) {
        const remaining = deadline - Date.now();
        if (remaining < 2_000) {
          throw new ExtractError(
            "exhausted",
            "Tempo limite total da leitura esgotado.",
            503,
            attempts
          );
        }

        const t0 = Date.now();
        const controller = new AbortController();
        try {
          const text = await withTimeout(
            call(ai, model, controller.signal),
            Math.min(ATTEMPT_TIMEOUT_MS, remaining),
            controller
          );
          if (!text) throw Object.assign(new Error("Resposta vazia do modelo"), { invalid: true });

          let value: T;
          try {
            value = handle(text);
          } catch (e: any) {
            if (e instanceof EmptyResult || e instanceof WeakResult) throw e;
            throw Object.assign(new Error(e?.message || "Saída inválida"), { invalid: true });
          }

          breaker.success(model);
          attempts.push({ model, keyIdx, ok: true, ms: Date.now() - t0 });
          return { value, model, attempts, latencyMs: Date.now() - started };
        } catch (e: any) {
          const ms = Date.now() - t0;

          if (e instanceof WeakResult) {
            // guarda a leitura incompleta e tenta outro modelo; na 2ª vez devolve a melhor que tiver
            weak = { value: e.data as T, model, count: (weak?.count ?? 0) + 1 };
            attempts.push({ model, keyIdx, ok: false, kind: "invalid-output", ms, error: e.message });
            if (weak.count >= 2) {
              return { value: weak.value, model, attempts, latencyMs: Date.now() - started };
            }
            break; // próximo modelo
          }
          if (e instanceof EmptyResult) {
            sawEmpty = true;
            attempts.push({ model, keyIdx, ok: false, kind: "empty", ms, error: "Nenhum técnico encontrado" });
            break; // próximo modelo
          }
          if (e?.invalid) {
            sawNonAuthError = true;
            breaker.fail(model);
            attempts.push({ model, keyIdx, ok: false, kind: "invalid-output", ms, error: e.message });
            break; // próximo modelo
          }

          const { kind, status } = classify(e);
          const message = String(e?.message || e).slice(0, 300);
          attempts.push({ model, keyIdx, ok: false, kind, status, ms, error: message });
          console.warn(`[gemini] ${model} (chave ${keyIdx + 1}) falhou [${kind}${status ? " " + status : ""}]: ${message}`);

          if (kind === "abort") {
            throw new ExtractError("abort", message, 400, attempts);
          }
          if (kind === "next-key") {
            keyDead = true;
            break;
          }
          if (kind === "bad-model") {
            badModels.add(model);
            break;
          }

          sawNonAuthError = true;
          breaker.fail(model);
          if (retry === 0) {
            // backoff com jitter; 429 espera mais
            const base = kind === "backoff" ? 1500 : 600;
            await sleep(Math.min(base + Math.random() * 400, Math.max(0, deadline - Date.now() - 2_000)));
            continue; // 2ª tentativa no mesmo modelo
          }
          break; // próximo modelo
        }
      }
    }
  }

  // todos os modelos falharam, mas houve uma leitura (mesmo sem cidades): melhor que nada
  if (weak) {
    return { value: weak.value, model: weak.model, attempts, latencyMs: Date.now() - started };
  }

  if (sawEmpty && !sawNonAuthError) {
    throw new ExtractError(
      "empty",
      "A IA leu a imagem, mas não encontrou nenhum técnico. Confira se a imagem é a escala correta.",
      422,
      attempts
    );
  }
  if (!sawNonAuthError && attempts.length && attempts.every((a) => a.kind === "next-key")) {
    throw new ExtractError(
      "exhausted",
      "Chave da API rejeitada (401/403). Verifique GEMINI_API_KEY.",
      502,
      attempts
    );
  }
  throw new ExtractError(
    "exhausted",
    "Os servidores de IA estão temporariamente indisponíveis. Aguarde alguns instantes e tente novamente.",
    503,
    attempts
  );
}

// ---------- API pública ----------
export async function extractWithFailover(base64Data: string, mimeType: string) {
  const { value, model, attempts, latencyMs } = await runChain<TechData>(
    async (ai, model, signal) => {
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: PROMPT }, { inlineData: { data: base64Data, mimeType } }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0, // leitura de tabela: sem criatividade
          abortSignal: signal,
        },
      });
      return res.text || "";
    },
    (text) => {
      const data = validateTechData(parseJson(text));
      const all = [...data.moto, ...data.car];
      if (!all.length) throw new EmptyResult();
      if (all.length >= 3 && all.every((t) => !t.city)) throw new WeakResult(data);
      return data;
    }
  );
  return { data: value, model, attempts, latencyMs };
}

export async function pingWithFailover() {
  const { model, attempts, latencyMs } = await runChain<string>(
    async (ai, model, signal) => {
      const res = await ai.models.generateContent({
        model,
        contents: "Responda apenas com a palavra OK",
        config: { abortSignal: signal },
      });
      return res.text || "";
    },
    (text) => text
  );
  return { model, attempts, latencyMs };
}

// ---------- utilidades de requisição ----------
export function readImagePayload(body: any): { base64: string; mimeType: string } | null {
  let obj = body;
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object" || !obj.image) return null;
  const base64 = String(obj.image).replace(/^data:[^;]+;base64,/, "").trim();
  if (!base64) return null;
  const mimeType = obj.mimeType ? String(obj.mimeType).split(";")[0].trim() : "image/jpeg";
  return { base64, mimeType };
}

export function errorPayload(err: unknown) {
  if (err instanceof ExtractError) {
    // Sugere ao cliente quando tentar de novo (só para indisponibilidade temporária)
    const retryAfterSec = err.kind === "exhausted" && err.httpStatus === 503 ? 15 : undefined;
    return {
      status: err.httpStatus,
      retryAfterSec,
      body: { error: err.kind, details: err.message, kind: err.kind, attempts: err.attempts, retryAfterSec },
    };
  }
  const e = err as any;
  return {
    status: 500,
    body: { error: "internal", details: e?.message || String(e), kind: "internal", attempts: [] },
  };
}
