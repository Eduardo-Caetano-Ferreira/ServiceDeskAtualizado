import { pingWithFailover, errorPayload } from "./_lib/gemini.js";

export default async function handler(_req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  try {
    const { model, attempts, latencyMs } = await pingWithFailover();
    return res.status(200).json({
      success: true,
      status: "online",
      model,
      latencyMs,
      attempts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const { status, body } = errorPayload(err);
    return res.status(status).json({ success: false, status: "error", timestamp: new Date().toISOString(), ...body });
  }
}
