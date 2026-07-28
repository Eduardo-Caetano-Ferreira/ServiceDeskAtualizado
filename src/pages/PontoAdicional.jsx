import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, User, CalendarClock, Settings, ClipboardCheck, ShieldCheck, 
  Copy, Trash2, AlertTriangle, Info 
} from 'lucide-react';
import { TechniciansRegion } from '../components/TechniciansRegion';

const initialState = {
  dataAgendamento: '',
  periodo: '',
  horarioApos: '',
  solicitacao: '',
  contato: '',
  planoAtual: '',
  roteadorPrincipal: '',
  onuPrincipal: '',
  clienteDesde: '',
  
  upgrade: 'Não',
  necessarioRoteador: 'Não',
  tipoRoteador: '',
  
  gerarCusto: 'Não',
  cienteCusto: '',
  valorCusto: '',
  custoPorMetro: false,
  vencimentoCusto: '',
  
  motivoIsencao: '',
  motivoOutroTexto: '',
  
  avaliacaoTecnica: 'Não',
  baixaAvaliacao: '',
  
  authExcecao: 'Não',
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
    localStorage.setItem('osPontoAdicionalData', JSON.stringify(formData));
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
      'dataAgendamento', 'periodo', 'solicitacao', 'contato', 'planoAtual',
      'roteadorPrincipal', 'onuPrincipal', 'nomeAtendente'
    ];
    
    let newErrors = [];

    requiredFields.forEach(field => {
      if (!formData[field]) newErrors.push(field);
    });

    if (formData.periodo === 'Após' && !formData.horarioApos) newErrors.push('horarioApos');
    if (formData.necessarioRoteador === 'Sim' && !formData.tipoRoteador) newErrors.push('tipoRoteador');
    
    if (formData.gerarCusto === 'Sim') {
        if (!formData.cienteCusto) newErrors.push('cienteCusto');
        if (!formData.valorCusto) newErrors.push('valorCusto');
        if (!formData.vencimentoCusto) newErrors.push('vencimentoCusto');
    } else {
        if (!formData.motivoIsencao) newErrors.push('motivoIsencao');
        if (formData.motivoIsencao === 'Outro' && !formData.motivoOutroTexto) newErrors.push('motivoOutroTexto');
    }
    
    if (formData.avaliacaoTecnica === 'Sim' && !formData.baixaAvaliacao) newErrors.push('baixaAvaliacao');
    if (formData.authExcecao === 'Sim' && !formData.nomeAutorizou) newErrors.push('nomeAutorizou');

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

    const scriptFinal = `=== O.S PONTO ADICIONAL ===
Data: ${dataAgend}
Período: ${periodoFmt}
Solicitação: ${formData.solicitacao}

=== INFORMAÇÕES DO CLIENTE ===
Contato: ${formData.contato}
Plano Atual: ${formData.planoAtual}
Roteador: ${formData.roteadorPrincipal}
ONU: ${formData.onuPrincipal}
Cliente desde: ${formData.clienteDesde}

=== INFORMAÇÕES DA O.S ===
Upgrade? ${formData.upgrade}
${infoRoteador}
${textoCusto}

=== AVALIAÇÃO TÉCNICA ===
${textoAvaliacao}

=== AUTORIZAÇÃO / ATENDENTE ===
${textoExcecao}
Atendente: ${formData.nomeAtendente}
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

  const getRadioGroupClass = (fieldName) => {
    return errorFields.includes(fieldName) ? "p-2 -m-2 rounded-lg border border-red-500 bg-red-50 animate-error transition-all" : "p-2 -m-2 border border-transparent transition-all";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto space-y-6 pb-20"
    >
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-red-600" />
          </div>
          O.S. Ponto Adicional / Cabear Dispositivo
        </h2>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* TÉCNICOS DA REGIÃO (ROTA DIÁRIA) */}
      <TechniciansRegion />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bloco 1: O.S Ponto Adicional */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-4 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-red-500" /> 
            Agendamento
          </h2>
          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Data de Agendamento *</label>
              <input 
                type="date" 
                name="dataAgendamento" 
                value={formData.dataAgendamento}
                onChange={handleChange}
                className={inputClass('dataAgendamento')} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Período *</label>
              <select 
                name="periodo" 
                value={formData.periodo}
                onChange={handleChange}
                className={inputClass('periodo')}
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1 mt-2">Horário Específico *</label>
                  <input 
                    type="text" 
                    name="horarioApos"
                    value={formData.horarioApos}
                    onChange={handleChange}
                    placeholder="Ex: 17:30" 
                    className={inputClass('horarioApos')} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Solicitação *</label>
              <textarea 
                name="solicitacao"
                value={formData.solicitacao}
                onChange={handleChange}
                rows="4" 
                className={inputClass('solicitacao')} 
                placeholder="Detalhes da solicitação..."
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Informações do Cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-8 flex flex-col h-full">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-red-500" /> 
            Informações do Cliente
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Plano Atual *</label>
              <select 
                name="planoAtual"
                value={formData.planoAtual}
                onChange={handleChange}
                className={inputClass('planoAtual')}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente Desde</label>
              <input 
                type="text" 
                name="clienteDesde"
                value={formData.clienteDesde}
                onChange={handleChange}
                placeholder="Ex: 05/2021" 
                className={inputClass('clienteDesde')} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Roteador (Principal) *</label>
              <select 
                name="roteadorPrincipal"
                value={formData.roteadorPrincipal}
                onChange={handleChange}
                className={inputClass('roteadorPrincipal')}
              >
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ONU *</label>
              <select 
                name="onuPrincipal"
                value={formData.onuPrincipal}
                onChange={handleChange}
                className={inputClass('onuPrincipal')}
              >
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Informações da O.S. */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-12">
          <h2 className="text-lg font-bold border-b pb-3 mb-5 text-slate-700 flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" /> 
            Informações da O.S.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <span className="block text-sm font-semibold text-slate-700 mb-2">Cliente realizou upgrade?</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input type="radio" name="upgrade" value="Sim" checked={formData.upgrade === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input type="radio" name="upgrade" value="Não" checked={formData.upgrade === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-700 mb-2">Será necessário roteador?</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input type="radio" name="necessarioRoteador" value="Sim" checked={formData.necessarioRoteador === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input type="radio" name="necessarioRoteador" value="Não" checked={formData.necessarioRoteador === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não
                  </label>
                </div>
              </div>

              <AnimatePresence>
                {formData.necessarioRoteador === 'Sim' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-100 mt-2">
                        <label className="block text-sm font-bold text-red-800 mb-2">Qual o tipo do roteador? *</label>
                        <select 
                        name="tipoRoteador" 
                        value={formData.tipoRoteador}
                        onChange={handleChange}
                        className={inputClass('tipoRoteador')}
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

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <span className="block text-sm font-bold text-slate-800 mb-3">Será gerado custo?</span>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input type="radio" name="gerarCusto" value="Sim" checked={formData.gerarCusto === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input type="radio" name="gerarCusto" value="Não" checked={formData.gerarCusto === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não
                </label>
              </div>

              <AnimatePresence mode="wait">
                {formData.gerarCusto === 'Sim' ? (
                  <motion.div 
                    key="custo"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 border-t border-slate-200 pt-4 mt-2"
                  >
                    <div className={getRadioGroupClass('cienteCusto')}>
                      <span className="block text-sm font-semibold text-slate-700 mb-2">Cliente ciente do custo? *</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cienteCusto" value="Sim" checked={formData.cienteCusto === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="cienteCusto" value="Não" checked={formData.cienteCusto === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não</label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                        <input 
                          type="text" 
                          name="valorCusto"
                          value={formData.valorCusto}
                          onChange={handleChange}
                          placeholder="0,00" 
                          className={inputClass('valorCusto')} 
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 bg-white px-3 py-2 border border-slate-200 rounded-lg w-full hover:bg-slate-50">
                          <input 
                            type="checkbox" 
                            name="custoPorMetro"
                            checked={formData.custoPorMetro}
                            onChange={handleChange}
                            className="rounded text-red-600 focus:ring-red-500" 
                          /> 
                          Cobrar por metro?
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vencimento *</label>
                      <input 
                        type="date" 
                        name="vencimentoCusto"
                        value={formData.vencimentoCusto}
                        onChange={handleChange}
                        className={inputClass('vencimentoCusto')} 
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="isencao"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4 border-t border-slate-200 pt-4 mt-2"
                  >
                    <div>
                      <label className="block text-sm font-bold text-emerald-700 mb-2">Motivo da Isenção *</label>
                      <select 
                        name="motivoIsencao"
                        value={formData.motivoIsencao}
                        onChange={handleChange}
                        className={inputClass('motivoIsencao')}
                      >
                        <option value="">Selecione...</option>
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
                            placeholder="Digite o motivo específico... *" 
                            className={`mt-2 ${inputClass('motivoOutroTexto')}`} 
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

        {/* Bloco 4: Avaliação Técnica */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-red-500" /> 
            Avaliação Técnica
          </h2>
          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-2">Já foi feita avaliação técnica?</span>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <input type="radio" name="avaliacaoTecnica" value="Sim" checked={formData.avaliacaoTecnica === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <input type="radio" name="avaliacaoTecnica" value="Não" checked={formData.avaliacaoTecnica === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não
              </label>
            </div>
          </div>
          
          <AnimatePresence>
            {formData.avaliacaoTecnica === 'Sim' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-2">Baixa da Avaliação *</label>
                <textarea 
                  name="baixaAvaliacao"
                  value={formData.baixaAvaliacao}
                  onChange={handleChange}
                  rows="3" 
                  className={inputClass('baixaAvaliacao')} 
                  placeholder="Informe o resultado da avaliação..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bloco 5: Autorização & Atendente */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-red-500 border-x border-b border-slate-200 lg:col-span-6 flex flex-col">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" /> 
            Autorização & Atendente
          </h2>
          
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">Autorização por Exceção (Torre)?</span>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <input type="radio" name="authExcecao" value="Sim" checked={formData.authExcecao === 'Sim'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Sim
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                <input type="radio" name="authExcecao" value="Não" checked={formData.authExcecao === 'Não'} onChange={handleChange} className="text-red-600 focus:ring-red-500" /> Não
              </label>
            </div>
            
            <AnimatePresence>
              {formData.authExcecao === 'Sim' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-bold text-red-700 mb-1 mt-2">Nome de quem autorizou *</label>
                  <input 
                    type="text" 
                    name="nomeAutorizou"
                    value={formData.nomeAutorizou}
                    onChange={handleChange}
                    className={`bg-red-50 ${inputClass('nomeAutorizou')}`} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-auto">
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

        {/* Botões de Ação */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row gap-4 pt-4 pb-10">
          <button 
            type="button" 
            onClick={copyScript}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-md flex justify-center items-center gap-3 transition transform hover:scale-[1.01]"
          >
            <Copy size={20} /> Copiar Script Ponto Adicional
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
