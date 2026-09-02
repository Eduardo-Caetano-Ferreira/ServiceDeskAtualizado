import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const upload = multer({ storage: multer.memoryStorage() });

function getApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
}

function getAi() {
  const key = getApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }
  return new GoogleGenAI({
    apiKey: key,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.post("/api/extract-technicians", upload.single("image"), async (req, res) => {
    try {
      let base64Data = "";
      let mimeType = "image/jpeg";

      if (req.body && req.body.image) {
        base64Data = req.body.image.replace(/^data:[^;]+;base64,/, "").trim();
        if (req.body.mimeType) {
          mimeType = String(req.body.mimeType).split(';')[0].trim();
        }
      } else if (req.file) {
        mimeType = req.file.mimetype || "image/jpeg";
        base64Data = req.file.buffer.toString("base64");
      }

      if (!base64Data) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({ 
          error: "A chave da API GEMINI_API_KEY não está configurada no servidor.",
          details: "Configure a variável GEMINI_API_KEY no ambiente."
        });
      }

      const prompt = `Analise detalhadamente esta imagem de uma escala/tabela de técnicos.
Extraia todos os técnicos organizados em duas listas: MOTO e CARRO.
Para cada técnico identificado, extraia:
- name: Nome completo ou identificação do técnico
- region: Região, setor ou rota atendida
- city: Cidade ou localidade
- obs: Observações (horário, restrições, disponibilidade, telefone, avisos adicionais)

Retorne EXCLUSIVAMENTE um objeto JSON no formato abaixo, sem formatação markdown ou texto ao redor:
{
  "moto": [
    {
      "name": "Nome",
      "region": "Região/Setor",
      "city": "Cidade",
      "obs": "Observações"
    }
  ],
  "car": [
    {
      "name": "Nome",
      "region": "Região/Setor",
      "city": "Cidade",
      "obs": "Observações"
    }
  ]
}
Se uma categoria não tiver técnicos, retorne o array vazio [].`;

      const aiClient = getAi();
      const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest"
      ];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await aiClient.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType,
                    },
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          if (response && response.text) {
            console.log(`Extração concluída com sucesso usando o modelo: ${modelName}`);
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          console.warn(`Tentativa com modelo ${modelName} falhou:`, modelErr?.message || modelErr);
          // Pequena pausa antes de tentar o próximo modelo caso seja erro de concorrência ou 503
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (!response || !response.text) {
        let cleanErrorMsg = "Os servidores de processamento de imagem estão com alta demanda temporária. Por favor, aguarde alguns instantes e tente novamente.";
        if (lastError?.message && !lastError.message.includes("503") && !lastError.message.includes("high demand")) {
          cleanErrorMsg = lastError.message;
        }
        return res.status(503).json({
          error: "Servidores temporariamente ocupados",
          details: cleanErrorMsg
        });
      }

      let jsonStr = (response.text || "{}").trim();
      
      // Sanitize JSON response string in case markdown codeblocks were returned
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/gi, "").replace(/\s*```$/g, "").trim();

      let data = { moto: [], car: [] };
      try {
        data = JSON.parse(jsonStr);
        if (!data.moto) data.moto = [];
        if (!data.car) data.car = [];
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini:", parseError, "Raw output:", jsonStr);
        // Try regex extraction of JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
            if (!data.moto) data.moto = [];
            if (!data.car) data.car = [];
          } catch (e) {
            console.error("Regex JSON parse failed:", e);
          }
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("Erro na extração:", error);
      res.status(500).json({ 
        error: "Falha ao processar a imagem.", 
        details: error.message || String(error) 
      });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
