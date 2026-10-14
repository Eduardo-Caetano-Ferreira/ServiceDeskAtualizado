import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Settings, Search, X, MapPin } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function TechniciansRegion() {
  const [showTechs, setShowTechs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} às ${hours}:${minutes}`;
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

  // Filtro de técnicos por cidade, bairro, região ou nome
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => 
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.region && item.region.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.obs && item.obs.toLowerCase().includes(q))
    );
  };

  const filteredMoto = filterList(techData.moto);
  const filteredCar = filterList(techData.car);
  const totalMatches = filteredMoto.length + filteredCar.length;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-red-200/90 shadow-2xs my-2">
      <div className="w-full flex flex-wrap justify-between items-center p-2.5 px-4 bg-white border-b border-slate-100 gap-2.5">
        
        {/* Esquerda: Botão Toggle + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => setShowTechs(!showTechs)} 
            className="font-black text-red-600 text-xs tracking-wider uppercase flex items-center gap-1.5 hover:text-red-700 transition"
          >
            TÉCNICOS DA REGIÃO
            <ChevronDown size={15} className={`transition-transform duration-300 ${showTechs ? 'rotate-180' : ''}`} />
          </button>

          {/* Horário */}
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider flex items-center gap-1" title="Horário da última imagem enviada">
            <Clock size={11} className="text-slate-500" />
            {formatLastUpdate(techData.updatedAt)}
          </span>

          {/* Status dinâmico */}
          {(() => {
            const styles = getStatusBadgeStyle(techData.statusColor);
            return (
              <span className={`text-[10px] font-bold ${styles.bg} px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`}></span>
                {techData.statusText || 'NORMAL'}
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
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
            title="Alterar Status e Cor da Rota"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Centro / Direita: BARRA DE PESQUISA POR CIDADE OU BAIRRO */}
        <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-sm justify-end">
          <div className="relative w-full">
            <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Pesquisar cidade ou bairro..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && !showTechs) {
                  setShowTechs(true);
                }
              }}
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTechs(!showTechs)}
            className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition shrink-0"
          >
            {showTechs ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* QUICK PREVIEW BAR QUANDO HÁ BUSCA E A TABELA ESTÁ RECOLHIDA */}
      {!showTechs && searchQuery.trim() && (
        <div className="bg-red-50/70 px-4 py-2 border-b border-red-200/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 truncate">
            <MapPin size={13} className="text-red-600 shrink-0" />
            <span>
              Resultado para <strong>"{searchQuery}"</strong>: {totalMatches} técnico(s) encontrado(s)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowTechs(true)}
            className="text-[11px] font-bold text-red-600 hover:underline shrink-0"
          >
            Ver Detalhes
          </button>
        </div>
      )}

      {/* TABELA DE TÉCNICOS EXPANSÍVEL */}
      <AnimatePresence>
        {showTechs && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/60 p-3 space-y-3 border-t border-slate-100"
          >
            {filteredMoto.length === 0 && filteredCar.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
                {searchQuery ? (
                  <p className="font-semibold text-slate-700">
                    Nenhum técnico encontrado para a cidade/bairro "<strong>{searchQuery}</strong>".
                  </p>
                ) : (
                  <p className="font-semibold text-slate-700">Nenhum técnico cadastrado na rota de hoje.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* TÉCNICOS DE MOTO */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
                  <div className="bg-red-600 text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest text-center">
                    TÉCNICOS DE MOTO ({filteredMoto.length})
                  </div>
                  <div className="overflow-x-auto max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold sticky top-0">
                          <th className="px-2.5 py-1.5 border-r border-slate-200">Técnico</th>
                          <th className="px-2.5 py-1.5 border-r border-slate-200">Região / Bairro</th>
                          <th className="px-2.5 py-1.5">Cidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMoto.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-center text-slate-400 italic">
                              Nenhum técnico de moto nesta região.
                            </td>
                          </tr>
                        ) : (
                          filteredMoto.map((tech, idx) => (
                            <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                              <td className="px-2.5 py-1.5 border-r border-slate-200 font-bold text-slate-800">{tech.name || '-'}</td>
                              <td className="px-2.5 py-1.5 border-r border-slate-200 text-slate-600 font-medium">{tech.region || '-'}</td>
                              <td className="px-2.5 py-1.5 text-slate-700 font-semibold">{tech.city || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TÉCNICOS DE CARRO */}
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
                  <div className="bg-blue-600 text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest text-center">
                    TÉCNICOS DE CARRO ({filteredCar.length})
                  </div>
                  <div className="overflow-x-auto max-h-44 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold sticky top-0">
                          <th className="px-2.5 py-1.5 border-r border-slate-200">Técnico</th>
                          <th className="px-2.5 py-1.5 border-r border-slate-200">Região / Bairro</th>
                          <th className="px-2.5 py-1.5">Cidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCar.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-center text-slate-400 italic">
                              Nenhum técnico de carro nesta região.
                            </td>
                          </tr>
                        ) : (
                          filteredCar.map((tech, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-2.5 py-1.5 border-r border-slate-200 font-bold text-slate-800">{tech.name || '-'}</td>
                              <td className="px-2.5 py-1.5 border-r border-slate-200 text-slate-600 font-medium">{tech.region || '-'}</td>
                              <td className="px-2.5 py-1.5 text-slate-700 font-semibold">{tech.city || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-red-600" />
                  Alterar Status da Rota
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Texto do Status
                  </label>
                  <input 
                    type="text" 
                    value={editStatusText}
                    onChange={(e) => setEditStatusText(e.target.value)}
                    placeholder="Ex: NORMAL, ATENÇÃO, CHUVA..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Cor da Tag
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStatusColor('green')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        editStatusColor === 'green' 
                          ? 'bg-emerald-600 text-white border-emerald-700' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Verde
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatusColor('yellow')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        editStatusColor === 'yellow' 
                          ? 'bg-amber-500 text-white border-amber-600' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      Amarelo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatusColor('red')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition ${
                        editStatusColor === 'red' 
                          ? 'bg-red-600 text-white border-red-700' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      Vermelho
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-2xs"
                >
                  Salvar
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
            className={`fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg border text-xs font-bold text-white ${
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
