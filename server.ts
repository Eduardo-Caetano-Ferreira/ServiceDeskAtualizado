import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import {
  extractWithFailover,
  pingWithFailover,
  readImagePayload,
  errorPayload,
} from "./api/_lib/gemini.js";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Teste de conexão: exercita a mesma cadeia de failover da extração
  app.get("/api/test-gemini", async (_req, res) => {
    try {
      const { model, attempts, latencyMs } = await pingWithFailover();
      res.json({
        success: true,
        status: "online",
        model,
        latencyMs,
        attempts,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const { status, body } = errorPayload(err);
      res.status(status).json({ success: false, status: "error", timestamp: new Date().toISOString(), ...body });
    }
  });

  // Extração de técnicos a partir da imagem da escala
  app.post("/api/extract-technicians", upload.single("image"), async (req, res) => {
    let payload = readImagePayload(req.body);
    if (!payload && req.file) {
      payload = { base64: req.file.buffer.toString("base64"), mimeType: req.file.mimetype || "image/jpeg" };
    }
    if (!payload) {
      return res.status(400).json({ error: "no-image", kind: "abort", details: "Nenhuma imagem enviada." });
    }

    try {
      const { data, model, attempts, latencyMs } = await extractWithFailover(payload.base64, payload.mimeType);
      console.log(`[extract] ok com ${model} em ${latencyMs}ms (${attempts.length} tentativa(s))`);
      res.json({ ...data, modelUsed: model, latencyMs, attempts });
    } catch (err) {
      const { status, body, retryAfterSec } = errorPayload(err) as any;
      if (retryAfterSec) res.setHeader("Retry-After", String(retryAfterSec));
      console.error("[extract] falhou:", JSON.stringify(body));
      res.status(status).json(body);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
