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

  app.use(express.json());

  app.post("/api/extract-technicians", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: "A chave da API do Gemini não está configurada." });
      }

      const mimeType = req.file.mimetype || "image/png";
      const base64Data = req.file.buffer.toString("base64");

      const prompt = `Analise esta imagem de uma escala/tabela de técnicos.
Extraia os dados dos técnicos divididos em MOTO e CARRO.
Retorne APENAS um objeto JSON no seguinte formato exato, sem textos explicativos adicionais ou marcações fora do JSON:

{
  "moto": [
    {
      "name": "Nome do Técnico",
      "region": "Região/Setor",
      "city": "Cidade",
      "obs": "Observações (ex: horário, disponibilidade, restrições)"
    }
  ],
  "car": [
    {
      "name": "Nome do Técnico",
      "region": "Região/Setor",
      "city": "Cidade",
      "obs": "Observações"
    }
  ]
}
Se não encontrar dados de alguma categoria, retorne o array correspondente vazio [].`;

      const aiClient = getAi();
      const response = await aiClient.models.generateContent({
        model: "gemini-3.6-flash",
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

      let jsonStr = (response.text || "{}").trim();
      
      // Sanitize JSON response string in case markdown codeblocks were returned
      jsonStr = jsonStr.replace(/^```(json)?/gi, "").replace(/```$/g, "").trim();

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
      res.status(500).json({ error: "Falha ao processar a imagem.", details: error.message || String(error) });
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
