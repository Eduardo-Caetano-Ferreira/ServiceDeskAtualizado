import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  FileImage, 
  Loader2, 
  Bike, 
  Car, 
  MapPin, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Search, 
  Sparkles
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { db } from '../lib/firebase';

export function Inicio() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'moto', 'car'

  // Firestore state for technicians
  const [data, setData] = useState({ moto: [], car: [] });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "techniciansList", "current"), (docSnap) => {
      if (docSnap.exists()) {
        const docData = docSnap.data();
        setData({
          moto: Array.isArray(docData.moto) ? docData.moto : [],
          car: Array.isArray(docData.car) ? docData.car : []
        });
      }
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Por favor, selecione um arquivo de imagem válido (PNG, JPG, etc).");
        return;
      }
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Por favor, solte apenas arquivos de imagem.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processWithClientGemini = async (file, apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? result.split(',')[1] : '';
        resolve(base64);
      };
      reader.onerror = reject;
    });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type || 'image/png',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    let jsonStr = (response.text || '{}').trim();
    jsonStr = jsonStr.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();

    let extractedData = { moto: [], car: [] };
    try {
      extractedData = JSON.parse(jsonStr);
    } catch {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    }

    return extractedData;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor, selecione uma imagem de escala primeiro.");
      return;
    }

    setIsUploading(true);
    setError(null);

    let extractedData = null;
    let backendSuccess = false;

    try {
      // 1. Tenta via servidor (/api/extract-technicians)
      try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch('/api/extract-technicians', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          extractedData = await response.json();
          backendSuccess = true;
        }
      } catch {
        // Se a chamada de API falhar, cai para o fallback do cliente
      }

      // 2. Fallback direto no cliente
      if (!backendSuccess) {
        const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY');
        if (!clientApiKey) {
          throw new Error("A chave da API GEMINI_API_KEY não foi configurada.");
        }

        extractedData = await processWithClientGemini(selectedFile, clientApiKey);
      }

      const sanitizedData = {
        moto: Array.isArray(extractedData?.moto) ? extractedData.moto : [],
        car: Array.isArray(extractedData?.car) ? extractedData.car : []
      };

      // Save extracted data to Firestore including updatedAt timestamp
      await setDoc(doc(db, "techniciansList", "current"), {
        ...sanitizedData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao processar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };


  // Filter helper
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.region && item.region.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.obs && item.obs.toLowerCase().includes(q))
    );
  };

  const filteredMoto = filterList(data.moto);
  const filteredCar = filterList(data.car);
  const totalCount = data.moto.length + data.car.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto space-y-5 pb-20 px-4 sm:px-6"
    >
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-xl text-red-600">
            <Sparkles className="w-5 h-5" />
          </div>
          Análise e Escala de Técnicos
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Envie a imagem da tabela de escala para extrair e organizar automaticamente os técnicos em MOTO e CARRO.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Upload Panel (Compact) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
              <UploadCloud className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-800">Enviar Imagem da Escala</h2>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Arraste ou selecione a imagem da escala para atualizar a lista automaticamente.
            </p>

            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-xl p-4 transition flex flex-col items-center justify-center relative overflow-hidden group min-h-[140px] ${
                previewUrl ? 'border-red-400 bg-red-50/20' : 'border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-slate-100/80'
              }`}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploading}
              />

              {previewUrl ? (
                <div className="w-full flex flex-col items-center justify-center space-y-2">
                  <div className="relative w-full max-h-40 rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-black/5">
                    <img src={previewUrl} alt="Preview da escala" className="w-full h-full object-contain max-h-36" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded shadow-xs border border-slate-200 truncate max-w-full">
                    {selectedFile?.name}
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-1.5 p-2">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Clique ou arraste a imagem</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-red-50 text-red-700 text-xs p-2.5 rounded-xl border border-red-200 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="font-medium text-[11px]">{error}</p>
              </motion.div>
            )}
          </div>

          <div>
            <button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-all shadow-xs ${
                !selectedFile || isUploading
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow active:scale-[0.99]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  Analisando Escala...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analisar e Extrair Dados
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Data Display Section */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[480px]">
          <div className="flex-grow flex flex-col space-y-4">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-bold text-slate-800">
                  Técnicos Extraídos ({totalCount})
                </h2>
              </div>

              {/* Filter and Search */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome, cidade..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 w-44 sm:w-56"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subtabs for filtering Moto / Carro */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  onClick={() => setActiveTab('moto')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'moto'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  MOTO ({data.moto.length})
                </button>
                <button
                  onClick={() => setActiveTab('car')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'car'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  CARRO ({data.car.length})
                </button>
              </div>
            )}

            {/* Data Content */}
            {totalCount === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-slate-600 font-bold text-sm">Nenhum técnico extraído ainda</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">
                  Envie a imagem da escala no painel para processar e visualizar os dados dos técnicos divididos em MOTO e CARRO.
                </p>
              </div>
            ) : (
              <div className="space-y-5 flex-grow overflow-y-auto max-h-[600px] pr-1">
                {/* MOTO SECTION */}
                {(activeTab === 'all' || activeTab === 'moto') && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 p-2 rounded-xl text-amber-900">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        <div className="bg-amber-500 text-white p-1 rounded-md">
                          <Bike className="w-3.5 h-3.5" />
                        </div>
                        Categoria MOTO ({filteredMoto.length})
                      </div>
                    </div>

                    {filteredMoto.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-2 py-1">
                        Nenhum técnico de moto encontrado{searchQuery ? ' para esta busca' : ''}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="px-3.5 py-2">Técnico</th>
                              <th className="px-3.5 py-2">Região / Setor</th>
                              <th className="px-3.5 py-2">Cidade</th>
                              <th className="px-3.5 py-2">Observações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredMoto.map((tech, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 font-bold text-slate-800 flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-[9px]">
                                    {(tech.name || 'T').substring(0, 2).toUpperCase()}
                                  </div>
                                  {tech.name || 'Sem nome'}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {tech.region || '-'}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                    {tech.city || '-'}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-500 max-w-xs truncate" title={tech.obs}>
                                  {tech.obs || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* CARRO SECTION */}
                {(activeTab === 'all' || activeTab === 'car') && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200/80 p-2 rounded-xl text-blue-900">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        <div className="bg-blue-600 text-white p-1 rounded-md">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        Categoria CARRO ({filteredCar.length})
                      </div>
                    </div>

                    {filteredCar.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-2 py-1">
                        Nenhum técnico de carro encontrado{searchQuery ? ' para esta busca' : ''}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="px-3.5 py-2">Técnico</th>
                              <th className="px-3.5 py-2">Região / Setor</th>
                              <th className="px-3.5 py-2">Cidade</th>
                              <th className="px-3.5 py-2">Observações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredCar.map((tech, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-3.5 py-2.5 font-bold text-slate-800 flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-[9px]">
                                    {(tech.name || 'T').substring(0, 2).toUpperCase()}
                                  </div>
                                  {tech.name || 'Sem nome'}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {tech.region || '-'}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                    {tech.city || '-'}
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-500 max-w-xs truncate" title={tech.obs}>
                                  {tech.obs || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </motion.div>
  );
}

