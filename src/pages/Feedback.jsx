import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Users, ClipboardList, Headset, 
  Copy, Trash2, AlertTriangle, Info, Check 
} from 'lucide-react';
import { DateInputWithCalendar } from '../components/DateInputWithCalendar';
import { ContactSection } from '../components/ContactSection';
import { createDefaultContact, normalizeContacts, formatContactsForScript } from '../lib/phoneUtils';

const initialState = {
  nomeCliente: '',
  telefone: '',
  contatos: [createDefaultContact('', false, '')],
  relatoInicial: '',
  
  solicitouIndicacao: 'Não',
  respostaIndicacao: '',
  indicacaoOutroTexto: '',
  
  conexaoEstabilidade: '',
  avaliacaoAtendimento: '',
  sugestoes: '',
  
  nomeAtendente: '',
  dataUltimoAtendimento: ''
};

export function Feedback() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('feedbackScriptData');
    const operadorGlobal = localStorage.getItem('serviceDesk_operador');
    
    let loadedData = { ...initialState };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedData = { ...loadedData, ...parsed };
        loadedData.contatos = normalizeContacts(parsed.contatos, parsed.telefone);
        loadedData.telefone = formatContactsForScript(loadedData.contatos);
      } catch {
        // ignore
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
    localStorage.setItem('feedbackScriptData', JSON.stringify(formData));
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
    if (name === 'telefone') {
      finalValue = formatPhone(value);
    }
    if (name === 'nomeAtendente') {
      localStorage.setItem('serviceDesk_operador', value);
    }

    setFormData(prev => {
      const next = { ...prev, [name]: finalValue };
      if (name === 'solicitouIndicacao' && finalValue === 'Não') {
        next.respostaIndicacao = '';
        next.indicacaoOutroTexto = '';
      }
      if (name === 'respostaIndicacao' && finalValue !== 'Outro') {
        next.indicacaoOutroTexto = '';
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

  const handleContatosChange = (newContatos) => {
    const formattedStr = formatContactsForScript(newContatos);
    setFormData(prev => ({
      ...prev,
      contatos: newContatos,
      telefone: formattedStr
    }));
    if (newContatos.some(c => c.numero && c.numero.trim() !== '')) {
      setErrorFields(prev => prev.filter(f => f !== 'telefone'));
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'nomeCliente', 'relatoInicial', 
      'conexaoEstabilidade', 'avaliacaoAtendimento'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors.push(field);
      }
    });

    const hasValidPhone = formData.contatos?.some(c => c.numero && c.numero.trim() !== '') || 
      (formData.telefone && formData.telefone.trim() !== '');
    if (!hasValidPhone) {
      newErrors.push('telefone');
    }

    if (formData.solicitouIndicacao === 'Sim') {
      if (!formData.respostaIndicacao) newErrors.push('respostaIndicacao');
      if (formData.respostaIndicacao === 'Outro' && !formData.indicacaoOutroTexto?.trim()) {
        newErrors.push('indicacaoOutroTexto');
      }
    }

    setErrorFields(newErrors);

    if (newErrors.length > 0) {
      showToast("Preencha todos os campos obrigatórios em destaque.", "error");
      
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

    let textoIndicacao = `Solicitou Indicação? ${formData.solicitouIndicacao}`;
    
    if (formData.solicitouIndicacao === 'Sim') {
      let resp = formData.respostaIndicacao === 'Outro' ? formData.indicacaoOutroTexto : formData.respostaIndicacao;
      textoIndicacao += `\n   - Resposta: ${resp}`;
    }

    const dataUltimo = formatDate(formData.dataUltimoAtendimento) || 'Não informada';
    const operadorFinal = formData.nomeAtendente || localStorage.getItem('serviceDesk_operador') || 'Operador Conectado';
    const telFinal = formatContactsForScript(formData.contatos) || formData.telefone;

    const scriptFinal = `=== SCRIPT DE FEEDBACK ===

=== INFORMAÇÕES DO CLIENTE ===
Nome: ${formData.nomeCliente}
Telefone: ${telFinal}
Relato Inicial: ${formData.relatoInicial}

=== PONTOS DE ANÁLISE ===
Conexão/Estabilidade: ${formData.conexaoEstabilidade}
Avaliação de atendimento: ${formData.avaliacaoAtendimento}
Sugestões/Melhoria: ${formData.sugestoes || 'Nenhuma'}

=== INDICAÇÃO ===
${textoIndicacao}

=== DETALHES DO ATENDIMENTO ===
Atendente: ${operadorFinal}
Último atendimento: ${dataUltimo}
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
      contatos: [createDefaultContact('', false, '')],
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Bloco 1: Informações do Cliente */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <User className="w-5 h-5 text-red-500" /> 
              Informações do Cliente
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Nome do Cliente *</label>
                </div>
                <input 
                  type="text" 
                  name="nomeCliente" 
                  value={formData.nomeCliente}
                  onChange={handleChange}
                  placeholder="Nome completo do cliente"
                  className={getInputClass('nomeCliente')} 
                />
              </div>
              
              <ContactSection
                contatos={formData.contatos}
                onChangeContatos={handleContatosChange}
                errorFields={errorFields}
                showConseguiuContato={false}
                label="Telefone *"
              />

              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Relato Inicial *</label>
                </div>
                <textarea 
                  name="relatoInicial"
                  value={formData.relatoInicial}
                  onChange={handleChange}
                  rows="4" 
                  className={getInputClass('relatoInicial', 'resize-none')} 
                  placeholder="O que motivou o contato ou relato do cliente..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Indicação (Switch) */}
        <div className={`${cardClass} xl:col-span-6 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <Users className="w-5 h-5 text-red-500" /> 
              Indicação
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <span className="block text-sm font-semibold text-slate-700">Foi solicitado indicação do cliente?</span>
                  <span className={`text-xs font-bold ${
                    formData.solicitouIndicacao === 'Sim' ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {formData.solicitouIndicacao}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 p-1 rounded-xl border border-slate-300 bg-slate-100 transition-all h-[42px] items-center">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, solicitouIndicacao: 'Sim' }))}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.solicitouIndicacao === 'Sim'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Check size={13} className={formData.solicitouIndicacao === 'Sim' ? 'text-white' : 'opacity-30'} />
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        solicitouIndicacao: 'Não',
                        respostaIndicacao: '',
                        indicacaoOutroTexto: ''
                      }));
                      setErrorFields(prev => prev.filter(f => f !== 'respostaIndicacao' && f !== 'indicacaoOutroTexto'));
                    }}
                    className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.solicitouIndicacao === 'Não'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className={`text-xs ${formData.solicitouIndicacao === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
                    Não
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.solicitouIndicacao === 'Sim' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                          <label className="block text-xs font-bold uppercase tracking-wider text-red-800 mb-0">Qual foi a resposta? *</label>
                        </div>
                        <select 
                          name="respostaIndicacao" 
                          value={formData.respostaIndicacao}
                          onChange={handleChange}
                          className={getInputClass('respostaIndicacao')}
                        >
                          <option value="">Selecione...</option>
                          <option value="Informou não ter indicação">Informou não ter indicação</option>
                          <option value="Informou ter indicação mas não passou os dados no momento">Informou ter indicação mas não passou os dados no momento</option>
                          <option value="Passou dados da indicação">Passou dados da indicação</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      <AnimatePresence>
                        {formData.respostaIndicacao === 'Outro' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <input 
                              type="text" 
                              name="indicacaoOutroTexto"
                              value={formData.indicacaoOutroTexto}
                              onChange={handleChange}
                              placeholder="Digite a resposta do cliente... *" 
                              className={getInputClass('indicacaoOutroTexto')} 
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bloco 3: Pontos de Análise */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}>
            <ClipboardList className="w-5 h-5 text-red-500" /> 
            Pontos de Análise
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Conexão e Estabilidade *</label>
              </div>
              <input 
                type="text" 
                name="conexaoEstabilidade" 
                value={formData.conexaoEstabilidade}
                onChange={handleChange}
                placeholder="Ex: Estável, oscilando, normal, problema pontual..."
                className={getInputClass('conexaoEstabilidade')} 
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Avaliação de Atendimento *</label>
              </div>
              <input 
                type="text" 
                name="avaliacaoAtendimento" 
                value={formData.avaliacaoAtendimento}
                onChange={handleChange}
                placeholder="Nota ou elogio/crítica sobre o atendimento"
                className={getInputClass('avaliacaoAtendimento')} 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                <label className={`${labelClass} mb-0`}>Sugestões e Pontos de Melhoria</label>
              </div>
              <input 
                type="text" 
                name="sugestoes" 
                value={formData.sugestoes}
                onChange={handleChange}
                placeholder="Sugestões passadas pelo cliente..."
                className={getInputClass('sugestoes')} 
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Detalhes do Atendimento & Atendente */}
        <div className={`${cardClass} xl:col-span-4 flex flex-col justify-between`}>
          <div>
            <h2 className={titleClass}>
              <Headset className="w-5 h-5 text-red-500" /> 
              Detalhes do Atendimento
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
                  <label className={`${labelClass} mb-0`}>Data do Último Atendimento</label>
                  <button
                    type="button"
                    onClick={() => setTodayDate('dataUltimoAtendimento')}
                    className="text-xs text-red-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Hoje
                  </button>
                </div>
                <DateInputWithCalendar 
                  name="dataUltimoAtendimento" 
                  value={formData.dataUltimoAtendimento} 
                  onChange={handleChange} 
                  placeholder="DD/MM/AAAA" 
                  className={getInputClass('dataUltimoAtendimento')} 
                />
              </div>

              {/* Indicador de Operador Padronizado */}
              <div className="pt-2">
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
                  Copiar Script de Feedback
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
