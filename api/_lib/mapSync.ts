// Busca a escala diária direto da API (tRPC) do site ETECC Mapa, sem usar IA.
// API não oficial: se o formato mudar, o erro "map-format" avisa para usar o upload de imagem.

export type Technician = { name: string; region: string; city: string; obs: string };

const MAP_BASE = (process.env.MAP_API_BASE || "https://etecc-map-ruyh3h2c.manus.space").replace(/\/$/, "");

export class MapSyncError extends Error {
  kind: "bad-date" | "map-http" | "map-format" | "map-network" | "empty";
  status: number;
  constructor(kind: MapSyncError["kind"], message: string, status = 502) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

export function todayInSaoPaulo(): string {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function fetchScaleFromMap(workDate?: string) {
  const date = workDate || todayInSaoPaulo();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new MapSyncError("bad-date", "Data inválida. Use o formato AAAA-MM-DD.", 400);
  }

  const input = {
    "0": { json: { workDate: date } },
    "1": { json: null, meta: { values: ["undefined"] } },
  };
  const url = `${MAP_BASE}/api/trpc/serviceScale.list,neighborhoods.list?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  } catch (e: any) {
    throw new MapSyncError("map-network", `Não foi possível acessar o site do mapa: ${e?.message || e}`);
  }
  if (!res.ok) throw new MapSyncError("map-http", `O site do mapa respondeu com erro ${res.status}.`);

  let scale: any[];
  let neighborhoods: any[];
  try {
    const body: any = await res.json();
    scale = body[0].result.data.json;
    neighborhoods = body[1].result.data.json;
    if (!Array.isArray(scale) || !Array.isArray(neighborhoods)) throw new Error("formato");
  } catch {
    throw new MapSyncError("map-format", "O formato da API do mapa mudou. Use o upload de imagem (plano B).");
  }

  if (scale.length === 0) {
    throw new MapSyncError("empty", `Nenhuma escala salva no mapa para ${date}.`, 404);
  }

  const sorted = [...scale].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const territories = computeTerritories(sorted, neighborhoods);

  const moto: Technician[] = [];
  const car: Technician[] = [];
  const faixas: Record<string, string> = {};
  for (const s of sorted) {
    const obs = [s.serviceHours === "night" ? "NOTURNO" : "", String(s.note ?? "").trim()].filter(Boolean).join(" · ");
    const name = String(s.technicianName ?? "").trim();
    if (!name) continue;
    const terr = s.distributionMode === "citywide" ? null : territories.get(s.id);
    const item: Technician = {
      name,
      region: s.distributionMode === "citywide" ? "Todas as regiões" : (terr?.neighborhoods ?? []).join(" · "),
      city: String(s.city ?? "").trim(),
      obs,
    };
    if (terr) faixas[name] = `${terr.label} (${terr.neighborhoods.length} bairros)`;
    (s.vehicle === "moto" ? moto : car).push(item);
  }

  return { moto, car, faixas, workDate: date, source: "mapa-etecc" };
}


// ---------------------------------------------------------------------------
// Divisão de território — port fiel do cálculo que o site do mapa faz no navegador.
// Por cidade e por tipo de veículo, os bairros que participam da distribuição são
// projetados no eixo principal (PCA, sentido sudoeste → nordeste) e cortados em N
// faixas de largura igual, onde N = técnicos "territory" daquele veículo/cidade,
// na ordem de sortOrder. Técnicos "citywide" atendem a cidade inteira.
// ---------------------------------------------------------------------------
type Nb = { name: string; city: string; latitude: number; longitude: number; participatesInDistribution: boolean };

function principalAxis(pts: Nb[]) {
  if (pts.length < 2) return { x: 1, y: 1 };
  const mx = pts.reduce((a, p) => a + p.longitude, 0) / pts.length;
  const my = pts.reduce((a, p) => a + p.latitude, 0) / pts.length;
  const k = Math.cos((my * Math.PI) / 180);
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) {
    const dx = (p.longitude - mx) * k;
    const dy = p.latitude - my;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const x = Math.abs(Math.cos(ang));
  const y = Math.abs(Math.sin(ang));
  const n = Math.hypot(x, y) || 1;
  return { x: x / n, y: y / n };
}

function project(p: Nb, c: { latitude: number; longitude: number }, a: { x: number; y: number }) {
  const k = Math.cos((c.latitude * Math.PI) / 180);
  return (p.longitude - c.longitude) * k * a.x + (p.latitude - c.latitude) * a.y;
}

function bandLabel(i: number, n: number) {
  if (n === 1) return "Cidade inteira";
  if (n === 2) return i === 0 ? "Região sudoeste" : "Região nordeste";
  if (n === 3) return ["Região sudoeste", "Região central", "Região nordeste"][i] ?? `Faixa ${i + 1}`;
  if (n === 4) return ["Sudoeste", "Centro-sudoeste", "Centro-nordeste", "Nordeste"][i] ?? `Faixa ${i + 1}`;
  return `Faixa ${i + 1} de ${n} (SO → NE)`;
}

function computeTerritories(scale: any[], neighborhoods: any[]) {
  const result = new Map<number, { label: string; neighborhoods: string[] }>();
  const nbs: Nb[] = neighborhoods.filter((n) => typeof n.latitude === "number" && typeof n.longitude === "number");
  const cities = [...new Set(scale.map((s) => s.city))];

  for (const city of cities) {
    const part = nbs.filter((n) => n.city === city && n.participatesInDistribution);
    for (const vehicle of ["moto", "carro"]) {
      const techs = scale.filter((s) => s.city === city && s.vehicle === vehicle && s.distributionMode === "territory");
      if (techs.length === 0) continue;
      if (part.length === 0) {
        techs.forEach((t) => result.set(t.id, { label: bandLabel(0, techs.length), neighborhoods: [] }));
        continue;
      }
      const center = {
        latitude: part.reduce((a, p) => a + p.latitude, 0) / part.length,
        longitude: part.reduce((a, p) => a + p.longitude, 0) / part.length,
      };
      const axis = principalAxis(part);
      const proj = part.map((p) => project(p, center, axis));
      const min = Math.min(...proj);
      const max = Math.max(...proj);
      const step = max > min ? (max - min) / techs.length : 1;
      const cuts = Array.from({ length: techs.length - 1 }, (_, i) => min + step * (i + 1));
      const buckets: string[][] = techs.map(() => []);
      part.forEach((p, i) => {
        let idx = 0;
        for (const c of cuts) if (proj[i] >= c) idx++;
        buckets[Math.min(idx, techs.length - 1)].push(p.name);
      });
      techs.forEach((t, i) =>
        result.set(t.id, { label: bandLabel(i, techs.length), neighborhoods: buckets[i].sort((a, b) => a.localeCompare(b, "pt-BR")) })
      );
    }
  }
  return result;
}

export function mapErrorPayload(err: any) {
  if (err instanceof MapSyncError) {
    return { status: err.status, body: { error: err.kind, kind: err.kind, details: err.message } };
  }
  return { status: 500, body: { error: "unknown", kind: "map-network", details: err?.message || "Erro inesperado." } };
}
