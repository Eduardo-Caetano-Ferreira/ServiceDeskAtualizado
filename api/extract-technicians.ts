import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

const app = express();
app.use(express.json());

function getAi() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY não configurada no ambiente do Vercel.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.all("*", upload.single("image"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "A chave GEMINI_API_KEY não está configurada nas variáveis de ambiente do Vercel." });
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
    jsonStr = jsonStr.replace(/^```(json)?/gi, "").replace(/```$/g, "").trim();

    let data = { moto: [], car: [] };
    try {
      data = JSON.parse(jsonStr);
      if (!data.moto) data.moto = [];
      if (!data.car) data.car = [];
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini:", parseError, "Raw output:", jsonStr);
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

export default app;
