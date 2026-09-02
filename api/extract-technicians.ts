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
      base64Data = req.body.image.replace(/^data:[^;]+;base64,/, "").trim();
      if (req.body.mimeType) {
        mimeType = String(req.body.mimeType).split(';')[0].trim();
      }
    } else if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed.image) {
          base64Data = parsed.image.replace(/^data:[^;]+;base64,/, "").trim();
          if (parsed.mimeType) mimeType = String(parsed.mimeType).split(';')[0].trim();
        }
      } catch (e) {
        console.error("Erro ao analisar body da requisição:", e);
      }
    }

    if (!base64Data) {
      return res.status(400).json({ error: "Nenhuma imagem enviada no corpo da requisição." });
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

    const ai = new GoogleGenAI({ apiKey });
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
        response = await ai.models.generateContent({
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
          console.log(`Endpoint Vercel: Sucesso com ${modelName}`);
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Vercel endpoint: modelo ${modelName} falhou:`, modelErr?.message || modelErr);
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
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/gi, "").replace(/\s*```$/g, "").trim();

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
