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
  if (key) {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return new GoogleGenAI({
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Modelos em ordem de prioridade conforme instrução do usuário:
// 1º Versão Lite (ultra-rápida e eficiente)
// 2º Em sequência, outras versões caso a Lite não responda
const MODELS_SEQUENCE = [
  "gemini-3.1-flash-lite", // 1ª opção: Versão Lite prioritária
  "gemini-3.8-flash",      // 2ª opção: Versão Flash principal
  "gemini-3.5-flash",      // 3ª opção: Versão alternativa
  "gemini-flash-latest"    // 4ª opção: Versão Flash mais recente (alias)
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Endpoint para testar conexão com a API do Gemini e registrar status
  app.get("/api/test-gemini", async (_req, res) => {
    const startTime = Date.now();
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          status: "error",
          error: "Chave GEMINI_API_KEY não configurada no servidor",
          timestamp: new Date().toISOString()
        });
      }

      const aiClient = getAi();
      let response: any = null;
      let usedModel = "";
      let lastError: any = null;
      const attempts: any[] = [];

      for (const modelName of MODELS_SEQUENCE) {
        const modelStart = Date.now();
        try {
          response = await aiClient.models.generateContent({
            model: modelName,
            contents: "Responda apenas com a palavra OK",
          });
          if (response && response.text) {
            usedModel = modelName;
            attempts.push({ model: modelName, success: true, latencyMs: Date.now() - modelStart });
            break;
          }
        } catch (err: any) {
          lastError = err;
          attempts.push({ model: modelName, success: false, error: err?.message || String(err) });
          console.warn(`[Teste Gemini] Modelo ${modelName} falhou: ${err?.message || err}. Tentando próximo...`);
        }
      }

      if (!response || !response.text) {
        throw new Error(lastError?.message || "Nenhuma versão do Gemini respondeu ao teste.");
      }

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        status: "online",
        model: usedModel,
        latencyMs,
        attempts,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erro no teste da API Gemini:", err);
      return res.status(500).json({
        success: false,
        status: "error",
        error: "Falha na comunicação com a API do Gemini",
        details: err?.message || String(err),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Endpoint para extrair técnicos da escala a partir de imagem
  app.post("/api/extract-technicians", upload.single("image"), async (req, res) => {
    const startTime = Date.now();
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
      let response: any = null;
      let usedModel = "";
      let lastError: any = null;
      const failedAttempts: any[] = [];

      // Executa a leitura tentando primeiro a versão Lite, e se falhar testa as outras versões em sequência
      for (const modelName of MODELS_SEQUENCE) {
        try {
          console.log(`[IA Leitura] Tentando processar imagem com modelo: ${modelName}...`);
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
            usedModel = modelName;
            console.log(`[IA Sucesso] Imagem lida com sucesso utilizando o modelo: ${usedModel}`);
            break;
          }
        } catch (modelErr: any) {
          lastError = modelErr;
          failedAttempts.push({ model: modelName, error: modelErr?.message || String(modelErr) });
          console.warn(`[IA Fallback] Modelo ${modelName} falhou: ${modelErr?.message || modelErr}. Tentando próximo modelo da sequência...`);
          // Pequena pausa se for indisponibilidade temporária antes do próximo modelo
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (!response || !response.text) {
        let cleanErrorMsg = "Os servidores de processamento de imagem estão temporariamente sobrecarregados. Por favor, aguarde alguns instantes e tente novamente.";
        if (lastError?.message && !lastError.message.includes("503") && !lastError.message.includes("high demand") && !lastError.message.includes("UNAVAILABLE")) {
          cleanErrorMsg = lastError.message;
        }
        return res.status(503).json({
          error: "Servidores temporariamente ocupados",
          details: cleanErrorMsg,
          failedAttempts
        });
      }

      let jsonStr = (response.text || "{}").trim();
      
      // Sanitiza JSON caso markdown tenha sido incluído
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/gi, "").replace(/\s*```$/g, "").trim();

      let data: any = { moto: [], car: [] };
      try {
        data = JSON.parse(jsonStr);
        if (!data.moto) data.moto = [];
        if (!data.car) data.car = [];
      } catch (parseError) {
        console.error("Erro ao converter JSON do Gemini:", parseError, "Texto bruto:", jsonStr);
        // Tenta extração via regex de objeto JSON
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
            if (!data.moto) data.moto = [];
            if (!data.car) data.car = [];
          } catch (e) {
            console.error("Falha ao analisar JSON via regex:", e);
          }
        }
      }

      data.modelUsed = usedModel;
      data.latencyMs = Date.now() - startTime;

      res.json(data);
    } catch (error: any) {
      console.error("Erro na extração de técnicos:", error);
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
