import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarClock, User, Settings, ClipboardCheck, ShieldCheck, 
  Copy, Trash2, Info, Check, AlertTriangle 
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';
import { ContactSection } from '../components/ContactSection';
import { createDefaultContact, normalizeContacts, formatContactsForScript } from '../lib/phoneUtils';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  solicitacao: '',
  contato: '',
  contatos: [createDefaultContact('', true, '')],
  conseguiuContato: '', // Desmarcado por padrão (obrigatório)
  planoAtual: '',
  roteadorPrincipal: '',
  onuPrincipal: '',
  clienteDesde: '',
  
  upgrade: 'Não', // Padrão Não
  necessarioRoteador: 'Não', // Padrão Não
  tipoRoteador: '',
  
  gerarCusto: 'Não', // Padrão Não
  cienteCusto: '',
  valorCusto: '',
  custoPorMetro: false,
  vencimentoCusto: '',
  
  motivoIsencao: '',
  motivoOutroTexto: '',
  
  avaliacaoTecnica: 'Não', // Padrão Não
  baixaAvaliacao: '',
  
  authExcecao: 'Não', // Padrão Não
  nomeAutorizou: '',
  nomeAtendente: ''
};

export function PontoAdicional() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('osPontoAdicionalData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    
    let loadedData = { ...initialState };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedData = { ...loadedData, ...parsed };
        loadedData.contatos = normalizeContacts(parsed.contatos, parsed.contato);
        loadedData.contato = formatContactsForScript(loadedData.contatos);
      } catch {
        // ignore
      }
    }

    // Assegurar migração para v1.4: campo conseguiuContato inicia desmarcado
    const hasMigratedContato = localStorage.getItem('osPontoAdicional_contato_v1_4');
    if (!hasMigratedContato) {
      loadedData.conseguiuContato = '';
      localStorage.setItem('osPontoAdicional_contato_v1_4', 'true');
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
    localStorage.setItem('osPontoAdicionalData', JSON.stringify(formData));
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
      if (name === 'gerarCusto') {
        if (finalValue === 'Sim') {
          next.motivoIsencao = '';
          next.motivoOutroTexto = '';
        } else {
          next.cienteCusto = '';
          next.valorCusto = '';
          next.vencimentoCusto = '';
          next.custoPorMetro = false;
        }
      }
      if (name === 'motivoIsencao' && finalValue !== 'Outro') {
        next.motivoOutroTexto = '';
      }
      if (name === 'necessarioRoteador' && finalValue === 'Não') {
        next.tipoRoteador = '';
      }
      if (name === 'avaliacaoTecnica' && finalValue === 'Não') {
        next.baixaAvaliacao = '';
      }
      if (name === 'authExcecao' && finalValue === 'Não') {
        next.nomeAutorizou = '';
      }

      return next;
    });

    if (type === 'checkbox' || (typeof finalValue === 'string' && finalValue.trim() !== '')) {
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

  // Regra automática da O.S Geral: selecionar Smart-Pré no roteador também marca a ONU como Smart-Pré
  const handleSelectRoteador = (option) => {
    setFormData(prev => {
      const next = { ...prev, roteadorPrincipal: option };
      if (option === 'Smart-Pré') {
        next.onuPrincipal = 'Smart-Pré';
      }
      return next;
    });

    setErrorFields(prev => prev.filter(f => {
      if (option === 'Smart-Pré') return f !== 'roteadorPrincipal' && f !== 'onuPrincipal';
      return f !== 'roteadorPrincipal';
    }));
  };

  // Seleção individual de ONU
  const handleSelectOnu = (option) => {
    setFormData(prev => ({ ...prev, onuPrincipal: option }));
    setErrorFields(prev => prev.filter(f => f !== 'onuPrincipal'));
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

  // Lógica de Validação
  const validateForm = () => {
    const requiredFields = [
      'dataAgendamento', 'periodo', 'solicitacao', 'conseguiuContato', 
      'planoAtual', 'roteadorPrincipal', 'onuPrincipal'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors.push(field);
      }
    });

    const hasValidContact = formData.contatos?.some(c => c.numero && c.numero.trim() !== '') || 
      (formData.contato && formData.contato.trim() !== '');
    if (!hasValidContact) {
      newErrors.push('contato');
    }

    if (formData.periodo === 'Após' && !formData.horarioApos?.trim()) {
      newErrors.push('horarioApos');
    }
    if (formData.necessarioRoteador === 'Sim' && !formData.tipoRoteador?.trim()) {
      newErrors.push('tipoRoteador');
    }
    
    if (formData.gerarCusto === 'Sim') {
      if (!formData.cienteCusto) newErrors.push('cienteCusto');
      if (!formData.valorCusto?.trim()) newErrors.push('valorCusto');
      if (!formData.vencimentoCusto?.trim()) newErrors.push('vencimentoCusto');
    } else {
      if (!formData.motivoIsencao) newErrors.push('motivoIsencao');
      if (formData.motivoIsencao === 'Outro' && !formData.motivoOutroTexto?.trim()) {
        newErrors.push('motivoOutroTexto');
      }
    }
    
    if (formData.avaliacaoTecnica === 'Sim' && !formData.baixaAvaliacao?.trim()) {
      newErrors.push('baixaAvaliacao');
    }
    if (formData.authExcecao === 'Sim' && !formData.nomeAutorizou?.trim()) {
      newErrors.push('nomeAutorizou');
    }

    setErrorFields(newErrors);

    if (newErrors.length > 0) {
      if (newErrors.includes('conseguiuContato') && !formData.conseguiuContato) {
        showToast("Por favor, selecione se conseguiu contato com o cliente (Sim ou Não).", "error");
      } else if (newErrors.includes('roteadorPrincipal') || newErrors.includes('onuPrincipal')) {
        showToast("Selecione o modelo do Roteador e da ONU.", "error");
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
    let periodoFmt = formData.periodo === 'Após' ? `Após (${formData.horarioApos})` : formData.periodo;

    let infoRoteador = `Necessita Roteador? ${formData.necessarioRoteador}`;
    if (formData.necessarioRoteador === 'Sim') {
      infoRoteador += `\nTipo Roteador: ${formData.tipoRoteador}`;
    }

    let textoCusto;
    if (formData.gerarCusto === 'Sim') {
      textoCusto = `GERAR CUSTO: Sim`;
      const isMetro = formData.custoPorMetro ? "(Cobrado por metro)" : "";
      const vcto = formatDate(formData.vencimentoCusto);
      
      textoCusto += `\n   - Cliente Ciente: ${formData.cienteCusto}\n   - Valor: R$ ${formData.valorCusto} ${isMetro}\n   - Vencimento: ${vcto}`;
    } else {
      let motivo = formData.motivoIsencao === 'Outro' ? formData.motivoOutroTexto : formData.motivoIsencao;
      textoCusto = `GERAR CUSTO: Não (Isento - Motivo: ${motivo})`;
    }

    let textoAvaliacao = `Avaliação Técnica Feita? ${formData.avaliacaoTecnica}`;
    if (formData.avaliacaoTecnica === 'Sim') {
      textoAvaliacao += `\n   - Baixa: ${formData.baixaAvaliacao}`;
    }

    let textoExcecao = `Autorização por Exceção: ${formData.authExcecao}`;
    if (formData.authExcecao === 'Sim') {
      textoExcecao += ` (Por: ${formData.nomeAutorizou})`;
    }

    const operadorFinal = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || 'Operador Conectado';
    const contatosFmt = formatContactsForScript(formData.contatos) || formData.contato;

    const scriptFinal = `=== O.S PONTO ADICIONAL ===
Data: ${dataAgend}
Período: ${periodoFmt}
Solicitação: ${formData.solicitacao}

=== INFORMAÇÕES DO CLIENTE ===
Contato: ${contatosFmt} (Conseguiu contato: ${formData.conseguiuContato || 'Não informado'})
Plano Atual: ${formData.planoAtual}
Roteador: ${formData.roteadorPrincipal}
ONU: ${formData.onuPrincipal}
Cliente desde: ${formData.clienteDesde || 'Não informado'}

=== INFORMAÇÕES DA O.S ===
Upgrade? ${formData.upgrade}
${infoRoteador}
${textoCusto}

=== AVALIAÇÃO TÉCNICA ===
${textoAvaliacao}

=== AUTORIZAÇÃO / ATENDENTE ===
${textoExcecao}
Atendente: ${operadorFinal}
`.trim();

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
    setFormData({
      ...initialState,
      contatos: [createDefaultContact('', true, '')],
      nomeAtendente: atendenteAtual 
    });
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
                  <label className={`${labelClass} mb-0`}>Data de Agendamento *</label>
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
                      placeholder="Ex: 17:30" 
                      className={getInputClass('horarioApos')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Solicitação *</label>
                </div>
                <textarea 
                  name="solicitacao"
                  value={formData.solicitacao}
                  onChange={handleChange}
                  rows="4" 
                  className={getInputClass('solicitacao', 'resize-none')} 
                  placeholder="Detalhes da solicitação do ponto adicional..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Informações do Cliente */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}>
            <User className="w-5 h-5 text-red-500" /> 
            Informações do Cliente
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Opções de Roteador em Coluna */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Roteador *</label>
                {formData.roteadorPrincipal && (
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    formData.roteadorPrincipal === 'Comodato' ? 'text-emerald-700 bg-emerald-50' :
                    formData.roteadorPrincipal === 'Compra' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {formData.roteadorPrincipal}
                  </span>
                )}
              </div>
              <div className={`flex flex-col gap-2 p-1.5 rounded-xl border transition-all ${
                errorFields.includes('roteadorPrincipal')
                  ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-200 bg-slate-50/70'
              }`}>
                {hardwareOptions.map((opt) => {
                  const isSelected = formData.roteadorPrincipal === opt.label;
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
                {formData.onuPrincipal && (
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    formData.onuPrincipal === 'Comodato' ? 'text-emerald-700 bg-emerald-50' :
                    formData.onuPrincipal === 'Compra' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {formData.onuPrincipal}
                  </span>
                )}
              </div>
              <div className={`flex flex-col gap-2 p-1.5 rounded-xl border transition-all ${
                errorFields.includes('onuPrincipal')
                  ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-200 bg-slate-50/70'
              }`}>
                {hardwareOptions.map((opt) => {
                  const isSelected = formData.onuPrincipal === opt.label;
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

            {/* Plano Atual & Cliente Desde */}
            <div className="sm:col-span-2 xl:col-span-1 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Plano Atual *</label>
                </div>
                <select 
                  name="planoAtual"
                  value={formData.planoAtual}
                  onChange={handleChange}
                  className={getInputClass('planoAtual')}
                >
                  <option value="">Selecione...</option>
                  <option value="10Mbps">10Mbps</option>
                  <option value="100Mbps">100Mbps</option>
                  <option value="600Mbps">600Mbps</option>
                  <option value="800Mbps">800Mbps</option>
                  <option value="1000 Mbps">1000 Mbps</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Cliente Desde</label>
                </div>
                <input 
                  type="text" 
                  name="clienteDesde" 
                  value={formData.clienteDesde} 
                  onChange={handleChange} 
                  placeholder="Ex: 05/2021" 
                  className={getInputClass('clienteDesde')} 
                />
              </div>
            </div>

          </div>
        </div>

        {/* Bloco 3: Informações da O.S. (Switches) */}
        <div className={`${cardClass} xl:col-span-12`}>
          <h2 className={titleClass}>
            <Settings className="w-5 h-5 text-red-500" /> 
            Informações da O.S.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              
              {/* SWITCH UPGRADE */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <span className="block text-sm font-semibold text-slate-700">Cliente realizou upgrade?</span>
                  <span className={`text-xs font-bold ${
                    formData.upgrade === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {formData.upgrade}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, upgrade: 'Sim' }))}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.upgrade === 'Sim'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Check size={13} className={formData.upgrade === 'Sim' ? 'text-white' : 'opacity-30'} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, upgrade: 'Não' }))}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.upgrade === 'Não'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className={`text-xs ${formData.upgrade === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                    Não
                  </button>
                </div>
              </div>

              {/* SWITCH NECESSÁRIO ROTEADOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <span className="block text-sm font-semibold text-slate-700">Será necessário roteador?</span>
                  <span className={`text-xs font-bold ${
                    formData.necessarioRoteador === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {formData.necessarioRoteador}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, necessarioRoteador: 'Sim' }))}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.necessarioRoteador === 'Sim'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Check size={13} className={formData.necessarioRoteador === 'Sim' ? 'text-white' : 'opacity-30'} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, necessarioRoteador: 'Não', tipoRoteador: '' }));
                      setErrorFields(prev => prev.filter(f => f !== 'tipoRoteador'));
                    }}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.necessarioRoteador === 'Não'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className={`text-xs ${formData.necessarioRoteador === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                    Não
                  </button>
                </div>

                <AnimatePresence>
                  {formData.necessarioRoteador === 'Sim' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                        <label className="block text-xs font-bold uppercase tracking-wider text-red-800 mb-2">Qual o tipo do roteador? *</label>
                        <select 
                          name="tipoRoteador" 
                          value={formData.tipoRoteador}
                          onChange={handleChange}
                          className={getInputClass('tipoRoteador')}
                        >
                          <option value="">Selecione...</option>
                          <option value="Comodato">Comodato</option>
                          <option value="Compra">Compra</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* CUSTO E ISENÇÃO COM SWITCHES */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              
              {/* SWITCH GERAR CUSTO */}
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <span className="block text-sm font-bold text-slate-800">Será gerado custo?</span>
                  <span className={`text-xs font-bold ${
                    formData.gerarCusto === 'Sim' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {formData.gerarCusto}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-white transition-all h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        gerarCusto: 'Sim',
                        motivoIsencao: '',
                        motivoOutroTexto: ''
                      }));
                      setErrorFields(prev => prev.filter(f => f !== 'motivoIsencao' && f !== 'motivoOutroTexto'));
                    }}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.gerarCusto === 'Sim'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Check size={13} className={formData.gerarCusto === 'Sim' ? 'text-white' : 'opacity-30'} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        gerarCusto: 'Não',
                        cienteCusto: '',
                        valorCusto: '',
                        vencimentoCusto: '',
                        custoPorMetro: false
                      }));
                      setErrorFields(prev => prev.filter(f => f !== 'cienteCusto' && f !== 'valorCusto' && f !== 'vencimentoCusto'));
                    }}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.gerarCusto === 'Não'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`text-xs ${formData.gerarCusto === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                    Não (Isento)
                  </button>
                </div>
              </div>

              {/* CAMPOS DEPENDENTES DE GERAR CUSTO */}
              <AnimatePresence mode="wait">
                {formData.gerarCusto === 'Sim' ? (
                  <motion.div 
                    key="custo"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 border-t border-slate-200 pt-4"
                  >
                    {/* SWITCH CLIENTE CIENTE DO CUSTO */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                        <span className="block text-xs font-semibold text-slate-700">Cliente ciente do custo? *</span>
                        {formData.cienteCusto && (
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            formData.cienteCusto === 'Sim' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                          }`}>
                            {formData.cienteCusto}
                          </span>
                        )}
                      </div>

                      <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
                        errorFields.includes('cienteCusto')
                          ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
                          : 'border-slate-300 bg-white'
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
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Check size={13} className={formData.cienteCusto === 'Sim' ? 'text-white' : 'opacity-30'} />
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
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`text-xs ${formData.cienteCusto === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                          Não
                        </button>
                      </div>

                      {errorFields.includes('cienteCusto') && (
                        <p className="text-[10px] font-bold text-red-600 mt-1">
                          Selecione se o cliente está ciente.
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                          <label className={`${labelClass} mb-0`}>Valor (R$) *</label>
                        </div>
                        <input 
                          type="text" 
                          name="valorCusto"
                          value={formData.valorCusto}
                          onChange={handleChange}
                          placeholder="0,00" 
                          className={getInputClass('valorCusto')} 
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-white px-3.5 py-2.5 border border-slate-300 rounded-xl w-full hover:bg-slate-50 transition-colors h-[42px]">
                          <input 
                            type="checkbox" 
                            name="custoPorMetro"
                            checked={formData.custoPorMetro}
                            onChange={handleChange}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4" 
                          /> 
                          Cobrar por metro?
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                        <label className={`${labelClass} mb-0`}>Vencimento *</label>
                        <button
                          type="button"
                          onClick={() => setTodayDate('vencimentoCusto')}
                          className="text-xs text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Hoje
                        </button>
                      </div>
                      <DateInputWithCalendar 
                        name="vencimentoCusto"
                        value={formData.vencimentoCusto}
                        onChange={handleChange}
                        placeholder="DD/MM/AAAA"
                        className={getInputClass('vencimentoCusto')} 
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="isencao"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 border-t border-slate-200 pt-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-0">Motivo da Isenção *</label>
                      </div>
                      <select 
                        name="motivoIsencao"
                        value={formData.motivoIsencao}
                        onChange={handleChange}
                        className={getInputClass('motivoIsencao')}
                      >
                        <option value="">Selecione o motivo...</option>
                        <option value="Cliente antigo">Cliente antigo</option>
                        <option value="Primeira isenção">Primeira isenção</option>
                        <option value="Ameaçou cancelamento">Ameaçou cancelamento</option>
                        <option value="Autorizado diretoria">Autorizado diretoria</option>
                        <option value="Upgrade">Upgrade</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    
                    <AnimatePresence>
                      {formData.motivoIsencao === 'Outro' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <input 
                            type="text" 
                            name="motivoOutroTexto"
                            value={formData.motivoOutroTexto}
                            onChange={handleChange}
                            placeholder="Descreva o motivo específico... *" 
                            className={`mt-2 ${getInputClass('motivoOutroTexto')}`} 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Bloco 4: Avaliação Técnica (Switch) */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <ClipboardCheck className="w-5 h-5 text-red-500" /> 
              Avaliação Técnica
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Já foi feita avaliação técnica?</span>
                <span className={`text-xs font-bold ${
                  formData.avaliacaoTecnica === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                }`}>
                  {formData.avaliacaoTecnica}
                </span>
              </div>
              
              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avaliacaoTecnica: 'Sim' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.avaliacaoTecnica === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={13} className={formData.avaliacaoTecnica === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, avaliacaoTecnica: 'Não', baixaAvaliacao: '' }));
                    setErrorFields(prev => prev.filter(f => f !== 'baixaAvaliacao'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.avaliacaoTecnica === 'Não'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.avaliacaoTecnica === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {formData.avaliacaoTecnica === 'Sim' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                    <label className={`${labelClass} mb-0`}>Baixa da Avaliação *</label>
                  </div>
                  <textarea 
                    name="baixaAvaliacao"
                    value={formData.baixaAvaliacao}
                    onChange={handleChange}
                    rows="3" 
                    className={getInputClass('baixaAvaliacao', 'resize-none')} 
                    placeholder="Informe o resultado da avaliação..."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bloco 5: Autorização & Atendente */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <ShieldCheck className="w-5 h-5 text-red-500" /> 
              Autorização & Atendente
            </h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className="block text-sm font-semibold text-slate-700">Autorização por Exceção (Torre)?</span>
                <span className={`text-xs font-bold ${
                  formData.authExcecao === 'Sim' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {formData.authExcecao}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, authExcecao: 'Sim' }))}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authExcecao === 'Sim'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={13} className={formData.authExcecao === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, authExcecao: 'Não', nomeAutorizou: '' }));
                    setErrorFields(prev => prev.filter(f => f !== 'nomeAutorizou'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.authExcecao === 'Não'
                      ? 'bg-slate-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.authExcecao === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
              
              <AnimatePresence>
                {formData.authExcecao === 'Sim' && (
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
                      placeholder="Nome do supervisor ou responsável..."
                      className={getInputClass('nomeAutorizou')} 
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
                  Copiar Script Ponto Adicional
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
