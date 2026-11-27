import { fetchScaleFromMap, mapErrorPayload } from "./_lib/mapSync.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method", details: "Método não permitido." });
  }
  try {
    const date = typeof req.query?.date === "string" ? req.query.date : undefined;
    const data = await fetchScaleFromMap(date);
    return res.status(200).json(data);
  } catch (err) {
    const { status, body } = mapErrorPayload(err);
    console.error("[sync-map] falhou:", JSON.stringify(body));
    return res.status(status).json(body);
  }
}
