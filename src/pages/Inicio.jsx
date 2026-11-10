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
  Sparkles,
  Activity,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Undo2, CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../lib/firebase';

export function Inicio() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'moto', 'car'
  const [copiedTechId, setCopiedTechId] = useState(null);

  // Gemini Connection Test State
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(() => {
    const local = localStorage.getItem('gemini_last_test_result');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Resultado extraído aguardando confirmação do operador (não grava até confirmar)
  const [pending, setPending] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  // Última escala válida (backup para "Desfazer")
  const [previous, setPrevious] = useState(null);
  const [lastAttempts, setLastAttempts] = useState([]);

  // Firestore state for technicians and last sync
  const [data, setData] = useState({
    moto: [], 
    car: [], 
    updatedAt: null,
    geminiLastSync: null,
    geminiStatus: null,
    geminiModel: null,
    geminiLatencyMs: null
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "techniciansList", "current"), (docSnap) => {
      if (docSnap.exists()) {
        const docData = docSnap.data();
        setData({
          moto: Array.isArray(docData.moto) ? docData.moto : [],
          car: Array.isArray(docData.car) ? docData.car : [],
          updatedAt: docData.updatedAt || null,
          geminiLastSync: docData.geminiLastSync || docData.updatedAt || null,
          // Sem valor padrão "online": só mostra online se houve sincronização/teste real
          geminiStatus: docData.geminiStatus || null,
          geminiModel: docData.geminiModel || null,
          geminiLatencyMs: docData.geminiLatencyMs || null
        });
      }
    });
    const unsubPrev = onSnapshot(doc(db, "techniciansList", "previous"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setPrevious({
          moto: Array.isArray(d.moto) ? d.moto : [],
          car: Array.isArray(d.car) ? d.car : [],
          updatedAt: d.updatedAt || null
        });
      } else {
        setPrevious(null);
      }
    });
    return () => {
      unsub();
      unsubPrev();
    };
  }, []);

  // Mensagem amigável por tipo de falha vinda do failover do servidor
  const friendlyError = (parsed, status) => {
    const kind = parsed?.kind;
    if (kind === 'abort') return parsed.details || "A imagem não pôde ser processada. Tente outra captura.";
    if (kind === 'empty') return parsed.details;
    if (kind === 'no-key') return "A IA não está configurada no servidor (chave ausente). Avise o administrador.";
    if (kind === 'exhausted' && status === 502) return "A chave da API foi rejeitada. Avise o administrador.";
    if (kind === 'exhausted') return "A IA está indisponível no momento (todos os modelos falharam). Tente novamente em instantes.";
    return parsed?.details || parsed?.error || `Erro ${status}: falha ao processar a imagem`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Nunca sincronizado';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Nunca sincronizado';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
    } catch {
      return 'Nunca sincronizado';
    }
  };

  const processSelectedFile = (file) => {
    if (!file) return;
    const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '');
    if (!isImage) {
      setError("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Paste listener for clipboard images (Ctrl + V)
  useEffect(() => {
    const handleWindowPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processSelectedFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    } else {
      setError("Por favor, solte apenas arquivos de imagem.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Redimensiona (máx. 1600px) e reencoda como JPEG até o base64 ficar abaixo de ~3 MB,
  // para não estourar o limite de ~4,5 MB do body das funções da Vercel.
  const MAX_DIM = 1600;
  const MAX_BASE64_BYTES = 3 * 1024 * 1024;
  const compressImageIfNeeded = async (file) => {
    const estimateBase64 = (bytes) => Math.ceil(bytes * 1.37);
    return new Promise((resolve) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = async () => {
          URL.revokeObjectURL(url);
          const needsResize = img.width > MAX_DIM || img.height > MAX_DIM;
          if (!needsResize && estimateBase64(file.size) <= MAX_BASE64_BYTES && file.size < 800 * 1024) {
            return resolve(file);
          }

          let scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
          let quality = 0.82;
          const fileName = file.name ? file.name.replace(/\.[^/.]+$/, ".jpg") : "escala.jpg";

          for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(file);
            ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco no JPEG
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
            if (!blob) return resolve(file);
            if (estimateBase64(blob.size) <= MAX_BASE64_BYTES || i === 5) {
              return resolve(new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() }));
            }
            quality = Math.max(0.5, quality - 0.1);
            scale *= 0.8;
          }
          resolve(file);
        };
        img.onerror = () => resolve(file);
        img.src = url;
      } catch {
        resolve(file);
      }
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Test Gemini API communication
  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setError(null);
    try {
      const response = await fetch('/api/test-gemini');
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("O servidor não respondeu em formato válido (endpoint de teste indisponível).");
      }
      setLastAttempts(Array.isArray(result.attempts) ? result.attempts : []);

      if (response.ok && result.success) {
        const testPayload = {
          success: true,
          status: 'online',
          model: result.model || 'gemini-3.1-flash-lite',
          latencyMs: result.latencyMs,
          timestamp: result.timestamp || new Date().toISOString()
        };

        setGeminiTestResult(testPayload);
        localStorage.setItem('gemini_last_test_result', JSON.stringify(testPayload));

        // Save last synchronization in Firestore
        await setDoc(doc(db, "techniciansList", "current"), {
          geminiLastSync: testPayload.timestamp,
          geminiStatus: 'online',
          geminiModel: testPayload.model,
          geminiLatencyMs: testPayload.latencyMs
        }, { merge: true });
      } else {
        throw new Error(friendlyError(result, response.status));
      }
    } catch (err) {
      console.error("Erro no teste da API Gemini:", err);
      const errPayload = {
        success: false,
        status: 'error',
        error: err.message || "Falha ao comunicar com o servidor",
        timestamp: new Date().toISOString()
      };
      setGeminiTestResult(errPayload);
      localStorage.setItem('gemini_last_test_result', JSON.stringify(errPayload));
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor, selecione uma imagem de escala primeiro.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileToUpload = await compressImageIfNeeded(selectedFile);
      const base64Data = await fileToBase64(fileToUpload);

      let extractedData = null;
      let lastErrorMessage = "";

      // O servidor já faz o failover entre modelos/chaves; aqui só repetimos em falha de rede.
      for (let attempt = 1; attempt <= 2 && !extractedData; attempt++) {
        try {
          const response = await fetch('/api/extract-technicians', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              mimeType: fileToUpload.type || 'image/jpeg',
            }),
          });

          const responseText = await response.text();
          let parsed;
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = { details: response.status === 413 ? "Imagem muito grande. Tente um print menor." : responseText.slice(0, 200) };
          }

          if (response.ok && (parsed.moto || parsed.car)) {
            extractedData = parsed;
          } else {
            lastErrorMessage = friendlyError(parsed, response.status);
            setLastAttempts(Array.isArray(parsed.attempts) ? parsed.attempts : []);

            // Indisponibilidade temporária: respeita o Retry-After enviado pelo servidor
            const retryHeader = Number(response.headers.get('Retry-After')) || parsed.retryAfterSec || 0;
            if (response.status === 503 && retryHeader > 0 && retryHeader <= 30 && attempt < 2) {
              for (let s = retryHeader; s > 0; s--) {
                setRetryCountdown(s);
                await new Promise((r) => setTimeout(r, 1000));
              }
              setRetryCountdown(0);
              continue;
            }
            break; // erro definitivo ou failover esgotado
          }
        } catch (fetchErr) {
          lastErrorMessage = fetchErr?.message || "Erro de conexão ao enviar a imagem.";
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!extractedData) {
        throw new Error(lastErrorMessage || "Não foi possível extrair os técnicos da imagem. Tente novamente.");
      }

      setLastAttempts(Array.isArray(extractedData.attempts) ? extractedData.attempts : []);

      // Não grava ainda: o operador revisa e confirma antes de publicar
      setPending({
        moto: Array.isArray(extractedData.moto) ? extractedData.moto : [],
        car: Array.isArray(extractedData.car) ? extractedData.car : [],
        modelUsed: extractedData.modelUsed || null,
        latencyMs: extractedData.latencyMs || null
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao conectar com o servidor para processar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  // Publica a escala revisada, guardando a anterior como backup
  const handleConfirmPublish = async () => {
    if (!pending) return;
    const clean = (list) => list
      .map((t) => ({ name: (t.name || '').trim(), region: (t.region || '').trim(), city: (t.city || '').trim(), obs: (t.obs || '').trim() }))
      .filter((t) => t.name);
    const cleanMoto = clean(pending.moto);
    const cleanCar = clean(pending.car);
    if (cleanMoto.length + cleanCar.length === 0) {
      setError("A escala está vazia. Descarte ou mantenha ao menos um técnico.");
      return;
    }
    setIsPublishing(true);
    setError(null);
    try {
      const nowIso = new Date().toISOString();

      if (data.moto.length + data.car.length > 0) {
        await setDoc(doc(db, "techniciansList", "previous"), {
          moto: data.moto,
          car: data.car,
          updatedAt: data.updatedAt || null,
          backedUpAt: nowIso
        });
      }

      await setDoc(doc(db, "techniciansList", "current"), {
        moto: cleanMoto,
        car: cleanCar,
        updatedAt: nowIso,
        geminiLastSync: nowIso,
        geminiStatus: 'online',
        geminiModel: pending.modelUsed,
        geminiLatencyMs: pending.latencyMs
      }, { merge: true });

      const syncObj = {
        success: true,
        status: 'online',
        model: pending.modelUsed,
        latencyMs: pending.latencyMs,
        timestamp: nowIso
      };
      setGeminiTestResult(syncObj);
      localStorage.setItem('gemini_last_test_result', JSON.stringify(syncObj));

      setPending(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a escala: " + (err.message || "erro desconhecido"));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardPending = () => setPending(null);

  const updatePendingItem = (list, idx, field, value) => {
    setPending((p) => ({
      ...p,
      [list]: p[list].map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    }));
  };

  const removePendingItem = (list, idx) => {
    setPending((p) => ({ ...p, [list]: p[list].filter((_, i) => i !== idx) }));
  };

  // Restaura a escala anterior (backup salvo na última publicação)
  const handleUndo = async () => {
    if (!previous) return;
    try {
      const nowIso = new Date().toISOString();
      // Troca: a escala atual vira o novo backup, permitindo desfazer o desfazer
      await setDoc(doc(db, "techniciansList", "previous"), {
        moto: data.moto,
        car: data.car,
        updatedAt: data.updatedAt || null,
        backedUpAt: nowIso
      });
      await setDoc(doc(db, "techniciansList", "current"), {
        moto: previous.moto,
        car: previous.car,
        updatedAt: previous.updatedAt || nowIso
      }, { merge: true });
    } catch (err) {
      console.error(err);
      setError("Não foi possível restaurar a escala anterior.");
    }
  };

  const copyTechData = (tech, id) => {
    const text = `Técnico: ${tech.name || '-'}\nRegião: ${tech.region || '-'}\nCidade: ${tech.city || '-'}${tech.obs ? `\nObs: ${tech.obs}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedTechId(id);
    setTimeout(() => setCopiedTechId(null), 2000);
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
  const lastSyncTimestamp = data.geminiLastSync || geminiTestResult?.timestamp || data.updatedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full space-y-4 pb-12"
    >
      {/* GRID COM APROVEITAMENTO DE 100% DO ESPAÇO */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start w-full">
        
        {/* CARD 1: PAINEL DE ESCALA & TESTE DA API GEMINI (4 colunas no XL) */}
        <div className="xl:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col space-y-4">
          
          {/* Header do Card de Upload */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Enviar Escala Diária</h2>
                <p className="text-[11px] text-slate-400">Extração inteligente com IA Gemini</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
              Ctrl + V
            </span>
          </div>

          {/* ÁREA DE DRAG & DROP / PREVIEW */}
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center relative overflow-hidden group min-h-[170px] ${
              previewUrl 
                ? 'border-red-400 bg-red-50/20' 
                : 'border-slate-300 bg-slate-50/70 hover:border-red-400 hover:bg-slate-100/80'
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
              <div className="w-full flex flex-col items-center justify-center space-y-2.5 z-20 pointer-events-auto">
                <div className="relative w-full max-h-44 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-black/5 flex items-center justify-center">
                  <img src={previewUrl} alt="Preview da escala" className="w-full h-full object-contain max-h-40" />
                </div>
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg shadow-xs border border-slate-200 truncate max-w-[200px]">
                    {selectedFile?.name || 'Imagem colada'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition"
                  >
                    Trocar Imagem
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 p-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-xs">
                  <FileImage className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Arraste a escala aqui ou cole com Ctrl+V</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Suporta fotos e capturas de tela (JPG, PNG, WEBP)</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="font-semibold text-[11px] leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* BOTÃO PRINCIPAL DE EXTRAÇÃO */}
          <button 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-sm ${
              !selectedFile || isUploading
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                {retryCountdown > 0 ? `IA ocupada, nova tentativa em ${retryCountdown}s...` : 'Extraindo Técnicos com Gemini...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Processar e Carregar Escala
              </>
            )}
          </button>

          {/* REVISÃO DO RESULTADO ANTES DE PUBLICAR */}
          {pending && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-700 leading-relaxed">
                  <p className="font-extrabold text-slate-800 text-xs">Revise antes de publicar</p>
                  A IA encontrou <strong>{pending.moto.length} de moto</strong> e <strong>{pending.car.length} de carro</strong>
                  {pending.modelUsed ? <> (modelo <span className="font-mono">{pending.modelUsed}</span>)</> : null}.
                  {totalCount > 0 && (
                    <> A escala atual ({data.moto.length} moto / {data.car.length} carro) será substituída, com backup para desfazer.</>
                  )}
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-amber-200 bg-white text-[11px] divide-y divide-slate-100">
                {[
                  ...pending.moto.map((t, idx) => ({ t, idx, list: 'moto' })),
                  ...pending.car.map((t, idx) => ({ t, idx, list: 'car' }))
                ].map(({ t, idx, list }) => (
                  <div key={`${list}-${idx}`} className="px-2 py-1.5 flex items-center gap-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${list === 'moto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {list === 'moto' ? 'MOTO' : 'CARRO'}
                    </span>
                    {['name', 'region', 'city'].map((field) => (
                      <input
                        key={field}
                        value={t[field] || ''}
                        onChange={(e) => updatePendingItem(list, idx, field, e.target.value)}
                        placeholder={field === 'name' ? 'Nome' : field === 'region' ? 'Região' : 'Cidade'}
                        className={`min-w-0 flex-1 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] focus:outline-none focus:border-red-500 ${field === 'name' ? 'font-bold text-slate-800' : 'text-slate-600'}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => removePendingItem(list, idx)}
                      title="Remover da escala"
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                  className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirmar e publicar
                </button>
                <button
                  type="button"
                  onClick={handleDiscardPending}
                  disabled={isPublishing}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Descartar
                </button>
              </div>
            </motion.div>
          )}

          {/* DESFAZER: restaura a escala anterior */}
          {previous && !pending && (
            <button
              type="button"
              onClick={handleUndo}
              className="w-full py-2 px-3 rounded-xl text-[11px] font-bold border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-2"
              title="Volta para a escala publicada antes da atual"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-500" />
              Desfazer (voltar à escala anterior: {previous.moto.length} moto / {previous.car.length} carro)
            </button>
          )}

          {/* WIDGET DE STATUS & TESTE DA API GEMINI */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" />
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Comunicação com IA
                </span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                geminiTestResult?.success || data.geminiStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : geminiTestResult?.status === 'error'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  geminiTestResult?.success || data.geminiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`} />
                {geminiTestResult?.success || data.geminiStatus === 'online' ? 'API Online' : 'Desconectado'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-200/80 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  Última Sincronização:
                </span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {formatDateTime(lastSyncTimestamp)}
                </span>
              </div>

              {(data.geminiLatencyMs || geminiTestResult?.latencyMs) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tempo de Resposta:</span>
                  <span className="font-bold text-emerald-700">
                    {data.geminiLatencyMs || geminiTestResult?.latencyMs} ms
                  </span>
                </div>
              )}

              {(data.geminiModel || geminiTestResult?.model) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Modelo Ativo:</span>
                  <span className="font-mono text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                    {data.geminiModel || geminiTestResult?.model}
                  </span>
                </div>
              )}
            </div>

            {/* Tentativas do failover (última leitura/teste) */}
            {lastAttempts.length > 0 && (
              <div className="border-t border-slate-200/80 pt-2 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Tentativas do failover</span>
                {lastAttempts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] gap-2">
                    <span className="font-mono text-slate-700 truncate">
                      {a.model}{a.keyIdx > 0 ? ` (chave ${a.keyIdx + 1})` : ''}
                    </span>
                    <span className={`font-bold shrink-0 ${a.ok ? 'text-emerald-700' : 'text-red-600'}`} title={a.error || ''}>
                      {a.ok ? `ok • ${a.ms}ms` : `${a.kind || 'erro'}${a.status ? ' ' + a.status : ''}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* BOTÃO PARA TESTAR COMUNICAÇÃO GEMINI */}
            <button
              type="button"
              onClick={handleTestGemini}
              disabled={isTestingGemini}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border shadow-2xs ${
                isTestingGemini 
                  ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-wait'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
              }`}
            >
              {isTestingGemini ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                  Testando Conexão com Gemini...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Testar Comunicação Gemini
                </>
              )}
            </button>
          </div>

        </div>

        {/* CARD 2: TABELA DE TÉCNICOS EXTRAÍDOS (8 colunas no XL com 100% de largura) */}
        <div className="xl:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col min-h-[580px] w-full">
          
          {/* BARRA SUPERIOR: CONTAGEM, ABAS & BUSCA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            
            {/* Título & Badge com contagem */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-800">
                    Escala de Técnicos Ativos
                  </h2>
                  <span className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                    {totalCount}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {totalCount > 0 
                    ? `${data.moto.length} técnicos de moto • ${data.car.length} técnicos de carro`
                    : 'Nenhuma escala carregada no momento'
                  }
                </p>
              </div>
            </div>

            {/* Controles: Abas e Busca */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Abas de Categoria */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('moto')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'moto'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  MOTO ({data.moto.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('car')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'car'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 hover:text-blue-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  CARRO ({data.car.length})
                </button>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Filtrar técnico, região..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* CONTEÚDO PRINCIPAL: TABELAS OU ESTADO VAZIO */}
          <div className="flex-1 flex flex-col pt-3">
            {totalCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4 shadow-sm border border-red-100">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Nenhum técnico cadastrado na rota hoje
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                  Envie ou cole a imagem da escala no painel à esquerda para carregar automaticamente a lista de técnicos com suporte a MOTO e CARRO.
                </p>
              </div>
            ) : (
              <div className="space-y-5 overflow-y-auto max-h-[680px] pr-1">
                
                {/* SEÇÃO MOTO */}
                {(activeTab === 'all' || activeTab === 'moto') && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50/30 border border-amber-200 p-2.5 rounded-xl text-amber-900">
                      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                        <div className="bg-amber-500 text-white p-1 rounded-md shadow-2xs">
                          <Bike className="w-3.5 h-3.5" />
                        </div>
                        Técnicos de MOTO ({filteredMoto.length})
                      </div>
                    </div>

                    {filteredMoto.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        Nenhum técnico de moto encontrado{searchQuery ? ' para os filtros informados' : ''}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5 w-1/4">Técnico</th>
                              <th className="px-4 py-2.5 w-1/4">Região / Setor</th>
                              <th className="px-4 py-2.5 w-1/5">Cidade</th>
                              <th className="px-4 py-2.5">Observações</th>
                              <th className="px-3 py-2.5 text-center w-12">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredMoto.map((tech, idx) => (
                              <tr key={idx} className="hover:bg-amber-50/25 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black flex items-center justify-center text-[10px] shrink-0 border border-amber-200">
                                      {(tech.name || 'T').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{tech.name || 'Sem nome'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                    {tech.region || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                                    <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                    {tech.city || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium max-w-xs truncate" title={tech.obs}>
                                  {tech.obs || '-'}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => copyTechData(tech, `moto-${idx}`)}
                                    title="Copiar dados do técnico"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                  >
                                    {copiedTechId === `moto-${idx}` ? (
                                      <Check size={14} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SEÇÃO CARRO */}
                {(activeTab === 'all' || activeTab === 'car') && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-200 p-2.5 rounded-xl text-blue-900">
                      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                        <div className="bg-blue-600 text-white p-1 rounded-md shadow-2xs">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        Técnicos de CARRO ({filteredCar.length})
                      </div>
                    </div>

                    {filteredCar.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        Nenhum técnico de carro encontrado{searchQuery ? ' para os filtros informados' : ''}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5 w-1/4">Técnico</th>
                              <th className="px-4 py-2.5 w-1/4">Região / Setor</th>
                              <th className="px-4 py-2.5 w-1/5">Cidade</th>
                              <th className="px-4 py-2.5">Observações</th>
                              <th className="px-3 py-2.5 text-center w-12">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredCar.map((tech, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/25 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center text-[10px] shrink-0 border border-blue-200">
                                      {(tech.name || 'T').substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{tech.name || 'Sem nome'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                    {tech.region || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                                    <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                                    {tech.city || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-medium max-w-xs truncate" title={tech.obs}>
                                  {tech.obs || '-'}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => copyTechData(tech, `car-${idx}`)}
                                    title="Copiar dados do técnico"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                  >
                                    {copiedTechId === `car-${idx}` ? (
                                      <Check size={14} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                  </button>
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
