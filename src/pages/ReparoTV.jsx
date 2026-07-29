import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Headset, Copy, Trash2, AlertTriangle, Info, MonitorPlay, Calendar, Settings, Clock
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  contato: '',
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
    
    if (operadorGlobal) {
        loadedData.nomeAtendente = operadorGlobal;
    }
    
    return loadedData;
  });

  const [toast, setToast] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [errorFields, setErrorFields] = useState([]);

  useEffect(() => {
    localStorage.setItem('reparoTvScriptData', JSON.stringify(formData));
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

  const validateForm = () => {
    const requiredFields = [
      'dataAgendamento', 'periodo', 'contato', 'clienteDesde', 'descricao', 
      'equipamentoTV', 'dispositivoTV', 'sintoniaRealizada', 'nomeAtendente'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    if (formData.periodo === 'Após' && !formData.horarioApos) {
        newErrors.push('horarioApos');
    }

    if (formData.equipamentoTV === 'Mini Node' && !formData.sinalFibra) {
        newErrors.push('sinalFibra');
    }

    if (formData.recentOS === 'Sim') {
      if (!formData.tipoOSRecente) newErrors.push('tipoOSRecente');
      if (!formData.dataOSRecente) newErrors.push('dataOSRecente');
      if (!formData.encerramentoOSRecente) newErrors.push('encerramentoOSRecente');
    }

    if (formData.authException === 'Sim' && !formData.nomeAutorizou) {
        newErrors.push('nomeAutorizou');
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

    const scriptFinal = `=== AGENDAMENTO ===
DATA: ${dataAgend}
PERÍODO: ${periodoFmt}

=== INFORMAÇÕES DO CLIENTE ===
Contato: ${formData.contato}
Cliente desde: ${formData.clienteDesde}

=== DETALHES DO REPARO ===
Descrição do Problema: ${formData.descricao}

Equipamento: ${eqText}
Dispositivo: ${formData.dispositivoTV}
Sintonia Realizada? ${formData.sintoniaRealizada}

=== HISTÓRICO ===
${scriptOSRecente}

=== ATENDIMENTO ===
Atendente: ${formData.nomeAtendente}
${scriptExcecao}`.trim();

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
      ? "border-red-500 ring-1 ring-red-500 bg-red-50" 
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
            <MonitorPlay className="w-6 h-6 text-red-600" />
          </div>
          Reparo de TV
        </h2>
        <button
          type="button"
          onClick={() => setTodayDate('dataAgendamento')}
          title="Clique para preencher a data de agendamento com a data de hoje"
          className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors font-semibold"
        >
          <Calendar className="w-4 h-4 text-red-600" /> Hoje ({getTodayFormatted()})
        </button>
      </div>

      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Agendamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-4 flex flex-col">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" /> 
            Agendamento
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">Data *</label>
                <button
                  type="button"
                  onClick={() => setTodayDate('dataAgendamento')}
                  className="text-xs text-red-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Hoje
                </button>
              </div>
              <input type="text" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleChange} placeholder="DD/MM/AAAA" className={inputClass('dataAgendamento')} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Período *</label>
              <select name="periodo" value={formData.periodo} onChange={handleChange} className={inputClass('periodo')}>
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 mt-1">Horário Específico *</label>
                  <input type="text" name="horarioApos" value={formData.horarioApos} onChange={handleChange} placeholder="Ex: 16:30" className={inputClass('horarioApos')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-8 flex flex-col">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" /> 
            Informações do Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Contato *</label>
              <input 
                type="text" 
                name="contato" 
                value={formData.contato}
                onChange={handleChange}
                placeholder="(XX) XXXXX-XXXX"
                className={inputClass('contato')} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente desde *</label>
              <input 
                type="text" 
                name="clienteDesde" 
                value={formData.clienteDesde}
                onChange={handleChange}
                placeholder="Ex: 01/2020"
                className={inputClass('clienteDesde')} 
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Detalhes do Reparo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-12 flex flex-col">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" /> 
            Detalhes do Reparo
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição do Problema *</label>
              <textarea 
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="3" 
                className={inputClass('descricao')} 
                placeholder="Ex: Cliente relata tela sem sinal, imagem travando..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Estrutura *</label>
                <div className="flex gap-4">
                  <label className="flex flex-1 items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                    <input type="radio" name="equipamentoTV" value="Coaxial" checked={formData.equipamentoTV === 'Coaxial'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                    <span className="font-semibold text-slate-700">Coaxial</span>
                  </label>
                  <label className="flex flex-1 items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                    <input type="radio" name="equipamentoTV" value="Mini Node" checked={formData.equipamentoTV === 'Mini Node'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                    <span className="font-semibold text-slate-700">Mini Node</span>
                  </label>
                </div>

                <AnimatePresence>
                  {formData.equipamentoTV === 'Mini Node' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Sinal da Fibra *</label>
                      <input 
                        type="text" 
                        name="sinalFibra"
                        value={formData.sinalFibra}
                        onChange={handleChange}
                        placeholder="-XX dBm" 
                        className={inputClass('sinalFibra')} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Dispositivo *</label>
                 <select 
                    name="dispositivoTV" 
                    value={formData.dispositivoTV}
                    onChange={handleChange}
                    className={inputClass('dispositivoTV')}
                  >
                    <option value="">Selecione...</option>
                    <option value="Decodificador Gospell">Decodificador Gospell</option>
                    <option value="Conversor Externo">Conversor Externo</option>
                    <option value="Cabo direto na TV">Cabo direto na TV</option>
                  </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Realizado sintonia? *</label>
              <div className="flex gap-4">
                <label className="flex flex-1 md:flex-none items-center gap-2 cursor-pointer bg-slate-50 px-6 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                  <input type="radio" name="sintoniaRealizada" value="Sim" checked={formData.sintoniaRealizada === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                  <span className="font-semibold text-slate-700">Sim</span>
                </label>
                <label className="flex flex-1 md:flex-none items-center gap-2 cursor-pointer bg-slate-50 px-6 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors justify-center">
                  <input type="radio" name="sintoniaRealizada" value="Não" checked={formData.sintoniaRealizada === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                  <span className="font-semibold text-slate-700">Não</span>
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Última O.S. */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" /> 
            Última O.S.
          </h2>
          <div className="mb-4">
            <span className="block text-sm font-semibold text-slate-700 mb-2">Teve atendimento recente?</span>
            <div className="flex gap-4">
              {['Sim', 'Não'].map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex-1 justify-center">
                  <input type="radio" name="recentOS" value={op} checked={formData.recentOS === op} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                  <span className="font-semibold text-slate-700">{op}</span>
                </label>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {formData.recentOS === 'Sim' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-hidden">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo *</label>
                  <input type="text" name="tipoOSRecente" value={formData.tipoOSRecente} onChange={handleChange} className={inputClass('tipoOSRecente')} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-slate-700">Data *</label>
                    <button
                      type="button"
                      onClick={() => setTodayDate('dataOSRecente')}
                      className="text-xs text-red-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Hoje
                    </button>
                  </div>
                  <input type="text" name="dataOSRecente" value={formData.dataOSRecente} onChange={handleChange} placeholder="DD/MM/AAAA" className={inputClass('dataOSRecente')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Encerramento *</label>
                  <textarea
                    name="encerramentoOSRecente"
                    value={formData.encerramentoOSRecente}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Digite ou cole o encerramento da última O.S..."
                    className={`${inputClass('encerramentoOSRecente')} resize-y`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bloco 3: Detalhes do Atendimento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <Headset className="w-5 h-5 text-red-600" /> 
            Detalhes do Atendimento
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <span className="block text-sm font-semibold text-slate-700 mb-2">Autorização por Exceção? *</span>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex-1 justify-center">
                    <input type="radio" name="authException" value={op} checked={formData.authException === op} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> 
                    <span className="font-semibold text-slate-700">{op}</span>
                  </label>
                ))}
              </div>
              <AnimatePresence>
                {formData.authException === 'Sim' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-3">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nome de quem autorizou *</label>
                    <input type="text" name="nomeAutorizou" value={formData.nomeAutorizou} onChange={handleChange} className={inputClass('nomeAutorizou', 'bg-yellow-50 border-yellow-300 focus:border-yellow-500')} placeholder="Nome do supervisor/gerente" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          
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
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row gap-4 pt-4 pb-10">
          <button 
            type="button" 
            onClick={copyScript}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
          >
            <Copy size={20} /> Copiar Script de Reparo
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
