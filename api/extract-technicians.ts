import { GoogleGenAI } from "@google/genai";

function getApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ 
        error: "A chave GEMINI_API_KEY não foi encontrada nas variáveis de ambiente do Vercel.",
        details: "Certifique-se de ter adicionado GEMINI_API_KEY nas Environment Variables do Vercel e realizado um REDEPLOY." 
      });
    }

    let base64Data = "";
    let mimeType = "image/jpeg";

    if (req.body && typeof req.body === 'object' && req.body.image) {
      base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
      if (req.body.mimeType) {
        mimeType = req.body.mimeType;
      }
    } else if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed.image) {
          base64Data = parsed.image.replace(/^data:image\/\w+;base64,/, "");
          if (parsed.mimeType) mimeType = parsed.mimeType;
        }
      } catch (e) {
        console.error("Erro ao analisar body da requisição:", e);
      }
    }

    if (!base64Data) {
      return res.status(400).json({ error: "Nenhuma imagem enviada no corpo da requisição." });
    }

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

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Erro na extração:", error);
    return res.status(500).json({ 
      error: "Falha ao processar a imagem.", 
      details: error.message || String(error) 
    });
  }
}
