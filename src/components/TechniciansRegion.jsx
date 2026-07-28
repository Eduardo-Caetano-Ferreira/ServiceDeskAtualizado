import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Settings } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function TechniciansRegion() {
  const [showTechs, setShowTechs] = useState(false);
  const [techData, setTechData] = useState({ 
    moto: [], 
    car: [], 
    updatedAt: null, 
    statusText: 'NORMAL', 
    statusColor: 'green' 
  });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editStatusText, setEditStatusText] = useState('NORMAL');
  const [editStatusColor, setEditStatusColor] = useState('green');
  const [toastMessage, setToastMessage] = useState(null);

  // Carrega rota/escala de técnicos em tempo real do Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "techniciansList", "current"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setTechData({
          moto: Array.isArray(d.moto) ? d.moto : [],
          car: Array.isArray(d.car) ? d.car : [],
          updatedAt: d.updatedAt || null,
          statusText: d.statusText || 'NORMAL',
          statusColor: d.statusColor || 'green'
        });
      }
    });
    return () => unsub();
  }, []);

  const handleSaveStatus = async () => {
    try {
      await setDoc(doc(db, "techniciansList", "current"), {
        statusText: editStatusText.trim() || 'NORMAL',
        statusColor: editStatusColor
      }, { merge: true });
      setShowStatusModal(false);
      showToast("Status da rota atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar status:", err);
      showToast("Erro ao atualizar status.", "error");
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatLastUpdate = (isoString) => {
    if (!isoString) return 'Sem atualização recente';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Sem atualização recente';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `Atualizado: ${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
      return 'Sem atualização recente';
    }
  };

  const getStatusBadgeStyle = (color) => {
    switch (color) {
      case 'yellow':
      case 'amber':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500'
        };
      case 'red':
      case 'rose':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-500'
        };
      case 'green':
      case 'emerald':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500'
        };
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-red-300 shadow-xs my-4">
      <div className="w-full flex flex-wrap justify-between items-center p-3.5 px-5 bg-white border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            type="button"
            onClick={() => setShowTechs(!showTechs)} 
            className="font-extrabold text-red-600 text-sm tracking-wider uppercase flex items-center gap-2 hover:text-red-700 transition"
          >
            TÉCNICOS DA REGIÃO
            <ChevronDown size={18} className={`transition-transform duration-300 ${showTechs ? 'rotate-180' : ''}`} />
          </button>

          {/* Data e Horário da última atualização */}
          <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider flex items-center gap-1.5" title="Horário da última imagem enviada">
            <Clock size={12} className="text-slate-500" />
            {formatLastUpdate(techData.updatedAt)}
          </span>

          {/* Status dinâmico */}
          {(() => {
            const styles = getStatusBadgeStyle(techData.statusColor);
            return (
              <span className={`text-[11px] font-bold ${styles.bg} px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`}></span>
                STATUS: {techData.statusText || 'NORMAL'}
              </span>
            );
          })()}

          {/* Engrenagem para alterar Status */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditStatusText(techData.statusText || 'NORMAL');
              setEditStatusColor(techData.statusColor || 'green');
              setShowStatusModal(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 flex items-center gap-1"
            title="Alterar Status e Cor da Rota"
          >
            <Settings size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTechs(!showTechs)}
          className="text-xs font-semibold text-slate-500 hover:text-red-600 transition"
        >
          {showTechs ? 'Recolher Tabela' : 'Expandir Tabela'}
        </button>
      </div>

      <AnimatePresence>
        {showTechs && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 p-4 space-y-5 border-t border-slate-100"
          >
            {techData.moto.length === 0 && techData.car.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-xs">
                <p className="font-semibold text-sm text-slate-600">Nenhum técnico cadastrado na rota de hoje.</p>
                <p className="text-xs text-slate-400 mt-1">Envie a imagem da escala na tela "Início" para carregar os técnicos automaticamente.</p>
              </div>
            ) : (
              <>
                {/* TÉCNICOS DE MOTO */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                  <div className="bg-red-600 text-white px-4 py-2 font-black text-xs uppercase tracking-widest text-center">
                    TÉCNICOS DE MOTO
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                          <th className="px-4 py-2.5 border-r border-slate-200 w-1/4">Técnico</th>
                          <th className="px-4 py-2.5 border-r border-slate-200 w-2/5">Região</th>
                          <th className="px-4 py-2.5 border-r border-slate-200 w-1/6">Cidade</th>
                          <th className="px-4 py-2.5 w-1/6">Obs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {techData.moto.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-slate-400 italic">
                              Nenhum técnico de moto na escala.
                            </td>
                          </tr>
                        ) : (
                          techData.moto.map((tech, idx) => (
                            <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                              <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-800">{tech.name || '-'}</td>
                              <td className="px-4 py-3 border-r border-slate-200 text-slate-600">{tech.region || '-'}</td>
                              <td className="px-4 py-3 border-r border-slate-200 text-slate-700">{tech.city || '-'}</td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{tech.obs || ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TÉCNICOS DE CARRO */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                  <div className="bg-red-600 text-white px-4 py-2 font-black text-xs uppercase tracking-widest text-center">
                    TÉCNICOS DE CARRO
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                          <th className="px-4 py-2.5 border-r border-slate-200 w-1/4">Técnico</th>
                          <th className="px-4 py-2.5 border-r border-slate-200 w-2/5">Região</th>
                          <th className="px-4 py-2.5 border-r border-slate-200 w-1/6">Cidade</th>
                          <th className="px-4 py-2.5 w-1/6">Obs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {techData.car.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-slate-400 italic">
                              Nenhum técnico de carro na escala.
                            </td>
                          </tr>
                        ) : (
                          techData.car.map((tech, idx) => (
                            <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                              <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-800">{tech.name || '-'}</td>
                              <td className="px-4 py-3 border-r border-slate-200 text-slate-600">{tech.region || '-'}</td>
                              <td className="px-4 py-3 border-r border-slate-200 text-slate-700">{tech.city || '-'}</td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{tech.obs || ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA ALTERAR STATUS DA ROTA */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-600" />
                  Alterar Status da Rota
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto do Status
                  </label>
                  <input 
                    type="text" 
                    value={editStatusText}
                    onChange={(e) => setEditStatusText(e.target.value)}
                    placeholder="Ex: NORMAL, ATENÇÃO, LENTO, CHUVA NA REGIÃO..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Cor da Tag
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatusColor('green')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                        editStatusColor === 'green' 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>
                      Verde
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatusColor('yellow')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                        editStatusColor === 'yellow' 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white"></span>
                      Amarelo
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatusColor('red')}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                        editStatusColor === 'red' 
                          ? 'bg-red-600 text-white border-red-700 shadow-xs' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 border border-white"></span>
                      Vermelho
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  className="px-4 py-2 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-xs transition"
                >
                  Salvar Status
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold text-white ${
              toastMessage.type === 'error' ? 'bg-red-600 border-red-700' : 'bg-slate-900 border-slate-800'
            }`}
          >
            {toastMessage.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
