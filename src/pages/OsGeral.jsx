import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, User, FileText, Cpu, Clock, 
  ShieldCheck, Copy, Trash2, Info, Check
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  roteador: '',
  onu: '',
  contato: '',
  conseguiuContato: 'Sim',
  clienteDesde: '',
  solicitacao: '',
  sinalStatus: '',
  historicoQuedas: '',
  recentOS: 'Não',
  tipoOSRecente: '',
  dataOSRecente: '',
  encerramentoOSRecente: '',
  nomeAtendente: '',
  authException: 'Não',
  nomeAutorizou: ''
};

export function OsGeral() {
  const [formData, setFormData] = useState(() => {
    const savedForm = localStorage.getItem('serviceDeskScriptData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    
    let loadedData = { ...initialState };
    
    if (savedForm) {
      try {
        loadedData = { ...loadedData, ...JSON.parse(savedForm) };
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
    }

    if (operadorGlobal) {
      loadedData.nomeAtendente = operadorGlobal;
    }

    return loadedData; // Retorna os dados preenchidos ANTES da tela piscar
  });
  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [errorFields, setErrorFields] = useState([]);
  const [copied, setCopied] = useState(false);

  // 1. CARREGAMENTO INICIAL DO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('serviceDeskScriptData', JSON.stringify(formData));
  }, [formData]);

  // 2. SALVAMENTO AUTOMÁTICO DO FORMULÁRIO (Para não perder se fechar a página)
  useEffect(() => {
    localStorage.setItem('serviceDeskScriptData', JSON.stringify(formData));
  }, [formData]);

  // 3. ATUALIZAÇÃO DOS CAMPOS E NOME DO OPERADOR
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Salva o nome do atendente na chave global imediatamente
    if (name === 'nomeAtendente') {
      localStorage.setItem('serviceDesk_operador', value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Remove o alerta de erro assim que o usuário digita algo
    if (value.trim() !== '') {
      setErrorFields(prev => prev.filter(field => field !== name));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const trimmed = dateString.trim();
    if (trimmed.includes('/')) return trimmed;
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      if (parts[2].length === 4) return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return trimmed;
  };

  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const setTodayDate = (fieldName) => {
    const todayStr = getTodayFormatted();
    setFormData(prev => ({ ...prev, [fieldName]: todayStr }));
    setErrorFields(prev => prev.filter(field => field !== fieldName));
  };

  const validateForm = () => {
    const requiredFields = [
      'dataAgendamento', 'periodo', 'roteador', 'onu', 
      'contato', 'clienteDesde', 'solicitacao', 'sinalStatus', 'nomeAtendente'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    if (formData.periodo === 'Após' && !formData.horarioApos) newErrors.push('horarioApos');
    
    if (formData.recentOS === 'Sim') {
      if (!formData.tipoOSRecente) newErrors.push('tipoOSRecente');
      if (!formData.dataOSRecente) newErrors.push('dataOSRecente');
      if (!formData.encerramentoOSRecente) newErrors.push('encerramentoOSRecente');
    }
    
    if (formData.authException === 'Sim' && !formData.nomeAutorizou) newErrors.push('nomeAutorizou');

    setErrorFields(newErrors);
    return newErrors.length === 0;
  };

  const copiarScript = () => {
    if (!validateForm()) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    const dataAgend = formatDate(formData.dataAgendamento);
    let periodoFmt = formData.periodo === 'Após' ? `Após: ${formData.horarioApos}` : formData.periodo;

    let scriptOSRecente = `Recente Suporte/OS: ${formData.recentOS}`;
    if (formData.recentOS === 'Sim') {
      scriptOSRecente += `\n   - Tipo: ${formData.tipoOSRecente}\n   - Data: ${formatDate(formData.dataOSRecente)}\n   - Encerramento: ${formData.encerramentoOSRecente}`;
    }

    let scriptExcecao = `Autorização por Exceção: ${formData.authException}`;
    if (formData.authException === 'Sim') {
      scriptExcecao += ` (Autorizado por: ${formData.nomeAutorizou})`;
    }

    const finalScript = `=== AGENDAMENTO ===
DATA: ${dataAgend}
PERÍODO: ${periodoFmt}

=== INFORMAÇÕES DO CLIENTE ===
Roteador: ${formData.roteador}
ONU: ${formData.onu}
Contato: ${formData.contato} (Conseguiu contato: ${formData.conseguiuContato || 'Sim'})
Cliente desde: ${formData.clienteDesde}

=== DETALHES DA SOLICITAÇÃO ===
${formData.solicitacao}

=== INFORMAÇÕES TÉCNICAS ===
Sinal/Status: ${formData.sinalStatus}
Histórico:
${formData.historicoQuedas || 'Nenhum histórico registrado.'}

=== HISTÓRICO ===
${scriptOSRecente}

=== ATENDIMENTO ===
Atendente: ${formData.nomeAtendente}
${scriptExcecao}`.trim();

    navigator.clipboard.writeText(finalScript);
    setCopied(true);
    showToast("Script copiado com sucesso!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  // 4. LIMPEZA SEGURA DO FORMULÁRIO (Preservando o Operador Global)
  const confirmClear = () => {
    const operadorGlobal = localStorage.getItem('serviceDesk_operador') || '';
    
    const clearedState = {
      ...initialState,
      nomeAtendente: operadorGlobal 
    };

    setFormData(clearedState);
    
    // Atualiza o localStorage do formulário para gravar o estado limpo
    localStorage.setItem('serviceDeskScriptData', JSON.stringify(clearedState));
    
    setErrorFields([]);
    setShowClearModal(false);
    showToast("Formulário limpo.", "info");
  };

  const getInputClass = (fieldName, extraClasses = "") => {
    const hasError = errorFields.includes(fieldName);
    const errorStyles = hasError 
      ? "border-red-500 ring-1 ring-red-500 bg-red-50 animate-error" 
      : "border-slate-300 bg-slate-100 focus:border-primary focus:ring-1 focus:ring-primary";

    return `w-full border text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all ${errorStyles} ${extraClasses}`;
  };

  const labelClass = "block text-sm font-semibold text-slate-600 mb-1.5";
  const cardClass = "bg-white rounded-xl shadow-sm p-5 border-t-4 border-primary flex flex-col h-full";
  const titleClass = "text-base font-bold border-b border-slate-200 pb-2 mb-4 text-slate-800 flex items-center gap-2";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1400px] mx-auto space-y-6 relative"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Ordem de Serviço Geral</h2>
        <button
          type="button"
          onClick={() => setTodayDate('dataAgendamento')}
          title="Clique para preencher a data de agendamento com a data de hoje"
          className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300 flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <Calendar size={14} className="text-primary" /> Hoje ({getTodayFormatted()})
        </button>
      </div>

      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
        
        {/* Agendamento */}
        <div className={`${cardClass} xl:col-span-4`}>
          <h2 className={titleClass}><Calendar size={18} className="text-primary" /> Agendamento</h2>
          <div className="space-y-4 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>Data</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Hoje
                </button>
              </div>
              <DateInputWithCalendar name="dataAgendamento" value={formData.dataAgendamento} onChange={handleChange} placeholder="DD/MM/AAAA" className={getInputClass('dataAgendamento')} />
            </div>
            <div>
              <label className={labelClass}>Período</label>
              <select name="periodo" value={formData.periodo} onChange={handleChange} className={getInputClass('periodo')}>
                <option value="">Selecione...</option>
                <option value="Horário Comercial">Horário Comercial</option>
                <option value="Primeira do dia">Primeira do dia</option>
                <option value="Manhã (9 às 12h30)">Manhã (9 às 12h30)</option>
                <option value="Tarde (13 às 17h30)">Tarde (13 às 17h30)</option>
                <option value="Última do dia">Última do dia</option>
                <option value="Após">Após (Informar Horário)</option>
              </select>
            </div>
            <AnimatePresence>
              {formData.periodo === 'Após' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                  <label className={labelClass}>Horário Específico</label>
                  <input type="text" name="horarioApos" value={formData.horarioApos} onChange={handleChange} placeholder="Ex: 16:30" className={getInputClass('horarioApos')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Cliente */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}><User size={18} className="text-primary" /> Informações do Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Roteador</label>
              <select name="roteador" value={formData.roteador} onChange={handleChange} className={getInputClass('roteador')}>
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>ONU</label>
              <select name="onu" value={formData.onu} onChange={handleChange} className={getInputClass('onu')}>
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
            <div className="sm:col-span-2 xl:col-span-1">
              <label className={labelClass}>Contato</label>
              <input type="text" name="contato" value={formData.contato} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" className={getInputClass('contato')} />
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    name="conseguiuContato"
                    checked={formData.conseguiuContato !== 'Não'}
                    onChange={(e) => setFormData(prev => ({ ...prev, conseguiuContato: e.target.checked ? 'Sim' : 'Não' }))}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary rounded cursor-pointer"
                  />
                  <span>Conseguiu contato? <strong className={formData.conseguiuContato !== 'Não' ? 'text-emerald-600' : 'text-amber-600'}>{formData.conseguiuContato !== 'Não' ? 'Sim' : 'Não'}</strong></span>
                </label>
              </div>
            </div>
            <div className="sm:col-span-2 xl:col-span-1">
              <label className={labelClass}>Cliente desde</label>
              <input type="text" name="clienteDesde" value={formData.clienteDesde} onChange={handleChange} placeholder="Ex: 01/2020" className={getInputClass('clienteDesde')} />
            </div>
          </div>
        </div>

        {/* Detalhes O.S */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><FileText size={18} className="text-primary" /> Detalhes da O.S.</h2>
          <div className="flex-grow">
            <label className={labelClass}>Solicitação (Motivo)</label>
            <textarea name="solicitacao" value={formData.solicitacao} onChange={handleChange} rows="5" className={getInputClass('solicitacao', 'resize-none')} placeholder="Descreva a solicitação do cliente..."></textarea>
          </div>
        </div>

        {/* Info Técnica */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><Cpu size={18} className="text-primary" /> Informações Técnicas</h2>
          <div className="space-y-4 flex-grow">
            <div>
              <label className={labelClass}>Sinal / Status ONU</label>
              <input type="text" name="sinalStatus" value={formData.sinalStatus} onChange={handleChange} className={getInputClass('sinalStatus')} placeholder="-20dbm / Online" />
            </div>
            <div>
              <label className={labelClass}>Histórico de Quedas / Logs <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
              <textarea name="historicoQuedas" value={formData.historicoQuedas} onChange={handleChange} rows="2" className={getInputClass('historicoQuedas', 'resize-none')} placeholder="Copie os logs relevantes aqui..."></textarea>
            </div>
          </div>
        </div>

        {/* Última O.S */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><Clock size={18} className="text-primary" /> Última O.S.</h2>
          <div className="mb-4">
            <span className={labelClass}>Teve atendimento recente?</span>
            <div className="flex gap-4">
              {['Sim', 'Não'].map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1 justify-center">
                  <input type="radio" name="recentOS" value={op} checked={formData.recentOS === op} onChange={handleChange} className="text-primary focus:ring-primary accent-primary" /> {op}
                </label>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {formData.recentOS === 'Sim' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <input type="text" name="tipoOSRecente" value={formData.tipoOSRecente} onChange={handleChange} className={getInputClass('tipoOSRecente')} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Data</label>
                    <button
                      type="button"
                      onClick={() => setTodayDate('dataOSRecente')}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Hoje
                    </button>
                  </div>
                  <DateInputWithCalendar name="dataOSRecente" value={formData.dataOSRecente} onChange={handleChange} placeholder="DD/MM/AAAA" className={getInputClass('dataOSRecente')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Encerramento</label>
                  <textarea
                    name="encerramentoOSRecente"
                    value={formData.encerramentoOSRecente}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Digite ou cole o encerramento da última O.S..."
                    className={`${getInputClass('encerramentoOSRecente')} resize-y`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Atendente & Autorização */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><ShieldCheck size={18} className="text-primary" /> Atendente & Autorização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>Autorização por Exceção (Torre)?</span>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1 justify-center">
                    <input type="radio" name="authException" value={op} checked={formData.authException === op} onChange={handleChange} className="accent-primary" /> {op}
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {formData.authException === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                    <label className={labelClass}>Nome de quem autorizou</label>
                    <input type="text" name="nomeAutorizou" value={formData.nomeAutorizou} onChange={handleChange} className={getInputClass('nomeAutorizou', 'bg-yellow-50 border-yellow-300 focus:border-yellow-500')} placeholder="Nome do supervisor/gerente" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className={labelClass}>Operador / Atendente</label>
              <input type="text" name="nomeAtendente" list="atendentes-list" value={formData.nomeAtendente} onChange={handleChange} className={getInputClass('nomeAtendente')} placeholder="Nome do atendente" />
              <datalist id="atendentes-list">
                <option value="Heitor Hugo" />
                <option value="Alejandro Eduardo" />
                <option value="Matheus Santos" />
                <option value="Victor Silva" />
                <option value="Thiago Nathan" />
                <option value="Celso Cotta" />
              </datalist>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="xl:col-span-12 flex flex-col sm:flex-row gap-4 pt-4 pb-10">
          <motion.button 
            type="button"
            onClick={copiarScript} 
            whileTap={{ scale: 0.97 }}
            animate={copied ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex-1 font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition-all duration-300 transform ${
              copied 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50' 
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check size={22} className="animate-bounce text-white" />
                  Script Copiado!
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Copy size={20} />
                  Copiar Script Completo
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          
          <button 
            onClick={() => setShowClearModal(true)} 
            className="sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
          >
            <Trash2 size={20} /> Limpar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-orange-500"
            >
              <div className="flex items-center gap-3 text-orange-500 mb-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Limpar Formulário?</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja apagar todos os dados digitados? <br/>
                <span className="text-sm font-medium text-slate-500 mt-2 block">
                  * O nome do operador será mantido.
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmClear}
                  className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-md transition"
                >
                  Sim, limpar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-medium text-white flex items-center gap-2 border border-white/10 ${
              toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}