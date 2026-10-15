import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, User, FileText, Cpu, Clock, Headset,
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
  conseguiuContato: '', // Padrão vazio para obrigar o operador a selecionar antes de copiar
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
        const parsed = JSON.parse(savedForm);
        loadedData = { ...loadedData, ...parsed };
        loadedData.contatos = normalizeContacts(parsed.contatos, parsed.contato);
        loadedData.contato = formatContactsForScript(loadedData.contatos);
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      }
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

  // Sincronização automática do operador definido no modal
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

  // Salvamento contínuo do formulário no localStorage
  useEffect(() => {
    localStorage.setItem('serviceDeskScriptData', JSON.stringify(formData));
  }, [formData]);

  // Máscara automática para telefones fixos e celulares (Brasil)
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
    
    if (name === 'nomeAtendente') {
      localStorage.setItem('serviceDesk_operador', value);
    }

    let finalValue = value;
    if (name === 'contato') {
      finalValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    if (finalValue.trim() !== '') {
      setErrorFields(prev => prev.filter(field => field !== name));
    }
  };

  // Seleção de Roteador com regra automática: Smart-Pré no roteador também marca a ONU
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
    return dateString;
  };

  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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

  const validateForm = () => {
    const requiredFields = [
      'dataAgendamento', 'periodo', 'roteador', 'onu', 
      'conseguiuContato', 'clienteDesde', 'solicitacao', 'sinalStatus'
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

    const op = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador');
    if (!op) {
      newErrors.push('nomeAtendente');
    }

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
      if (!formData.conseguiuContato) {
        showToast("Por favor, selecione se conseguiu contato (Sim ou Não).", "error");
      } else {
        showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      }
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

    const atendenteAtual = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || '';
    const contatosFmt = formatContactsForScript(formData.contatos) || formData.contato;

    const finalScript = `=== AGENDAMENTO ===
DATA: ${dataAgend}
PERÍODO: ${periodoFmt}

=== INFORMAÇÕES DO CLIENTE ===
Roteador: ${formData.roteador}
ONU: ${formData.onu}
Contato: ${contatosFmt} (Conseguiu contato: ${formData.conseguiuContato})
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
Atendente: ${atendenteAtual}
${scriptExcecao}`.trim();

    navigator.clipboard.writeText(finalScript);
    setCopied(true);
    showToast("Script copiado com sucesso!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmClear = () => {
    const operadorGlobal = localStorage.getItem('serviceDesk_operador') || '';
    
    const clearedState = {
      ...initialState,
      contatos: [createDefaultContact('', true, '')],
      conseguiuContato: '',
      nomeAtendente: operadorGlobal 
    };

    setFormData(clearedState);
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
  const cardClass = "bg-white rounded-xl shadow-sm p-5 sm:p-6 border-t-4 border-primary border-x border-b border-slate-200 flex flex-col h-full";
  const titleClass = "text-base font-bold border-b border-slate-200 pb-2 mb-4 text-slate-800 flex items-center gap-2";

  // Atalhos rápidos para Sinal/Status da ONU
  const statusShortcuts = [
    { label: 'LOS', value: 'LOS', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
    { label: 'Sem energia', value: 'Sem energia', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { label: 'Não encontrado/desprovisionado', value: 'Não encontrado/desprovisionado', color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' }
  ];

  // Opções para Roteador e ONU
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 relative pb-10"
    >
      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA COM PESQUISA POR CIDADE/BAIRRO) */}
      <TechniciansRegion />

      {/* GRADE COM CARTÕES LATERALIZADOS (MODELO ORIGINAL AGRADÁVEL E 100% DE LARGURA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 w-full">
        
        {/* Bloco 1: Agendamento */}
        <div className={`${cardClass} xl:col-span-4`}>
          <h2 className={titleClass}>
            <Calendar size={18} className="text-primary" /> 
            Agendamento
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>Data de Agendamento *</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Hoje ({getTodayFormatted()})
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
              <label className={labelClass}>Período *</label>
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
                  <label className={labelClass}>Horário Específico *</label>
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

        {/* Bloco 2: Informações do Cliente */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}>
            <User size={18} className="text-primary" /> 
            Informações do Cliente
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Opções de Roteador em Coluna */}
            <div>
              <label className={labelClass}>Roteador *</label>
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
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-between shadow-2xs ${
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
              <label className={labelClass}>ONU *</label>
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
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-between shadow-2xs ${
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

            <div className="sm:col-span-2 xl:col-span-1">
              <label className={labelClass}>Cliente desde *</label>
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

        {/* Bloco 3: Detalhes da O.S. */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}>
            <FileText size={18} className="text-primary" /> 
            Detalhes da O.S.
          </h2>
          <div className="flex-grow">
            <label className={labelClass}>Solicitação (Motivo) *</label>
            <textarea 
              name="solicitacao" 
              value={formData.solicitacao} 
              onChange={handleChange} 
              rows="5" 
              className={getInputClass('solicitacao', 'resize-none')} 
              placeholder="Descreva detalhadamente a solicitação do cliente..."
            />
          </div>
        </div>

        {/* Bloco 4: Informações Técnicas com Atalhos Rápidos */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}>
            <Cpu size={18} className="text-primary" /> 
            Informações Técnicas
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Sinal / Status ONU *</label>
                <span className="text-[11px] font-bold text-slate-400">Atalhos rápidos:</span>
              </div>
              <input 
                type="text" 
                name="sinalStatus" 
                value={formData.sinalStatus} 
                onChange={handleChange} 
                className={getInputClass('sinalStatus')} 
                placeholder="Ex: -20dbm / Online ou clique em um atalho abaixo" 
              />

              {/* ATALHOS RÁPIDOS: LOS, Sem energia, Não encontrado/desprovisionado */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {statusShortcuts.map((sc) => {
                  const isSelected = formData.sinalStatus === sc.value;
                  return (
                    <button
                      key={sc.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, sinalStatus: sc.value }));
                        setErrorFields(prev => prev.filter(f => f !== 'sinalStatus'));
                      }}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-red-600 text-white border-red-700 shadow-xs ring-1 ring-red-400' 
                          : `${sc.color} hover:shadow-xs active:scale-95`
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Histórico de Quedas / Logs <span className="text-slate-400 font-normal text-xs">(Opcional)</span>
              </label>
              <textarea 
                name="historicoQuedas" 
                value={formData.historicoQuedas} 
                onChange={handleChange} 
                rows="2" 
                className={getInputClass('historicoQuedas', 'resize-none')} 
                placeholder="Copie os logs relevantes aqui..."
              />
            </div>
          </div>
        </div>

        {/* Bloco 5: Última O.S. (Com Encerramento em TextArea) */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}>
            <Clock size={18} className="text-primary" /> 
            Última O.S.
          </h2>
          <div className="mb-4">
            <span className={labelClass}>Teve atendimento recente?</span>
            <div className="flex gap-4">
              {['Sim', 'Não'].map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1 justify-center font-medium">
                  <input type="radio" name="recentOS" value={op} checked={formData.recentOS === op} onChange={handleChange} className="text-primary focus:ring-primary accent-primary" /> 
                  {op}
                </label>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {formData.recentOS === 'Sim' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className={labelClass}>Tipo *</label>
                  <input type="text" name="tipoOSRecente" value={formData.tipoOSRecente} onChange={handleChange} placeholder="Ex: Reparo, Mudança..." className={getInputClass('tipoOSRecente')} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Data *</label>
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
                  <label className={labelClass}>Encerramento *</label>
                  <textarea 
                    name="encerramentoOSRecente" 
                    value={formData.encerramentoOSRecente} 
                    onChange={handleChange} 
                    rows="3" 
                    placeholder="Cole ou descreva o motivo e os detalhes do encerramento..." 
                    className={getInputClass('encerramentoOSRecente', 'resize-none')} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bloco 6: Detalhes do Atendimento */}
        <div className={`${cardClass} xl:col-span-6`}>
          <h2 className={titleClass}>
            <Headset size={18} className="text-primary" /> 
            Detalhes do Atendimento
          </h2>
          <div className="space-y-4 flex-grow">
            
            {/* Indicador do atendente carregado no sistema */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
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

            <div>
              <span className={labelClass}>Autorização por Exceção?</span>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1 justify-center font-medium">
                    <input type="radio" name="authException" value={op} checked={formData.authException === op} onChange={handleChange} className="text-primary focus:ring-primary accent-primary" /> 
                    {op}
                  </label>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {formData.authException === 'Sim' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className={labelClass}>Quem Autorizou? *</label>
                  <input type="text" name="nomeAutorizou" value={formData.nomeAutorizou} onChange={handleChange} placeholder="Nome de quem autorizou..." className={getInputClass('nomeAutorizou')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bloco 7: Botões de Ação */}
        <div className="xl:col-span-12 flex flex-col sm:flex-row gap-4 pt-2">
          <motion.button 
            type="button" 
            onClick={copiarScript}
            whileTap={{ scale: 0.98 }}
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
                  Script Copiado com Sucesso!
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
            className="sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
          >
            <Trash2 size={20} /> Limpar
          </button>
        </div>

      </div>

      {/* Modal de Confirmação de Limpeza */}
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
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
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