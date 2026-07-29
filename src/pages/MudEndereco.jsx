import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, MapPin, FileCheck, PackageCheck, 
  ShieldCheck, Copy, Trash2, AlertTriangle, Info, Check
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';

const initialState = {
  podeAdiantar: 'Não',
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  clienteDesde: '',
  contato: '',
  conseguiuContato: 'Sim',
  enderecoAtual: '',
  novoEndereco: '',
  refNovoEndereco: '',
  locMaps: '',
  comprovante: '',
  pontoAdicional: 'Não',
  eteccResolve: '',
  authExcecao: 'Não',
  nomeAutorizou: '',
  nomeAtendente: ''
};

export function MudEndereco() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('osMudancaEndData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialState;
      }
    }
    return initialState;
  });
  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [errorFields, setErrorFields] = useState([]);
  const [copied, setCopied] = useState(false);

  // Salvar alterações
  useEffect(() => {
    localStorage.setItem('osMudancaEndData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
      'dataAgendamento', 'periodo', 'clienteDesde', 'contato', 
      'enderecoAtual', 'novoEndereco', 'refNovoEndereco', 
      'comprovante', 'eteccResolve', 'nomeAtendente'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    if (formData.periodo === 'Após' && !formData.horarioApos) newErrors.push('horarioApos');
    if (formData.authExcecao === 'Sim' && !formData.nomeAutorizou) newErrors.push('nomeAutorizou');

    setErrorFields(newErrors);
    return newErrors.length === 0;
  };

  const copiarScript = () => {
    if (!validateForm()) {
      showToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    const dataAgend = formatDate(formData.dataAgendamento);
    let periodoFmt = formData.periodo === 'Após' ? `Após (${formData.horarioApos})` : formData.periodo;

    let txtExcecao = formData.authExcecao;
    if (formData.authExcecao === 'Sim') {
      txtExcecao += ` (Autorizado por: ${formData.nomeAutorizou})`;
    }

    const finalScript = `=== O.S MUDANÇA DE ENDEREÇO ===
Solicitação: MUDANÇA DE ENDEREÇO
Pode adiantar? ${formData.podeAdiantar}
Data: ${dataAgend}
Período: ${periodoFmt}
Taxa: ISENTO

=== CLIENTE ===
Cliente desde: ${formData.clienteDesde}
Tel: ${formData.contato} (Conseguiu contato: ${formData.conseguiuContato || 'Sim'})

=== ENDEREÇOS ===
Atual: ${formData.enderecoAtual}
Novo: ${formData.novoEndereco}
Ref: ${formData.refNovoEndereco}
Maps: ${formData.locMaps}

=== DOCUMENTAÇÃO & DETALHES ===
Comprovante: ${formData.comprovante}
Ponto Adicional? ${formData.pontoAdicional}
ETECC Resolve (Mudança): ${formData.eteccResolve}

=== AUTORIZAÇÃO / ATENDENTE ===
Exceção? ${txtExcecao}
Atendente: ${formData.nomeAtendente}`.trim();

    navigator.clipboard.writeText(finalScript);
    setCopied(true);
    showToast("Script copiado com sucesso!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmClear = () => {
    setFormData(prev => ({
      ...initialState,
      nomeAtendente: prev.nomeAtendente 
    }));
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
        <h2 className="text-3xl font-bold text-slate-800">Mudança de Endereço</h2>
        <button
          type="button"
          onClick={() => setTodayDate('dataAgendamento')}
          title="Clique para preencher a data de agendamento com a data de hoje"
          className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300 flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <CalendarDays size={14} className="text-primary" /> Hoje ({getTodayFormatted()})
        </button>
      </div>

      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Agendamento & Detalhes */}
        <div className={`${cardClass} xl:col-span-12`}>
          <h2 className={titleClass}><CalendarDays size={18} className="text-primary" /> Agendamento & Detalhes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className={labelClass}>Solicitação (Fixo)</label>
              <input type="text" value="MUDANÇA DE ENDEREÇO" readOnly className="w-full bg-slate-200 border border-slate-300 text-slate-600 font-bold rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className={labelClass}>Taxa (Fixo)</label>
              <input type="text" value="ISENTO" readOnly className="w-full bg-slate-200 border border-slate-300 text-slate-600 font-bold rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
            </div>
            <div>
              <span className={labelClass}>Pode adiantar?</span>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center justify-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1">
                    <input type="radio" name="podeAdiantar" value={op} checked={formData.podeAdiantar === op} onChange={handleChange} className="accent-primary" /> {op}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClass}>Data de Agendamento</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Hoje
                </button>
              </div>
              <input type="text" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleChange} placeholder="DD/MM/AAAA" className={getInputClass('dataAgendamento')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Período</label>
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
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="md:col-span-2">
                  <label className={labelClass}>Horário Específico</label>
                  <input type="text" name="horarioApos" value={formData.horarioApos} onChange={handleChange} placeholder="Ex: 17:00" className={getInputClass('horarioApos')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Endereços e Contato */}
        <div className={`${cardClass} xl:col-span-8`}>
          <h2 className={titleClass}><MapPin size={18} className="text-primary" /> Endereços e Contato</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={labelClass}>Cliente Desde</label>
              <input type="text" name="clienteDesde" value={formData.clienteDesde} onChange={handleChange} placeholder="Ex: 01/2022" className={getInputClass('clienteDesde')} />
            </div>
            <div>
              <label className={labelClass}>Telefone (Contato)</label>
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
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Endereço Atual</label>
              <input type="text" name="enderecoAtual" value={formData.enderecoAtual} onChange={handleChange} placeholder="Rua, Número, Bairro - Cidade" className={getInputClass('enderecoAtual')} />
            </div>
            
            <div className="p-5 bg-red-50/50 rounded-xl border border-red-100 space-y-5">
              <div>
                <label className="block text-sm font-bold text-red-800 mb-1.5">Novo Endereço</label>
                <input type="text" name="novoEndereco" value={formData.novoEndereco} onChange={handleChange} placeholder="Rua, Número, Bairro - Cidade" className={getInputClass('novoEndereco', 'border-red-200 focus:border-red-500 focus:ring-red-500')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-red-800 mb-1.5">Referência</label>
                  <input type="text" name="refNovoEndereco" value={formData.refNovoEndereco} onChange={handleChange} className={getInputClass('refNovoEndereco', 'border-red-200 focus:border-red-500 focus:ring-red-500')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-red-800 mb-1.5">Localização Maps (Link)</label>
                  <input type="text" name="locMaps" value={formData.locMaps} onChange={handleChange} className={getInputClass('locMaps', 'border-red-200 focus:border-red-500 focus:ring-red-500')} />
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
              <label className={labelClass}>Comprovante de Endereço</label>
              <select name="comprovante" value={formData.comprovante} onChange={handleChange} className={getInputClass('comprovante')}>
                <option value="">Selecione...</option>
                <option value="Anexado">Anexado</option>
                <option value="Não Enviado">Não Enviado</option>
                <option value="Não Possui">Não Possui</option>
              </select>
            </div>

            <div>
              <span className={labelClass}>Cliente tem ponto adicional?</span>
              <div className="flex gap-4 mb-3">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center justify-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800 flex-1">
                    <input type="radio" name="pontoAdicional" value={op} checked={formData.pontoAdicional === op} onChange={handleChange} className="accent-primary" /> {op}
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {formData.pontoAdicional === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2 mt-2">
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
              <label className={labelClass}>Cliente aceitou serviço de mudança?</label>
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
          <h2 className={titleClass}><ShieldCheck size={18} className="text-primary" /> Autorização & Atendente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className={labelClass}>Autorização por Exceção (Torre)?</span>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer text-sm bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-300 hover:border-primary transition text-slate-800">
                    <input type="radio" name="authExcecao" value={op} checked={formData.authExcecao === op} onChange={handleChange} className="accent-primary" /> {op}
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {formData.authExcecao === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                    <label className="block text-sm font-bold text-red-700 mb-1.5">Nome de quem autorizou</label>
                    <input type="text" name="nomeAutorizou" value={formData.nomeAutorizou} onChange={handleChange} className={getInputClass('nomeAutorizou', 'bg-red-50 border-red-200 focus:border-red-500 focus:ring-red-500')} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className={labelClass}>Operador / Atendente</label>
              <input type="text" name="nomeAtendente" list="atendentes-list" value={formData.nomeAtendente} onChange={handleChange} className={getInputClass('nomeAtendente')} />
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
                <button onClick={() => setShowClearModal(false)} className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition">Cancelar</button>
                <button onClick={confirmClear} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-md transition">Sim, limpar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
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