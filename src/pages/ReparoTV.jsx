import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Headset, Copy, Trash2, AlertTriangle, Info, CalendarClock, Settings, Clock, Check
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  contato: '',
  conseguiuContato: '', // Desmarcado por padrão (obrigatório)
  clienteDesde: '',
  descricao: '',
  equipamentoTV: 'Coaxial',
  sinalFibra: '',
  dispositivoTV: '',
  sintoniaRealizada: 'Não',
  recentOS: 'Não',
  tipoOSRecente: '',
  dataOSRecente: '',
  encerramentoOSRecente: '',
  authException: 'Não',
  nomeAutorizou: '',
  nomeAtendente: '',
};

export function ReparoTV() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('reparoTvScriptData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    
    let loadedData = { ...initialState };
    if (saved) {
      try {
        loadedData = { ...loadedData, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }

    // Assegurar migração para v1.4: campo conseguiuContato inicia desmarcado
    const hasMigratedContato = localStorage.getItem('reparoTv_contato_v1_4');
    if (!hasMigratedContato) {
      loadedData.conseguiuContato = '';
      localStorage.setItem('reparoTv_contato_v1_4', 'true');
    }
    
    if (operadorGlobal) {
      loadedData.nomeAtendente = operadorGlobal;
    }
    
    return loadedData;
  });

  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [errorFields, setErrorFields] = useState([]);
  const [copied, setCopied] = useState(false);

  // Sincronização automática do operador logado
  useEffect(() => {
    const handleStorageChange = () => {
      const op = localStorage.getItem('serviceDesk_operador');
      if (op) {
        setFormData(prev => ({ ...prev, nomeAtendente: op }));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Salva no LocalStorage
  useEffect(() => {
    localStorage.setItem('reparoTvScriptData', JSON.stringify(formData));
  }, [formData]);

  // Máscara automática de telefones fixos e celulares (Brasil)
  const formatPhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'contato') {
      finalValue = formatPhone(value);
    }
    if (name === 'nomeAtendente') {
      localStorage.setItem('serviceDesk_operador', value);
    }

    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      
      // Limpeza de campos dependentes
      if (name === 'equipamentoTV' && finalValue !== 'Mini Node') {
        next.sinalFibra = '';
      }
      if (name === 'recentOS' && finalValue === 'Não') {
        next.tipoOSRecente = '';
        next.dataOSRecente = '';
        next.encerramentoOSRecente = '';
      }
      if (name === 'authException' && finalValue === 'Não') {
        next.nomeAutorizou = '';
      }

      return next;
    });

    if (type === 'checkbox' || (typeof finalValue === 'string' && finalValue.trim() !== '')) {
      setErrorFields(prev => prev.filter(field => field !== name));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
      'dataAgendamento', 'periodo', 'contato', 'conseguiuContato', 'clienteDesde', 'descricao', 
      'equipamentoTV', 'dispositivoTV', 'sintoniaRealizada'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors.push(field);
      }
    });

    if (formData.periodo === 'Após' && !formData.horarioApos?.trim()) {
      newErrors.push('horarioApos');
    }

    if (formData.equipamentoTV === 'Mini Node' && !formData.sinalFibra?.trim()) {
      newErrors.push('sinalFibra');
    }

    if (formData.recentOS === 'Sim') {
      if (!formData.tipoOSRecente?.trim()) newErrors.push('tipoOSRecente');
      if (!formData.dataOSRecente?.trim()) newErrors.push('dataOSRecente');
      if (!formData.encerramentoOSRecente?.trim()) newErrors.push('encerramentoOSRecente');
    }

    if (formData.authException === 'Sim' && !formData.nomeAutorizou?.trim()) {
      newErrors.push('nomeAutorizou');
    }

    setErrorFields(newErrors);

    if (newErrors.length > 0) {
      if (newErrors.includes('conseguiuContato') && !formData.conseguiuContato) {
        showToast("Por favor, selecione se conseguiu contato com o cliente (Sim ou Não).", "error");
      } else {
        showToast("Preencha todos os campos obrigatórios em destaque.", "error");
      }
      
      const firstErrorElement = document.getElementsByName(newErrors[0])[0];
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const copyScript = () => {
    if (!validateForm()) return;

    const dataAgend = formatDate(formData.dataAgendamento);
    let periodoFmt = formData.periodo === 'Após' ? `Após: ${formData.horarioApos}` : formData.periodo;

    let eqText = formData.equipamentoTV;
    if (formData.equipamentoTV === 'Mini Node') {
      eqText += `\nSinal da Fibra: ${formData.sinalFibra}`;
    }

    let scriptOSRecente = `Recente Suporte/OS: ${formData.recentOS}`;
    if (formData.recentOS === 'Sim') {
      scriptOSRecente += `\n   - Tipo: ${formData.tipoOSRecente}\n   - Data: ${formatDate(formData.dataOSRecente)}\n   - Encerramento: ${formData.encerramentoOSRecente}`;
    }

    let scriptExcecao = `Autorização por Exceção: ${formData.authException}`;
    if (formData.authException === 'Sim') {
      scriptExcecao += ` (Autorizado por: ${formData.nomeAutorizou})`;
    }

    const operadorFinal = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || 'Operador Conectado';

    const scriptFinal = `=== AGENDAMENTO ===
DATA: ${dataAgend}
PERÍODO: ${periodoFmt}

=== INFORMAÇÕES DO CLIENTE ===
Contato: ${formData.contato} (Conseguiu contato: ${formData.conseguiuContato || 'Não informado'})
Cliente desde: ${formData.clienteDesde}

=== DETALHES DO REPARO ===
Descrição do Problema: ${formData.descricao}

Equipamento: ${eqText}
Dispositivo: ${formData.dispositivoTV}
Sintonia Realizada? ${formData.sintoniaRealizada}

=== HISTÓRICO ===
${scriptOSRecente}

=== ATENDIMENTO ===
Atendente: ${operadorFinal}
${scriptExcecao}`.trim();

    navigator.clipboard.writeText(scriptFinal)
      .then(() => {
        setCopied(true);
        showToast("Script copiado com sucesso!");
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => showToast("Erro ao copiar script", "error"));
  };

  const handleClear = () => {
    const atendenteAtual = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador');
    setFormData({ ...initialState, nomeAtendente: atendenteAtual });
    setErrorFields([]);
    setShowClearModal(false);
    showToast("Formulário limpo.", "info");
  };

  const getInputClass = (fieldName, extraClasses = "") => {
    const hasError = errorFields.includes(fieldName);
    const errorStyles = hasError 
      ? "border-red-500 ring-1 ring-red-500 bg-red-50/50 animate-error" 
      : "border-slate-300 bg-slate-100 hover:border-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500";

    return `w-full border text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all shadow-2xs ${errorStyles} ${extraClasses}`;
  };

  const cardClass = "bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 transition-shadow hover:shadow-md";
  const titleClass = "text-base font-bold pb-3 mb-4 text-slate-800 flex items-center gap-2 border-b border-slate-100";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto space-y-6 pb-20"
    >
      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Bloco 1: Agendamento */}
        <div className={`${cardClass} xl:col-span-4 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <CalendarClock className="w-5 h-5 text-red-500" /> 
              Agendamento
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Data *</label>
                  <button
                    type="button"
                    onClick={() => setTodayDate('dataAgendamento')}
                    className="text-xs text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Hoje
                  </button>
                </div>
                <DateInputWithCalendar 
                  name="dataAgendamento" 
                  value={formData.dataAgendamento} 
                  onChange={handleChange} 
                  placeholder="DD/MM/AAAA" 
                  className={getInputClass('dataAgendamento')} 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Período *</label>
                </div>
                <select 
                  name="periodo" 
                  value={formData.periodo} 
                  onChange={handleChange} 
                  className={getInputClass('periodo')}
                >
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
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <label className={`${labelClass} mb-0`}>Horário Específico *</label>
                    </div>
                    <input 
                      type="text" 
                      name="horarioApos" 
                      value={formData.horarioApos} 
                      onChange={handleChange} 
                      placeholder="Ex: 16:30" 
                      className={getInputClass('horarioApos')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bloco 2: Informações do Cliente */}
        <div className={`${cardClass} xl:col-span-8 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <User className="w-5 h-5 text-red-500" /> 
              Informações do Cliente
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Contato com Máscara e Switch Conseguiu Contato */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Contato *</label>
                </div>
                <input 
                  type="text" 
                  name="contato" 
                  value={formData.contato} 
                  onChange={handleChange} 
                  placeholder="(XX) XXXXX-XXXX" 
                  className={getInputClass('contato')} 
                />
                
                {/* SWITCH SIM / NÃO PARA CONSEGUIU CONTATO */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                    <span className="block text-xs font-semibold text-slate-700">Conseguiu contato? *</span>
                    {formData.conseguiuContato && (
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        formData.conseguiuContato === 'Sim' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {formData.conseguiuContato}
                      </span>
                    )}
                  </div>
                  
                  <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
                    errorFields.includes('conseguiuContato')
                      ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
                      : 'border-slate-300 bg-slate-100'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, conseguiuContato: 'Sim' }));
                        setErrorFields(prev => prev.filter(f => f !== 'conseguiuContato'));
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.conseguiuContato === 'Sim'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Check size={13} className={formData.conseguiuContato === 'Sim' ? 'text-white' : 'opacity-30'} />
                      Sim
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, conseguiuContato: 'Não' }));
                        setErrorFields(prev => prev.filter(f => f !== 'conseguiuContato'));
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.conseguiuContato === 'Não'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className={`text-xs ${formData.conseguiuContato === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                      Não
                    </button>
                  </div>

                  {errorFields.includes('conseguiuContato') && (
                    <p className="text-[10px] font-bold text-red-600 mt-1">
                      Selecione Sim ou Não.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cliente Desde */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Cliente desde *</label>
                </div>
                <input 
                  type="text" 
                  name="clienteDesde" 
                  value={formData.clienteDesde} 
                  onChange={handleChange} 
                  placeholder="Ex: 01/2020" 
                  className={getInputClass('clienteDesde')} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Detalhes do Reparo */}
        <div className={`${cardClass} xl:col-span-12`}>
          <h2 className={titleClass}>
            <Settings className="w-5 h-5 text-red-500" /> 
            Detalhes do Reparo
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Descrição do Problema *</label>
              </div>
              <textarea 
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="3" 
                className={getInputClass('descricao', 'resize-none')} 
                placeholder="Ex: Cliente relata tela sem sinal, imagem travando, canais fora do ar..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SWITCH ESTRUTURA: COAXIAL / MINI NODE */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Estrutura *</label>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    formData.equipamentoTV === 'Mini Node' ? 'text-blue-700 bg-blue-50' : 'text-slate-700 bg-slate-100'
                  }`}>
                    {formData.equipamentoTV}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, equipamentoTV: 'Coaxial', sinalFibra: '' }));
                      setErrorFields(prev => prev.filter(f => f !== 'sinalFibra'));
                    }}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.equipamentoTV === 'Coaxial'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    Coaxial
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, equipamentoTV: 'Mini Node' }))}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.equipamentoTV === 'Mini Node'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    Mini Node
                  </button>
                </div>

                <AnimatePresence>
                  {formData.equipamentoTV === 'Mini Node' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                        <label className="block text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Sinal da Fibra *</label>
                        <input 
                          type="text" 
                          name="sinalFibra"
                          value={formData.sinalFibra}
                          onChange={handleChange}
                          placeholder="-XX dBm" 
                          className={getInputClass('sinalFibra')} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DISPOSITIVO */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Dispositivo *</label>
                </div>
                <select 
                  name="dispositivoTV" 
                  value={formData.dispositivoTV}
                  onChange={handleChange}
                  className={getInputClass('dispositivoTV')}
                >
                  <option value="">Selecione...</option>
                  <option value="Decodificador Gospell">Decodificador Gospell</option>
                  <option value="Conversor Externo">Conversor Externo</option>
                  <option value="Cabo direto na TV">Cabo direto na TV</option>
                </select>
              </div>
            </div>

            {/* SWITCH REALIZADO SINTONIA */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Realizado sintonia? *</span>
                <span className={`text-xs font-bold ${
                  formData.sintoniaRealizada === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  {formData.sintoniaRealizada}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:w-80 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sintoniaRealizada: 'Sim' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.sintoniaRealizada === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={13} className={formData.sintoniaRealizada === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sintoniaRealizada: 'Não' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.sintoniaRealizada === 'Não'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.sintoniaRealizada === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bloco 4: Última O.S. (Switch) */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <Clock className="w-5 h-5 text-red-500" /> 
              Última O.S.
            </h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Teve atendimento recente?</span>
                <span className={`text-xs font-bold ${
                  formData.recentOS === 'Sim' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {formData.recentOS}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recentOS: 'Sim' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.recentOS === 'Sim'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={13} className={formData.recentOS === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      recentOS: 'Não',
                      tipoOSRecente: '',
                      dataOSRecente: '',
                      encerramentoOSRecente: ''
                    }));
                    setErrorFields(prev => prev.filter(f => !['tipoOSRecente', 'dataOSRecente', 'encerramentoOSRecente'].includes(f)));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.recentOS === 'Não'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.recentOS === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
            </div>

            <AnimatePresence>
              {formData.recentOS === 'Sim' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50/40 p-4 rounded-xl border border-red-100 overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <label className={`${labelClass} mb-0`}>Tipo *</label>
                    </div>
                    <input 
                      type="text" 
                      name="tipoOSRecente" 
                      value={formData.tipoOSRecente} 
                      onChange={handleChange} 
                      placeholder="Ex: Reparo, Instalação..."
                      className={getInputClass('tipoOSRecente')} 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <label className={`${labelClass} mb-0`}>Data *</label>
                      <button
                        type="button"
                        onClick={() => setTodayDate('dataOSRecente')}
                        className="text-xs text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Hoje
                      </button>
                    </div>
                    <DateInputWithCalendar 
                      name="dataOSRecente" 
                      value={formData.dataOSRecente} 
                      onChange={handleChange} 
                      placeholder="DD/MM/AAAA" 
                      className={getInputClass('dataOSRecente')} 
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <label className={`${labelClass} mb-0`}>Encerramento *</label>
                    </div>
                    <textarea
                      name="encerramentoOSRecente"
                      value={formData.encerramentoOSRecente}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Digite ou cole o encerramento da última O.S..."
                      className={`${getInputClass('encerramentoOSRecente')} resize-none`}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bloco 5: Autorização & Atendente */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <Headset className="w-5 h-5 text-red-500" /> 
              Autorização & Atendente
            </h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Autorização por Exceção? *</span>
                <span className={`text-xs font-bold ${
                  formData.authException === 'Sim' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {formData.authException}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, authException: 'Sim' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authException === 'Sim'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={13} className={formData.authException === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, authException: 'Não', nomeAutorizou: '' }));
                    setErrorFields(prev => prev.filter(f => f !== 'nomeAutorizou'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authException === 'Não'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.authException === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>

              <AnimatePresence>
                {formData.authException === 'Sim' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="overflow-hidden mt-3"
                  >
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-0">Nome de quem autorizou *</label>
                    </div>
                    <input 
                      type="text" 
                      name="nomeAutorizou" 
                      value={formData.nomeAutorizou} 
                      onChange={handleChange} 
                      className={getInputClass('nomeAutorizou')} 
                      placeholder="Nome do supervisor ou gerente..." 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Campo Operador / Atendente Atualizado */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className={labelClass}>Operador / Atendente</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Preenchido Automaticamente
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold shadow-sm">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800 truncate">
                  {formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || 'Operador Conectado'}
                </div>
                <div className="text-xs text-slate-500">
                  Usuário logado no sistema
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="xl:col-span-12 flex flex-col sm:flex-row gap-4 pt-4 pb-10">
          <motion.button 
            type="button" 
            onClick={copyScript}
            whileTap={{ scale: 0.98 }}
            animate={copied ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex-1 font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition-all duration-300 cursor-pointer ${
              copied 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50' 
                : 'bg-red-600 hover:bg-red-700 text-white'
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
                  Copiar Script de Reparo
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          
          <button 
            type="button" 
            onClick={() => setShowClearModal(true)}
            className="sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md flex justify-center items-center gap-3 transition cursor-pointer hover:scale-[1.01]"
          >
            <Trash2 size={20} /> Limpar
          </button>
        </div>
      </div>

      {/* Modal de Confirmação Laranja */}
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
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleClear}
                  className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-md transition cursor-pointer"
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
            {toast.type === 'error' && <AlertTriangle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
