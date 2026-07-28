import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Users, ClipboardList, Headset, 
  Copy, Trash2, AlertTriangle, Info, MessageSquareHeart, Calendar
} from 'lucide-react';

const initialState = {
  nomeCliente: '',
  telefone: '',
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
        loadedData = { ...loadedData, ...JSON.parse(saved) };
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

  useEffect(() => {
    localStorage.setItem('feedbackScriptData', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nomeAtendente') {
        localStorage.setItem('serviceDesk_operador', value);
    }
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (value.toString().trim() !== '' || (type === 'checkbox' && checked)) {
      setErrorFields(prev => prev.filter(field => field !== name));
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const validateForm = () => {
    const requiredFields = [
      'nomeCliente', 'telefone', 'relatoInicial', 
      'conexaoEstabilidade', 'avaliacaoAtendimento', 'nomeAtendente'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    if (formData.solicitouIndicacao === 'Sim') {
        if (!formData.respostaIndicacao) newErrors.push('respostaIndicacao');
        if (formData.respostaIndicacao === 'Outro' && !formData.indicacaoOutroTexto) newErrors.push('indicacaoOutroTexto');
    }

    setErrorFields(newErrors);

    if (newErrors.length > 0) {
      showToast("Preencha os campos obrigatórios.", "error");
      
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

    const dataUltimo = formatDate(formData.dataUltimoAtendimento);

    const scriptFinal = `=== SCRIPT DE FEEDBACK ===

=== INFORMAÇÕES DO CLIENTE ===
Nome: ${formData.nomeCliente}
Telefone: ${formData.telefone}
Relato Inicial: ${formData.relatoInicial}

=== PONTOS DE ANÁLISE ===
Conexão/Estabilidade: ${formData.conexaoEstabilidade}
Avaliação de atendimento: ${formData.avaliacaoAtendimento}
Sugestões/Melhoria: ${formData.sugestoes}

=== INDICAÇÃO ===
${textoIndicacao}

=== DETALHES DO ATENDIMENTO ===
Atendente: ${formData.nomeAtendente}
Último atendimento: ${dataUltimo}
`.trim();

    navigator.clipboard.writeText(scriptFinal)
      .then(() => showToast("Script copiado com sucesso!"))
      .catch(() => showToast("Erro ao copiar script", "error"));
  };

  const handleClear = () => {
    const atendenteAtual = formData.nomeAtendente;
    setFormData({ ...initialState, nomeAtendente: atendenteAtual });
    setErrorFields([]);
    setShowClearModal(false);
    showToast("Formulário limpo.", "info");
  };

  const inputClass = (fieldName, extraClasses = "") => {
    const hasError = errorFields.includes(fieldName);
    const errorStyles = hasError 
      ? "border-red-500 ring-1 ring-red-500 bg-red-50 animate-error" 
      : "border-slate-300 bg-slate-100 focus:border-red-500 focus:ring-1 focus:ring-red-500";

    return `w-full border text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none transition-all ${errorStyles} ${extraClasses}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <MessageSquareHeart className="w-6 h-6 text-red-600" />
          </div>
          Script de Feedback
        </h2>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bloco 1: Informações do Cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" /> 
            Informações do Cliente
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cliente *</label>
              <input 
                type="text" 
                name="nomeCliente" 
                value={formData.nomeCliente}
                onChange={handleChange}
                placeholder="Nome completo"
                className={inputClass('nomeCliente')} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone *</label>
              <input 
                type="text" 
                name="telefone" 
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(XX) XXXXX-XXXX"
                className={inputClass('telefone')} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Relato Inicial *</label>
              <textarea 
                name="relatoInicial"
                value={formData.relatoInicial}
                onChange={handleChange}
                rows="4" 
                className={inputClass('relatoInicial')} 
                placeholder="O que motivou o contato ou feedback..."
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Indicação */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" /> 
            Indicação
          </h2>
          
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">Foi solicitado indicação do cliente?</span>
            <div className="flex gap-4">
              <label className="flex flex-1 items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                <input type="radio" name="solicitouIndicacao" value="Sim" checked={formData.solicitouIndicacao === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                <span className="font-semibold text-slate-700">SIM</span>
              </label>
              <label className="flex flex-1 items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                <input type="radio" name="solicitouIndicacao" value="Não" checked={formData.solicitouIndicacao === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                <span className="font-semibold text-slate-700">NÃO</span>
              </label>
            </div>
          </div>

          <AnimatePresence>
            {formData.solicitouIndicacao === 'Sim' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex-grow"
              >
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-2">
                  <label className="block text-sm font-bold text-red-800 mb-2">Qual foi a resposta? *</label>
                  <select 
                    name="respostaIndicacao" 
                    value={formData.respostaIndicacao}
                    onChange={handleChange}
                    className={inputClass('respostaIndicacao')}
                  >
                    <option value="">Selecione...</option>
                    <option value="Informou não ter indicação">Informou não ter indicação</option>
                    <option value="Informou ter indicação mas não passou os dados no momento">Informou ter indicação mas não passou os dados no momento</option>
                    <option value="Passou dados da indicação">Passou dados da indicação</option>
                    <option value="Outro">Outro</option>
                  </select>

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
                          className={`mt-3 ${inputClass('indicacaoOutroTexto')}`} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bloco 3: Pontos de Análise */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-8">
          <h2 className="text-lg font-bold border-b pb-3 mb-5 text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-500" /> 
            Pontos de Análise
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Conexão e Estabilidade *</label>
              <input 
                type="text" 
                name="conexaoEstabilidade" 
                value={formData.conexaoEstabilidade}
                onChange={handleChange}
                placeholder="Ex: Estável, oscilando, normal..."
                className={inputClass('conexaoEstabilidade')} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Avaliação de Atendimento *</label>
              <input 
                type="text" 
                name="avaliacaoAtendimento" 
                value={formData.avaliacaoAtendimento}
                onChange={handleChange}
                placeholder="Nota ou comentário sobre o atendimento"
                className={inputClass('avaliacaoAtendimento')} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Sugestões e Pontos de Melhoria</label>
              <input 
                type="text" 
                name="sugestoes" 
                value={formData.sugestoes}
                onChange={handleChange}
                placeholder="Sugestões do cliente..."
                className={inputClass('sugestoes')} 
              />
            </div>
          </div>
        </div>

        {/* Bloco 4: Detalhes do Atendimento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-4 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Headset className="w-5 h-5 text-red-600" /> 
            Detalhes do Atendimento
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Operador / Atendente *</label>
              <input 
                type="text" 
                name="nomeAtendente"
                list="atendentes-list"
                value={formData.nomeAtendente}
                onChange={handleChange}
                className={inputClass('nomeAtendente')} 
              />
              <datalist id="atendentes-list">
                <option value="Heitor Hugo" />
                <option value="Alejandro Eduardo" />
                <option value="Matheus Santos" />
                <option value="Victor Silva" />
                <option value="Thiago Nathan" />
                <option value="Celso Cotta" />
              </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Data do Último Atendimento</label>
              <input 
                type="date" 
                name="dataUltimoAtendimento" 
                value={formData.dataUltimoAtendimento}
                onChange={handleChange}
                className={inputClass('dataUltimoAtendimento')} 
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row gap-4 pt-4 pb-10">
          <button 
            type="button" 
            onClick={copyScript}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
          >
            <Copy size={20} /> Copiar Script de Feedback
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowClearModal(true)}
            className="sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
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
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleClear}
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
            {toast.type === 'error' && <AlertTriangle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
