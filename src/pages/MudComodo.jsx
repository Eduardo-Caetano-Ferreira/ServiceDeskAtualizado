import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarClock, User, FileText, ShieldCheck, 
  Copy, Trash2, Info, Check 
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';
import { ContactSection } from '../components/ContactSection';
import { createDefaultContact, normalizeContacts, formatContactsForScript } from '../lib/phoneUtils';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  roteador: '',
  onu: '',
  contato: '',
  contatos: [createDefaultContact('', true, '')],
  conseguiuContato: '', // Desmarcado por padrão (obrigatório)
  clienteDesde: '',
  solicitacao: '',
  isentoCusto: 'Não',
  motivoIsencao: '',
  motivoOutroTexto: '',
  cienteCusto: '',
  authExcecao: 'Não',
  nomeAutorizou: '',
  nomeAtendente: ''
};

export function MudComodo() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('osMudancaComodoData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    let loaded = { ...initialState };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loaded = { ...loaded, ...parsed };
        loaded.contatos = normalizeContacts(parsed.contatos, parsed.contato);
        loaded.contato = formatContactsForScript(loaded.contatos);
      } catch {
        // fallback
      }
    }
    // Assegurar que conseguiuContato comece desmarcado na migração para v1.4
    const hasMigratedContato = localStorage.getItem('osMudancaComodo_contato_v1_4');
    if (!hasMigratedContato) {
      loaded.conseguiuContato = '';
      localStorage.setItem('osMudancaComodo_contato_v1_4', 'true');
    }
    if (operadorGlobal) {
      loaded.nomeAtendente = operadorGlobal;
    }
    return loaded;
  });

  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [errorFields, setErrorFields] = useState([]);
  const [copied, setCopied] = useState(false);

  // Sincronização automática do operador
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
    localStorage.setItem('osMudancaComodoData', JSON.stringify(formData));
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
    const { name, value } = e.target;
    
    let finalValue = value;
    if (name === 'contato') {
      finalValue = formatPhone(value);
    }
    if (name === 'nomeAtendente') {
      localStorage.setItem('serviceDesk_operador', value);
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: finalValue };
      
      // Limpa os campos filhos se o pai mudar (Ex: mudou de isento para não isento)
      if (name === 'isentoCusto') {
        if (finalValue === 'Sim') newData.cienteCusto = '';
        if (finalValue === 'Não') {
          newData.motivoIsencao = '';
          newData.motivoOutroTexto = '';
        }
      }
      
      if (name === 'motivoIsencao' && finalValue !== 'Outro') {
        newData.motivoOutroTexto = '';
      }
      
      return newData;
    });

    if (finalValue.trim() !== '') {
      setErrorFields(prev => prev.filter(field => field !== name));
    }
  };

  // Opções para Roteador e ONU idênticas à O.S Geral
  const hardwareOptions = [
    { 
      label: 'Comodato', 
      color: 'emerald', 
      activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-400',
      inactiveClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
    },
    { 
      label: 'Compra', 
      color: 'blue', 
      activeClass: 'bg-blue-600 text-white border-blue-700 shadow-sm ring-1 ring-blue-400',
      inactiveClass: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
    },
    { 
      label: 'Smart-Pré', 
      color: 'red', 
      activeClass: 'bg-red-600 text-white border-red-700 shadow-sm ring-1 ring-red-400',
      inactiveClass: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
    }
  ];

  // Regra automática: selecionar Smart-Pré no roteador também marca a ONU como Smart-Pré
  const handleSelectRoteador = (option) => {
    setFormData(prev => {
      const next = { ...prev, roteador: option };
      if (option === 'Smart-Pré') {
        next.onu = 'Smart-Pré';
      }
      return next;
    });

    setErrorFields(prev => prev.filter(f => {
      if (option === 'Smart-Pré') return f !== 'roteador' && f !== 'onu';
      return f !== 'roteador';
    }));
  };

  // Seleção individual de ONU
  const handleSelectOnu = (option) => {
    setFormData(prev => ({ ...prev, onu: option }));
    setErrorFields(prev => prev.filter(f => f !== 'onu'));
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

  const handleContatosChange = (newContatos) => {
    const formattedStr = formatContactsForScript(newContatos);
    setFormData(prev => ({
      ...prev,
      contatos: newContatos,
      contato: formattedStr
    }));
    if (newContatos.some(c => c.numero && c.numero.trim() !== '')) {
      setErrorFields(prev => prev.filter(f => f !== 'contato'));
    }
  };

  // Lógica de validação
  const validateForm = () => {
    const requiredFields = [
      'dataAgendamento', 'periodo', 'roteador', 'onu', 
      'conseguiuContato', 'clienteDesde', 'solicitacao'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    const hasValidContact = formData.contatos?.some(c => c.numero && c.numero.trim() !== '') || 
      (formData.contato && formData.contato.trim() !== '');
    if (!hasValidContact) {
      newErrors.push('contato');
    }

    const operadorAtual = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador');
    if (!operadorAtual) {
      newErrors.push('nomeAtendente');
    }

    if (formData.periodo === 'Após' && !formData.horarioApos) newErrors.push('horarioApos');
    
    if (formData.isentoCusto === 'Sim') {
      if (!formData.motivoIsencao) newErrors.push('motivoIsencao');
      if (formData.motivoIsencao === 'Outro' && !formData.motivoOutroTexto?.trim()) newErrors.push('motivoOutroTexto');
    } else {
      if (!formData.cienteCusto) newErrors.push('cienteCusto');
    }

    if (formData.authExcecao === 'Sim' && !formData.nomeAutorizou?.trim()) newErrors.push('nomeAutorizou');

    setErrorFields(newErrors);
    return newErrors.length === 0;
  };

  // Geração do script formatado
  const copiarScript = () => {
    if (!validateForm()) {
      if (!formData.conseguiuContato) {
        showToast("Por favor, selecione se conseguiu contato (Sim ou Não).", "error");
      } else if (!formData.roteador || !formData.onu) {
        showToast("Por favor, selecione as opções de Roteador e ONU.", "error");
      } else {
        showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      }
      return;
    }

    const dataAgend = formatDate(formData.dataAgendamento);
    let periodoFmt = formData.periodo === 'Após' ? `Após (${formData.horarioApos})` : formData.periodo;

    let infoCusto;
    if (formData.isentoCusto === 'Sim') {
      let motivo = formData.motivoIsencao === 'Outro' ? formData.motivoOutroTexto : formData.motivoIsencao;
      infoCusto = `ISENTO (Motivo: ${motivo})`;
    } else {
      infoCusto = `Cliente ciente da possibilidade de custo? ${formData.cienteCusto}`;
    }

    let txtExcecao = formData.authExcecao;
    if (formData.authExcecao === 'Sim') {
      txtExcecao += ` (Autorizado por: ${formData.nomeAutorizou})`;
    }

    const operadorFinal = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || '';
    const contatosFmt = formatContactsForScript(formData.contatos) || formData.contato;

    const finalScript = `=== O.S MUDANÇA DE CÔMODO ===
Data: ${dataAgend}
Período: ${periodoFmt}

=== INFORMAÇÕES DO CLIENTE ===
Roteador: ${formData.roteador}
ONU: ${formData.onu}
Contato: ${contatosFmt} (Conseguiu contato: ${formData.conseguiuContato})
Cliente desde: ${formData.clienteDesde}

=== DETALHES O.S ===
Solicitação: ${formData.solicitacao}

=== CUSTO ===
${infoCusto}

=== AUTORIZAÇÃO / ATENDENTE ===
Exceção (Torre)? ${txtExcecao}
Atendente: ${operadorFinal}`.trim();

    navigator.clipboard.writeText(finalScript);
    setCopied(true);
    showToast("Script copiado com sucesso!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmClear = () => {
    const operadorGlobal = localStorage.getItem('serviceDesk_operador') || '';
    setFormData({
      ...initialState,
      contatos: [createDefaultContact('', true, '')],
      conseguiuContato: '',
      nomeAtendente: operadorGlobal 
    });
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
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1400px] mx-auto space-y-6 relative"
    >
      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Bloco 1: Agendamento */}
        <div className={`${cardClass} xl:col-span-4`}>
          <h2 className={titleClass}><CalendarClock size={18} className="text-primary" /> Agendamento</h2>
          <div className="space-y-4 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Data de Agendamento *</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
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
              <select name="periodo" value={formData.periodo} onChange={handleChange} className={getInputClass('periodo')}>
                <option value="">Selecione...</option>
                <option value="Comercial">Comercial</option>
                <option value="Primeira do dia">Primeira do dia</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Última do dia">Última do dia</option>
                <option value="Após">Após (Informar Horário)</option>
              </select>
            </div>
            <AnimatePresence>
              {formData.periodo === 'Após' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                  <label className={labelClass}>Horário Específico *</label>
                  <input type="text" name="horarioApos" value={formData.horarioApos} onChange={handleChange} placeholder="Ex: 17:30" className={getInputClass('horarioApos')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bloco 2: Informações do Cliente */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}><User size={18} className="text-primary" /> Informações do Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Opções de Roteador em Coluna */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Roteador *</label>
                {formData.roteador && (
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    formData.roteador === 'Comodato' ? 'text-emerald-700 bg-emerald-50' :
                    formData.roteador === 'Compra' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {formData.roteador}
                  </span>
                )}
              </div>
              <div className={`flex flex-col gap-2 p-1.5 rounded-xl border transition-all ${
                errorFields.includes('roteador')
                  ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-200 bg-slate-50/70'
              }`}>
                {hardwareOptions.map((opt) => {
                  const isSelected = formData.roteador === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectRoteador(opt.label)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-between shadow-2xs cursor-pointer ${
                        isSelected ? opt.activeClass : opt.inactiveClass
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${
                          opt.color === 'emerald' ? 'bg-emerald-400' : opt.color === 'blue' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opções de ONU em Coluna */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>ONU *</label>
                {formData.onu && (
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    formData.onu === 'Comodato' ? 'text-emerald-700 bg-emerald-50' :
                    formData.onu === 'Compra' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {formData.onu}
                  </span>
                )}
              </div>
              <div className={`flex flex-col gap-2 p-1.5 rounded-xl border transition-all ${
                errorFields.includes('onu')
                  ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-200 bg-slate-50/70'
              }`}>
                {hardwareOptions.map((opt) => {
                  const isSelected = formData.onu === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSelectOnu(opt.label)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-between shadow-2xs cursor-pointer ${
                        isSelected ? opt.activeClass : opt.inactiveClass
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected ? (
                        <Check size={14} className="text-white" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full ${
                          opt.color === 'emerald' ? 'bg-emerald-400' : opt.color === 'blue' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção de Contatos com Máscara +55, Múltiplas Linhas, Titular e Switch */}
            <div className="sm:col-span-2 xl:col-span-1">
              <ContactSection
                contatos={formData.contatos}
                onChangeContatos={handleContatosChange}
                conseguiuContato={formData.conseguiuContato}
                onChangeConseguiuContato={(val) => {
                  setFormData(prev => ({ ...prev, conseguiuContato: val }));
                  setErrorFields(prev => prev.filter(f => f !== 'conseguiuContato'));
                }}
                errorFields={errorFields}
                showConseguiuContato={true}
              />
            </div>

            {/* Cliente Desde */}
            <div className="sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Cliente Desde *</label>
              </div>
              <input 
                type="text" 
                name="clienteDesde" 
                value={formData.clienteDesde} 
                onChange={handleChange} 
                placeholder="Ex: 05/2020" 
                className={getInputClass('clienteDesde')} 
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Detalhes e Custo */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><FileText size={18} className="text-primary" /> Detalhes e Custo</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
              <label className={`${labelClass} mb-0`}>Solicitação *</label>
            </div>
            <textarea 
              name="solicitacao" 
              value={formData.solicitacao} 
              onChange={handleChange} 
              rows="3" 
              placeholder="Descreva o cômodo de origem e o cômodo de destino..."
              className={getInputClass('solicitacao', 'resize-none')}
            />
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            {/* SWITCH ISENTO DE CUSTO */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Cliente será isento do custo?</span>
                <span className={`text-xs font-bold ${
                  formData.isentoCusto === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  {formData.isentoCusto}
                </span>
              </div>
              
              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      isentoCusto: 'Sim',
                      cienteCusto: ''
                    }));
                    setErrorFields(prev => prev.filter(f => f !== 'isentoCusto' && f !== 'cienteCusto'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.isentoCusto === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={14} className={formData.isentoCusto === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      isentoCusto: 'Não',
                      motivoIsencao: '',
                      motivoOutroTexto: ''
                    }));
                    setErrorFields(prev => prev.filter(f => f !== 'isentoCusto' && f !== 'motivoIsencao' && f !== 'motivoOutroTexto'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.isentoCusto === 'Não'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.isentoCusto === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formData.isentoCusto === 'Sim' ? (
                <motion.div 
                  key="isento" 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="border-t border-slate-200 pt-4"
                >
                  <label className="block text-sm font-bold text-red-800 mb-2">Motivo da Isenção *</label>
                  <select name="motivoIsencao" value={formData.motivoIsencao} onChange={handleChange} className={getInputClass('motivoIsencao', 'mb-3')}>
                    <option value="">Selecione...</option>
                    <option value="Cliente antigo">Cliente antigo</option>
                    <option value="Primeira isenção">Primeira isenção</option>
                    <option value="Ameaçou cancelamento">Ameaçou cancelamento</option>
                    <option value="Autorizado diretoria">Autorizado diretoria</option>
                    <option value="Outro">Outro</option>
                  </select>
                  
                  <AnimatePresence>
                    {formData.motivoIsencao === 'Outro' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
                        <input 
                          type="text" 
                          name="motivoOutroTexto" 
                          value={formData.motivoOutroTexto} 
                          onChange={handleChange} 
                          placeholder="Digite o motivo específico..." 
                          className={getInputClass('motivoOutroTexto', 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-white')} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  key="ciente" 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="border-t border-slate-200 pt-4"
                >
                  {/* SWITCH CLIENTE CIENTE DO CUSTO */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                      <span className="block text-sm font-medium text-slate-800">Cliente ciente da possibilidade de ser gerado custo? *</span>
                      {formData.cienteCusto && (
                        <span className={`text-xs font-bold ${
                          formData.cienteCusto === 'Sim' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formData.cienteCusto}
                        </span>
                      )}
                    </div>
                    
                    <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
                      errorFields.includes('cienteCusto')
                        ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
                        : 'border-slate-300 bg-slate-100'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cienteCusto: 'Sim' }));
                          setErrorFields(prev => prev.filter(f => f !== 'cienteCusto'));
                        }}
                        className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          formData.cienteCusto === 'Sim'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <Check size={14} className={formData.cienteCusto === 'Sim' ? 'text-white' : 'opacity-30'} />
                        Sim
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cienteCusto: 'Não' }));
                          setErrorFields(prev => prev.filter(f => f !== 'cienteCusto'));
                        }}
                        className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          formData.cienteCusto === 'Não'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span className={`text-xs ${formData.cienteCusto === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                        Não
                      </button>
                    </div>

                    {errorFields.includes('cienteCusto') && (
                      <p className="text-red-500 text-xs mt-1 font-medium">Selecione se o cliente está ciente do custo.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bloco 4: Autorização & Atendente */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}><ShieldCheck size={18} className="text-primary" /> Autorização & Atendente</h2>

          <div className="flex-grow space-y-6">
            {/* SWITCH AUTORIZAÇÃO POR EXCEÇÃO */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className={labelClass}>Autorização por Exceção (Torre)?</span>
                <span className={`text-xs font-bold ${
                  formData.authExcecao === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  {formData.authExcecao}
                </span>
              </div>
              
              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, authExcecao: 'Sim' }));
                    setErrorFields(prev => prev.filter(f => f !== 'authExcecao'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authExcecao === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={14} className={formData.authExcecao === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, authExcecao: 'Não', nomeAutorizou: '' }));
                    setErrorFields(prev => prev.filter(f => f !== 'authExcecao' && f !== 'nomeAutorizou'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authExcecao === 'Não'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.authExcecao === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>

              <AnimatePresence>
                {formData.authExcecao === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="text-xs font-bold text-red-700 block mb-1">Nome de quem autorizou *</label>
                    <input 
                      type="text" 
                      name="nomeAutorizou" 
                      value={formData.nomeAutorizou} 
                      onChange={handleChange} 
                      placeholder="Nome do responsável que autorizou..."
                      className={getInputClass('nomeAutorizou', 'bg-red-50 border-red-200 focus:border-red-500 focus:ring-red-500')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Atendente / Operador automático idêntico à O.S Geral */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Atendente / Operador</label>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between h-[52px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 leading-none mb-0.5">
                      Atendente Vinculado
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || 'Operador Conectado'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Preenchido Automaticamente
                </span>
              </div>
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
            className={`flex-1 font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition-all duration-300 transform cursor-pointer ${
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
            type="button"
            onClick={() => setShowClearModal(true)} 
            className="sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01] cursor-pointer"
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
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={confirmClear}
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
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}