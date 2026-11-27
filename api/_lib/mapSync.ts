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
  const url = `${MAP_BASE}/api/trpc/serviceScale.list,technicians.list?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  } catch (e: any) {
    throw new MapSyncError("map-network", `Não foi possível acessar o site do mapa: ${e?.message || e}`);
  }
  if (!res.ok) throw new MapSyncError("map-http", `O site do mapa respondeu com erro ${res.status}.`);

  let scale: any[];
  let techs: any[];
  try {
    const body: any = await res.json();
    scale = body[0].result.data.json;
    techs = body[1].result.data.json;
    if (!Array.isArray(scale) || !Array.isArray(techs)) throw new Error("formato");
  } catch {
    throw new MapSyncError("map-format", "O formato da API do mapa mudou. Use o upload de imagem (plano B).");
  }

  if (scale.length === 0) {
    throw new MapSyncError("empty", `Nenhuma escala salva no mapa para ${date}.`, 404);
  }

  const bairroDoTecnico = new Map<number, string>(techs.map((t) => [t.id, String(t.neighborhoodName ?? "").trim()]));
  const sorted = [...scale].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const moto: Technician[] = [];
  const car: Technician[] = [];
  for (const s of sorted) {
    const obs = [s.serviceHours === "night" ? "NOTURNO" : "", String(s.note ?? "").trim()].filter(Boolean).join(" · ");
    const item: Technician = {
      name: String(s.technicianName ?? "").trim(),
      region: s.distributionMode === "citywide" ? "Todas as regiões" : bairroDoTecnico.get(s.technicianId) || "",
      city: String(s.city ?? "").trim(),
      obs,
    };
    if (!item.name) continue;
    (s.vehicle === "moto" ? moto : car).push(item);
  }

  return { moto, car, workDate: date, source: "mapa-etecc" };
}

export function mapErrorPayload(err: any) {
  if (err instanceof MapSyncError) {
    return { status: err.status, body: { error: err.kind, kind: err.kind, details: err.message } };
  }
  return { status: 500, body: { error: "unknown", kind: "map-network", details: err?.message || "Erro inesperado." } };
}
