import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, MapPin, FileCheck, PackageCheck, 
  ShieldCheck, Copy, Trash2, AlertTriangle, Info, Check, MessageSquarePlus, User
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';
import { ContactSection } from '../components/ContactSection';
import { createDefaultContact, normalizeContacts, formatContactsForScript } from '../lib/phoneUtils';

const initialState = {
  podeAdiantar: '', // Desmarcado por padrão (obrigatório)
  adicionarObs: 'Não',
  observacaoCliente: '',
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  clienteDesde: '',
  contato: '',
  contatos: [createDefaultContact('', true, '')],
  conseguiuContato: '', // Desmarcado por padrão (obrigatório)
  enderecoAtual: '',
  novoEndereco: '',
  refNovoEndereco: '',
  locMaps: '',
  comprovante: '',
  pontoAdicional: '', // Desmarcado por padrão (obrigatório)
  eteccResolve: '',
  authExcecao: 'Não', // Marcado como Não por padrão
  nomeAutorizou: '',
  nomeAtendente: ''
};

export function MudEndereco() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('osMudancaEndData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    let loaded = { ...initialState };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loaded = { ...loaded, ...parsed };
        loaded.contatos = normalizeContacts(parsed.contatos, parsed.contato);
        loaded.contato = formatContactsForScript(loaded.contatos);
      } catch {
        // fallback to loaded
      }
    }
    // Assegurar que comece desmarcado caso houvesse o padrão antigo salvo no navegador
    const hasPontoAdicionalMigrated = localStorage.getItem('osMudancaEnd_pontoAdicional_migrated_v2');
    if (!hasPontoAdicionalMigrated) {
      loaded.pontoAdicional = '';
      localStorage.setItem('osMudancaEnd_pontoAdicional_migrated_v2', 'true');
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

  // Salvar alterações contínuas
  useEffect(() => {
    localStorage.setItem('osMudancaEndData', JSON.stringify(formData));
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

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    if (finalValue.trim() !== '') {
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
      'podeAdiantar', 'dataAgendamento', 'periodo', 'clienteDesde', 
      'conseguiuContato', 'enderecoAtual', 'novoEndereco', 
      'refNovoEndereco', 'comprovante', 'pontoAdicional', 'eteccResolve'
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
    if (formData.authExcecao === 'Sim' && !formData.nomeAutorizou) newErrors.push('nomeAutorizou');
    if (formData.adicionarObs === 'Sim' && !formData.observacaoCliente?.trim()) newErrors.push('observacaoCliente');

    setErrorFields(newErrors);
    return newErrors.length === 0;
  };

  const copiarScript = () => {
    if (!validateForm()) {
      if (!formData.podeAdiantar) {
        showToast("Por favor, selecione se pode adiantar (Sim ou Não).", "error");
      } else if (!formData.conseguiuContato) {
        showToast("Por favor, selecione se conseguiu contato (Sim ou Não).", "error");
      } else if (!formData.pontoAdicional) {
        showToast("Por favor, selecione se o cliente tem ponto adicional (Sim ou Não).", "error");
      } else if (formData.adicionarObs === 'Sim' && !formData.observacaoCliente?.trim()) {
        showToast("Por favor, insira a observação repassada pelo cliente.", "error");
      } else {
        showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      }
      return;
    }

    const dataAgend = formatDate(formData.dataAgendamento);
    let periodoFmt = formData.periodo === 'Após' ? `Após (${formData.horarioApos})` : formData.periodo;

    let txtExcecao = formData.authExcecao;
    if (formData.authExcecao === 'Sim') {
      txtExcecao += ` (Autorizado por: ${formData.nomeAutorizou})`;
    }

    let blocoObservacao = '';
    if (formData.adicionarObs === 'Sim' && formData.observacaoCliente?.trim()) {
      blocoObservacao = `\nObservação: ${formData.observacaoCliente.trim()}`;
    }

    const operadorFinal = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || '';
    const contatosFmt = formatContactsForScript(formData.contatos) || formData.contato;

    const finalScript = `=== O.S MUDANÇA DE ENDEREÇO ===
Solicitação: MUDANÇA DE ENDEREÇO
Pode adiantar? ${formData.podeAdiantar}
Data: ${dataAgend}
Período: ${periodoFmt}
Taxa: ISENTO${blocoObservacao}

=== CLIENTE ===
Cliente desde: ${formData.clienteDesde}
Tel: ${contatosFmt} (Conseguiu contato: ${formData.conseguiuContato})

=== ENDEREÇOS ===
Atual: ${formData.enderecoAtual}
Novo: ${formData.novoEndereco}
Ref: ${formData.refNovoEndereco}
Maps: ${formData.locMaps || 'Não informado'}

=== DOCUMENTAÇÃO & DETALHES ===
Comprovante: ${formData.comprovante}
Ponto Adicional? ${formData.pontoAdicional}
ETECC Resolve (Mudança): ${formData.eteccResolve}

=== AUTORIZAÇÃO / ATENDENTE ===
Exceção? ${txtExcecao}
Atendente: ${operadorFinal}`.trim();

    navigator.clipboard.writeText(finalScript);
    setCopied(true);
    showToast("Script copiado com sucesso!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmClear = () => {
    const op = localStorage.getItem('serviceDesk_operador') || '';
    setFormData({
      ...initialState,
      contatos: [createDefaultContact('', true, '')],
      nomeAtendente: op 
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
        
        {/* Agendamento & Detalhes */}
        <div className={`${cardClass} xl:col-span-12`}>
          <h2 className={titleClass}>
            <CalendarDays size={18} className="text-primary" /> 
            Agendamento & Detalhes
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
            
            {/* 1. Pode Adiantar (Switch Sim/Não Obrigatório) */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className={labelClass}>Pode adiantar? *</span>
                {formData.podeAdiantar && (
                  <span className={`text-xs font-bold ${
                    formData.podeAdiantar === 'Sim' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formData.podeAdiantar}
                  </span>
                )}
              </div>
              
              <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
                errorFields.includes('podeAdiantar')
                  ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-300 bg-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, podeAdiantar: 'Sim' }));
                    setErrorFields(prev => prev.filter(f => f !== 'podeAdiantar'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.podeAdiantar === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={14} className={formData.podeAdiantar === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, podeAdiantar: 'Não' }));
                    setErrorFields(prev => prev.filter(f => f !== 'podeAdiantar'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.podeAdiantar === 'Não'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.podeAdiantar === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>

              {errorFields.includes('podeAdiantar') && (
                <p className="text-[10px] font-bold text-red-600 mt-1">
                  Selecione Sim ou Não.
                </p>
              )}
            </div>

            {/* 2. Data de Agendamento */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0 truncate mr-1`}>Data de Agendamento *</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  title={`Definir data de hoje (${getTodayFormatted()})`}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  Hoje
                </button>
              </div>
              <DateInputWithCalendar 
                name="dataAgendamento" 
                value={formData.dataAgendamento} 
                onChange={handleChange} 
                placeholder="DD/MM/AAAA" 
                className={getInputClass('dataAgendamento', 'h-[42px]')} 
              />
            </div>

            {/* 3. Período */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Período *</label>
              </div>
              <select 
                name="periodo" 
                value={formData.periodo} 
                onChange={handleChange} 
                className={getInputClass('periodo', 'h-[42px] py-0')}
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

            {/* 4. Adicionar observação? Switch */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className={labelClass}>Adicionar observação?</span>
                <span className={`text-xs font-bold ${
                  formData.adicionarObs === 'Sim' ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {formData.adicionarObs}
                </span>
              </div>
              
              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, adicionarObs: 'Sim' }));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.adicionarObs === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={14} className={formData.adicionarObs === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, adicionarObs: 'Não', observacaoCliente: '' }));
                    setErrorFields(prev => prev.filter(f => f !== 'observacaoCliente'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.adicionarObs === 'Não'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.adicionarObs === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>
            </div>

          </div>

          {/* Sub-campos expansíveis: Horário Após e Campo de Observação */}
          <div className="space-y-4 mt-4">
            <AnimatePresence>
              {formData.periodo === 'Após' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="max-w-md"
                >
                  <label className={labelClass}>Horário Específico (Após) *</label>
                  <input 
                    type="text" 
                    name="horarioApos" 
                    value={formData.horarioApos} 
                    onChange={handleChange} 
                    placeholder="Ex: 17:00" 
                    className={getInputClass('horarioApos')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {formData.adicionarObs === 'Sim' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquarePlus size={16} className="text-emerald-700" />
                    <label className="text-sm font-bold text-emerald-900">
                      Observação Repassada pelo Cliente *
                    </label>
                  </div>
                  <textarea 
                    name="observacaoCliente" 
                    value={formData.observacaoCliente} 
                    onChange={handleChange} 
                    rows="3" 
                    placeholder="Ex: Ligar 30 minutos antes para o cliente poder sair do trabalho; portão marrom em frente à padaria..."
                    className={getInputClass('observacaoCliente', 'bg-white border-emerald-300 focus:border-emerald-600 focus:ring-emerald-600 resize-none')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Endereços e Contato */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}>
            <MapPin size={18} className="text-primary" /> 
            Endereços e Contato
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Cliente Desde *</label>
              </div>
              <input 
                type="text" 
                name="clienteDesde" 
                value={formData.clienteDesde} 
                onChange={handleChange} 
                placeholder="Ex: 01/2022" 
                className={getInputClass('clienteDesde', 'h-[42px]')} 
              />
            </div>

            <div className="sm:col-span-1 lg:col-span-2">
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
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Endereço Atual *</label>
              <input 
                type="text" 
                name="enderecoAtual" 
                value={formData.enderecoAtual} 
                onChange={handleChange} 
                placeholder="Rua, Número, Bairro - Cidade" 
                className={getInputClass('enderecoAtual')} 
              />
            </div>
            
            <div className="p-5 bg-red-50/50 rounded-xl border border-red-100 space-y-5">
              <div>
                <label className="block text-sm font-bold text-red-800 mb-1.5">Novo Endereço *</label>
                <input 
                  type="text" 
                  name="novoEndereco" 
                  value={formData.novoEndereco} 
                  onChange={handleChange} 
                  placeholder="Rua, Número, Bairro - Cidade" 
                  className={getInputClass('novoEndereco', 'border-red-200 focus:border-red-500 focus:ring-red-500')} 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-red-800 mb-1.5">Referência *</label>
                  <input 
                    type="text" 
                    name="refNovoEndereco" 
                    value={formData.refNovoEndereco} 
                    onChange={handleChange} 
                    placeholder="Ex: Próximo à padaria central"
                    className={getInputClass('refNovoEndereco', 'border-red-200 focus:border-red-500 focus:ring-red-500')} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-red-800 mb-1.5">Localização Maps (Link)</label>
                  <input 
                    type="text" 
                    name="locMaps" 
                    value={formData.locMaps} 
                    onChange={handleChange} 
                    placeholder="https://maps.google.com/?q=..."
                    className={getInputClass('locMaps', 'border-red-200 focus:border-red-500 focus:ring-red-500')} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita (Verificações e ETECC) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          <div className={`${cardClass} border-t-primary`}>
            <h2 className={titleClass}><FileCheck size={18} className="text-primary" /> Verificações</h2>
            
            <div className="mb-6">
              <label className={labelClass}>Comprovante de Endereço *</label>
              <select name="comprovante" value={formData.comprovante} onChange={handleChange} className={getInputClass('comprovante')}>
                <option value="">Selecione...</option>
                <option value="Anexado">Anexado</option>
                <option value="Não Enviado">Não Enviado</option>
                <option value="Não Possui">Não Possui</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <span className={labelClass}>Cliente tem ponto adicional? *</span>
                {formData.pontoAdicional && (
                  <span className={`text-xs font-bold ${
                    formData.pontoAdicional === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {formData.pontoAdicional}
                  </span>
                )}
              </div>
              
              <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
                errorFields.includes('pontoAdicional')
                  ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
                  : 'border-slate-300 bg-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pontoAdicional: 'Sim' }));
                    setErrorFields(prev => prev.filter(f => f !== 'pontoAdicional'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.pontoAdicional === 'Sim'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Check size={14} className={formData.pontoAdicional === 'Sim' ? 'text-white' : 'opacity-30'} />
                  Sim
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, pontoAdicional: 'Não' }));
                    setErrorFields(prev => prev.filter(f => f !== 'pontoAdicional'));
                  }}
                  className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.pontoAdicional === 'Não'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-xs ${formData.pontoAdicional === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                  Não
                </button>
              </div>

              {errorFields.includes('pontoAdicional') && (
                <p className="text-red-500 text-xs mt-1 font-medium">Selecione se o cliente tem ponto adicional</p>
              )}

              <AnimatePresence>
                {formData.pontoAdicional === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2 mt-2.5">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <span><strong>Atenção:</strong> Notifique o cliente sobre avaliação desse ponto para a nova residência.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className={`${cardClass} flex-grow border-t-primary`}>
            <h2 className={titleClass}><PackageCheck size={18} className="text-primary" /> ETECC Resolve</h2>
            <div className="flex-grow">
              <label className={labelClass}>Cliente aceitou serviço de mudança? *</label>
              <select name="eteccResolve" value={formData.eteccResolve} onChange={handleChange} className={getInputClass('eteccResolve')}>
                <option value="">Selecione...</option>
                <option value="Aceitou">Aceitou</option>
                <option value="Não aceitou">Não aceitou</option>
                <option value="Já se mudou">Já se mudou</option>
                <option value="Contratou outro serviço">Contratou outro serviço</option>
                <option value="Não oferecido">Não oferecido</option>
              </select>
            </div>
          </div>
          
        </div>

        {/* Autorização & Atendente */}
        <div className={`${cardClass} xl:col-span-12`}>
          <h2 className={titleClass}>
            <ShieldCheck size={18} className="text-primary" /> 
            Autorização & Atendimento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Switch de Autorização por Exceção (padrão Não) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 max-w-sm">
                <span className={labelClass}>Autorização por Exceção (Torre)?</span>
                <span className={`text-xs font-bold ${
                  formData.authExcecao === 'Sim' ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {formData.authExcecao}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, authExcecao: 'Sim' }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    setErrorFields(prev => prev.filter(f => f !== 'nomeAutorizou'));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 max-w-sm">
                    <label className="block text-sm font-bold text-red-700 mb-1.5">Nome de quem autorizou *</label>
                    <input 
                      type="text" 
                      name="nomeAutorizou" 
                      value={formData.nomeAutorizou} 
                      onChange={handleChange} 
                      placeholder="Ex: Supervisor Lucas"
                      className={getInputClass('nomeAutorizou', 'bg-red-50 border-red-200 focus:border-red-500 focus:ring-red-500')} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Atendente / Operador */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Atendente / Operador</label>
              </div>
              
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

      {/* Modal de Limpeza */}
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
                <div className="p-2 bg-orange-100 rounded-full"><Info size={24} /></div>
                <h3 className="text-xl font-bold text-slate-800">Limpar Formulário?</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Tem certeza que deseja apagar todos os dados digitados? <br/>
                <span className="text-sm font-medium text-slate-500 mt-2 block">
                  * Os campos fixos e o nome do operador serão mantidos.
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 20, x: '-50%' }}
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