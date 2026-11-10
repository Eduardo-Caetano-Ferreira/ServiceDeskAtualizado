import { extractWithFailover, readImagePayload, errorPayload } from "./_lib/gemini.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method", details: "Método não permitido." });
  }

  const payload = readImagePayload(req.body);
  if (!payload) {
    return res
      .status(400)
      .json({ error: "no-image", kind: "abort", details: "Nenhuma imagem enviada no corpo da requisição." });
  }

  try {
    const { data, model, attempts, latencyMs } = await extractWithFailover(payload.base64, payload.mimeType);
    console.log(`[extract] ok com ${model} em ${latencyMs}ms (${attempts.length} tentativa(s))`);
    return res.status(200).json({ ...data, modelUsed: model, latencyMs, attempts });
  } catch (err) {
    const { status, body } = errorPayload(err);
    console.error("[extract] falhou:", JSON.stringify(body));
    return res.status(status).json(body);
  }
}
