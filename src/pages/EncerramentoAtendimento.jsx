import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck2, 
  CalendarPlus, 
  PhoneCall, 
  Copy, 
  Trash2, 
  Check, 
  Activity, 
  Radio, 
  Wifi, 
  Settings2, 
  Clock,
  User,
  FileSignature
} from 'lucide-react';
import { formatPhone } from '../lib/phoneUtils';

export function EncerramentoAtendimento() {
  const [activeTab, setActiveTab] = useState('baixa'); // 'baixa' | 'adiantamento' | 'confirmacao'
  const [toast, setToast] = useState(null);

  // Operador atual
  const [operador, setOperador] = useState(() => {
    return localStorage.getItem('serviceDesk_operador') || '';
  });

  useEffect(() => {
    const handleStorage = () => {
      setOperador(localStorage.getItem('serviceDesk_operador') || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async (text, successMsg = 'Texto copiado com sucesso!') => {
    if (!text || text.includes('Aguardando preenchimento')) {
      showToast('Preencha os campos antes de copiar.', 'error');
      return false;
    }

    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        console.warn('Clipboard API falhou, tentando fallback', err);
      }
    }

    if (!ok) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Fallback falhou', err);
      }
    }

    if (ok) {
      showToast(successMsg, 'success');
      return true;
    } else {
      showToast('Não foi possível copiar automaticamente.', 'error');
      return false;
    }
  };

  /* =========================================================
     ESTADOS TAB 1: BAIXA DE ATENDIMENTO N2
     ========================================================= */
  const [baixaData, setBaixaData] = useState(() => {
    const saved = localStorage.getItem('serviceDesk_baixa_form');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn('Erro ao carregar baixaData', e); }
    }
    return {
      relatoInicial: '',
      sinalOptico: '',
      statusConexao: 'Conexão Ativa / Autenticada',
      registroOscilacoes: 'Sem registros de oscilação no log de conexão',
      orientacoes: [],
      procedimentos: {
        reboot: false,
        canal: false,
        tipoCanal: 'Automático',
        canalEsp: '',
        banda: false,
        larguraBanda: 'Automático',
        dns: false
      },
      conclusao: ''
    };
  });

  const [copiedBaixa, setCopiedBaixa] = useState(false);

  useEffect(() => {
    localStorage.setItem('serviceDesk_baixa_form', JSON.stringify(baixaData));
  }, [baixaData]);

  const handleBaixaOrientacaoToggle = (texto) => {
    setBaixaData(prev => {
      const exists = prev.orientacoes.includes(texto);
      return {
        ...prev,
        orientacoes: exists 
          ? prev.orientacoes.filter(o => o !== texto)
          : [...prev.orientacoes, texto]
      };
    });
  };

  const handleBaixaProcedimentoToggle = (key, val) => {
    setBaixaData(prev => ({
      ...prev,
      procedimentos: {
        ...prev.procedimentos,
        [key]: typeof val === 'boolean' ? val : !prev.procedimentos[key]
      }
    }));
  };

  const gerarResumoBaixa = () => {
    const { relatoInicial, sinalOptico, statusConexao, registroOscilacoes, orientacoes, procedimentos, conclusao } = baixaData;

    let textoFinal = '';

    if (relatoInicial.trim()) {
      textoFinal += `RELATO INICIAL:\n${relatoInicial.trim()}\n\n`;
    }

    if (sinalOptico.trim() || statusConexao || registroOscilacoes) {
      textoFinal += `VERIFICAÇÕES NO SISTEMA:\n`;
      if (sinalOptico.trim()) textoFinal += `• Sinal Óptico: ${sinalOptico.trim()}\n`;
      if (statusConexao) textoFinal += `• Status: ${statusConexao}\n`;
      if (registroOscilacoes) textoFinal += `• Histórico de Logs: ${registroOscilacoes}\n`;
      textoFinal += `\n`;
    }

    if (orientacoes.length > 0) {
      textoFinal += `ORIENTAÇÕES E ESCLARECIMENTOS:\n`;
      orientacoes.forEach(o => {
        textoFinal += `• ${o}\n`;
      });
      textoFinal += `\n`;
    }

    const procs = [];
    if (procedimentos.reboot) {
      procs.push('Efetuado reboot remoto preventivo na ONT/Roteador.');
    }
    if (procedimentos.canal) {
      if (procedimentos.tipoCanal === 'Específico' && procedimentos.canalEsp.trim()) {
        procs.push(`Alterada a frequência de Wi-Fi para o canal específico ${procedimentos.canalEsp.trim()}.`);
      } else {
        procs.push('Definida seleção automática de canal Wi-Fi mais livre.');
      }
    }
    if (procedimentos.banda) {
      procs.push(`Largura de banda do Wi-Fi configurada para ${procedimentos.larguraBanda}.`);
    }
    if (procedimentos.dns) {
      procs.push('Configuração de servidores DNS de alta performance (Google DNS / Cloudflare).');
    }

    if (procs.length > 0) {
      textoFinal += `PROCEDIMENTOS E OTIMIZAÇÕES:\n`;
      procs.forEach(p => {
        textoFinal += `• ${p}\n`;
      });
      textoFinal += `\n`;
    }

    if (conclusao.trim()) {
      textoFinal += `DESFECHO / CONCLUSÃO:\n${conclusao.trim()}`;
    }

    return textoFinal.trim() || 'Aguardando preenchimento dos campos...';
  };

  const handleCopiarBaixa = async () => {
    const texto = gerarResumoBaixa();
    const ok = await copyToClipboard(texto, 'Resumo da Baixa N2 copiado com sucesso!');
    if (ok) {
      setCopiedBaixa(true);
      setTimeout(() => setCopiedBaixa(false), 2500);
    }
  };

  const handleLimparBaixa = () => {
    setBaixaData({
      relatoInicial: '',
      sinalOptico: '',
      statusConexao: 'Conexão Ativa / Autenticada',
      registroOscilacoes: 'Sem registros de oscilação no log de conexão',
      orientacoes: [],
      procedimentos: {
        reboot: false,
        canal: false,
        tipoCanal: 'Automático',
        canalEsp: '',
        banda: false,
        larguraBanda: 'Automático',
        dns: false
      },
      conclusao: ''
    });
    showToast('Formulário de Baixa limpo.', 'info');
  };

  /* =========================================================
     ESTADOS TAB 2: ADIANTAMENTO DE VAGA
     ========================================================= */
  const [adiantamentoData, setAdiantamentoData] = useState(() => {
    const saved = localStorage.getItem('serviceDesk_adiantamento_form');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn('Erro ao carregar adiantamentoData', e); }
    }
    return {
      vagaData: '',
      servico: 'Mudança de cômodo',
      servicoOutro: '',
      nome: '',
      cidade: '',
      bairro: '',
      situacao: ''
    };
  });

  const [copiedAdiantamento, setCopiedAdiantamento] = useState(false);

  useEffect(() => {
    localStorage.setItem('serviceDesk_adiantamento_form', JSON.stringify(adiantamentoData));
  }, [adiantamentoData]);

  const gerarResumoAdiantamento = () => {
    const { vagaData, servico, servicoOutro, nome, cidade, bairro, situacao } = adiantamentoData;
    const servicoFinal = servico === 'Outro' ? (servicoOutro.trim() || 'Serviço') : servico;

    let texto = '';
    texto += `VAGA PARA: ${vagaData.trim() || '-'}\n`;
    texto += `SERVIÇO: ${servicoFinal || '-'}\n`;
    texto += `NOME: ${nome.trim() || '-'}\n`;
    texto += `CIDADE: ${cidade.trim() || '-'}\n`;
    texto += `BAIRRO: ${bairro.trim() || '-'}\n\n`;
    texto += `SITUAÇÃO: ${situacao.trim() || '-'}`;

    return texto;
  };

  const handleCopiarAdiantamento = async () => {
    const texto = gerarResumoAdiantamento();
    const ok = await copyToClipboard(texto, 'Solicitação de Vaga copiada com sucesso!');
    if (ok) {
      setCopiedAdiantamento(true);
      setTimeout(() => setCopiedAdiantamento(false), 2500);
    }
  };

  const handleLimparAdiantamento = () => {
    setAdiantamentoData({
      vagaData: '',
      servico: 'Mudança de cômodo',
      servicoOutro: '',
      nome: '',
      cidade: '',
      bairro: '',
      situacao: ''
    });
    showToast('Formulário de Adiantamento limpo.', 'info');
  };

  /* =========================================================
     ESTADOS TAB 3: CONFIRMAÇÃO / RETORNO OS
     ========================================================= */
  const getTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getTodayTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  };

  const [confirmacaoData, setConfirmacaoData] = useState(() => {
    const saved = localStorage.getItem('serviceDesk_confirmacao_form');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn('Erro ao carregar confirmacaoData', e); }
    }
    return {
      cliente: '',
      tecnico: '',
      telefone: '',
      dataAtendimento: getTodayDate(),
      horaContato: getTodayTime(),
      operador: operador || '',
      relato: ''
    };
  });

  const [copiedConf1, setCopiedConf1] = useState(false);
  const [copiedConf2, setCopiedConf2] = useState(false);

  useEffect(() => {
    localStorage.setItem('serviceDesk_confirmacao_form', JSON.stringify(confirmacaoData));
  }, [confirmacaoData]);

  const formatarDataBR = (isoDate) => {
    if (!isoDate) return '--/--/--';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    }
    return isoDate;
  };

  const gerarResumoConfLogistica = () => {
    const { cliente, tecnico, telefone, relato } = confirmacaoData;
    let t = `*CLIENTE:* ${cliente.trim() || '-'}\n`;
    t += `*ROTA DO TÉCNICO:* ${tecnico.trim() || '-'}\n`;
    t += `*TELEFONE:* ${telefone.trim() || '-'}\n\n`;
    t += `${relato.trim() || '-'}`;
    return t;
  };

  const gerarResumoConfAtendimento = () => {
    const { dataAtendimento, horaContato, operador: op, relato } = confirmacaoData;
    const opNome = op || operador || 'Atendente';
    let t = `${formatarDataBR(dataAtendimento)} ${horaContato || '--:--'}\n`;
    t += `${relato.trim() || '-'}\n`;
    t += `Op. ${opNome.trim() || '-'}`;
    return t;
  };

  const handleCopiarConfLogistica = async () => {
    const t = gerarResumoConfLogistica();
    const ok = await copyToClipboard(t, 'Formato Logística copiado com sucesso!');
    if (ok) {
      setCopiedConf1(true);
      setTimeout(() => setCopiedConf1(false), 2500);
    }
  };

  const handleCopiarConfAtendimento = async () => {
    const t = gerarResumoConfAtendimento();
    const ok = await copyToClipboard(t, 'Formato Atendimento / OS copiado com sucesso!');
    if (ok) {
      setCopiedConf2(true);
      setTimeout(() => setCopiedConf2(false), 2500);
    }
  };

  const handleLimparConfirmacao = () => {
    setConfirmacaoData({
      cliente: '',
      tecnico: '',
      telefone: '',
      dataAtendimento: getTodayDate(),
      horaContato: getTodayTime(),
      operador: operador || '',
      relato: ''
    });
    showToast('Formulário de Confirmação limpo.', 'info');
  };

  // Classes utilitárias do projeto
  const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';
  const cardClass = 'bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6';
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-white text-slate-800 placeholder:text-slate-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6 pb-12"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              toast.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {toast.type === 'error' ? '✕' : <Check size={14} className="stroke-[3]" />}
            </div>
            <p className="text-xs font-semibold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Encerramento de Atendimento
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/15 text-red-600 border border-red-500/30">
                Central N2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Máscara de baixa técnica, solicitação de adiantamento de vaga e retorno de agendamento.
            </p>
          </div>
        </div>

        {/* Indicador de Operador Vinculado */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-xs text-slate-600">
          <User size={14} className="text-red-500" />
          <span className="font-semibold text-slate-700">{operador || 'Operador Conectado'}</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Ativo</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('baixa')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'baixa'
              ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 size={16} />
          <span>1. Baixa N2 / Encerramento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adiantamento')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'adiantamento'
              ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarPlus size={16} />
          <span>2. Adiantamento de Vaga</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('confirmacao')}
          className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'confirmacao'
              ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-500'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PhoneCall size={16} />
          <span>3. Retorno / Confirmação OS</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: BAIXA DE ATENDIMENTO */}
      {activeTab === 'baixa' && (
        <motion.div
          key="aba-baixa"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardClass}>
            <div className="space-y-6">
              {/* 1. Relato Inicial */}
              <div>
                <label className={labelClass}>
                  1. Relato Inicial do Cliente / Motivo do Contato
                </label>
                <textarea
                  rows="2"
                  value={baixaData.relatoInicial}
                  onChange={(e) => setBaixaData(prev => ({ ...prev, relatoInicial: e.target.value }))}
                  placeholder="Ex: Cliente relata instabilidade e oscilação de taxa de download no Wi-Fi após às 18h..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* 2. Verificações no Sistema */}
              <div>
                <label className={labelClass}>
                  2. Verificações no Sistema e Sinal Óptico
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Radio size={13} className="text-red-500" />
                      Sinal Óptico (dBm)
                    </label>
                    <input
                      type="text"
                      value={baixaData.sinalOptico}
                      onChange={(e) => setBaixaData(prev => ({ ...prev, sinalOptico: e.target.value }))}
                      placeholder="Ex: -19.45 dBm"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Activity size={13} className="text-red-500" />
                      Status da Conexão
                    </label>
                    <select
                      value={baixaData.statusConexao}
                      onChange={(e) => setBaixaData(prev => ({ ...prev, statusConexao: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="Conexão Ativa / Autenticada">Conexão Ativa / Autenticada</option>
                      <option value="Conexão Inativa / Desconectada">Conexão Inativa / Desconectada (LOS/Sinal Caído)</option>
                      <option value="Conexão Instável com Flutuações">Conexão Instável com Flutuações</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Clock size={13} className="text-red-500" />
                      Histórico de Log / Oscilações
                    </label>
                    <select
                      value={baixaData.registroOscilacoes}
                      onChange={(e) => setBaixaData(prev => ({ ...prev, registroOscilacoes: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="Sem registros de oscilação no log de conexão">Sem registros de oscilação (Conexão Contínua)</option>
                      <option value="Quedas pontuais correlacionadas com queda de energia local">Quedas pontuais por oscilação de energia local</option>
                      <option value="Histórico de desautenticações recentes na porta OLT">Histórico de oscilações/quedas recentes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Orientações */}
              <div>
                <label className={labelClass}>
                  3. Orientações e Esclarecimentos Prestados
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { key: 'redes', label: 'Diferença entre redes (2.4G vs 5G)', text: 'Explicada a diferença técnica entre as frequências 2.4 GHz (maior alcance) e 5 GHz (alta velocidade).' },
                    { key: 'hardware', label: 'Limitação de hardware do dispositivo', text: 'Esclarecido sobre limitações técnicas e de processamento do próprio dispositivo/aplicativo de teste.' },
                    { key: 'iptv', label: 'Apps / IPTV não homologados', text: 'Orientado sobre instabilidades e bloqueios de servidores em aplicativos de streaming não homologados (IPTV).' },
                    { key: 'cobertura', label: 'Sinal em áreas externas/paredes', text: 'Orientado que a conexão residencial via Wi-Fi não garante cobertura em áreas abertas/externas ou paredes espessas.' },
                    { key: 'fast', label: 'Limitação Placa Fast (100 Mbps)', text: 'Esclarecido sobre limitação de taxa de transferência física em placa de rede Fast Ethernet (limitada a 100 Mbps).' },
                    { key: 'grade', label: 'Grade Regional de Emissoras (TV/APP)', text: 'Orientado sobre chaveamento de grade regional por parte das próprias emissoras de TV em transmissões ao vivo.' }
                  ].map(item => {
                    const isChecked = baixaData.orientacoes.includes(item.text);
                    return (
                      <label
                        key={item.key}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                          isChecked 
                            ? 'bg-red-50/70 border-red-300 text-red-900 shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBaixaOrientacaoToggle(item.text)}
                          className="rounded text-red-600 focus:ring-red-500 mt-0.5 cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4. Procedimentos e Otimizações Remotas */}
              <div>
                <label className={labelClass}>
                  4. Procedimentos e Otimizações Aplicadas Remotamente
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  
                  {/* Reboot */}
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all select-none ${
                    baixaData.procedimentos.reboot ? 'bg-red-50/70 border-red-300 text-red-900' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <input
                      type="checkbox"
                      checked={baixaData.procedimentos.reboot}
                      onChange={() => handleBaixaProcedimentoToggle('reboot')}
                      className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Reboot preventivo remoto na ONT/Roteador</span>
                  </label>

                  {/* Canal Wi-Fi */}
                  <div className={`p-3 rounded-xl border transition-all space-y-2 ${
                    baixaData.procedimentos.canal ? 'bg-red-50/70 border-red-300' : 'bg-white border-slate-200'
                  }`}>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                      <input
                        type="checkbox"
                        checked={baixaData.procedimentos.canal}
                        onChange={() => handleBaixaProcedimentoToggle('canal')}
                        className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <Wifi size={14} className="text-red-500" />
                      <span>Ajuste / Troca de Canal Wi-Fi</span>
                    </label>

                    {baixaData.procedimentos.canal && (
                      <div className="pl-6 flex items-center gap-2 pt-1">
                        <select
                          value={baixaData.procedimentos.tipoCanal}
                          onChange={(e) => setBaixaData(prev => ({
                            ...prev,
                            procedimentos: { ...prev.procedimentos, tipoCanal: e.target.value }
                          }))}
                          className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Automático">Modo Automático</option>
                          <option value="Específico">Canal Específico</option>
                        </select>

                        {baixaData.procedimentos.tipoCanal === 'Específico' && (
                          <input
                            type="text"
                            value={baixaData.procedimentos.canalEsp}
                            onChange={(e) => setBaixaData(prev => ({
                              ...prev,
                              procedimentos: { ...prev.procedimentos, canalEsp: e.target.value }
                            }))}
                            placeholder="Ex: 6 ou 149"
                            className="text-xs p-1.5 rounded-lg border border-slate-300 w-28 bg-white"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Largura de Banda */}
                  <div className={`p-3 rounded-xl border transition-all space-y-2 ${
                    baixaData.procedimentos.banda ? 'bg-red-50/70 border-red-300' : 'bg-white border-slate-200'
                  }`}>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                      <input
                        type="checkbox"
                        checked={baixaData.procedimentos.banda}
                        onChange={() => handleBaixaProcedimentoToggle('banda')}
                        className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <Settings2 size={14} className="text-red-500" />
                      <span>Ajuste de Largura de Banda (Wi-Fi)</span>
                    </label>

                    {baixaData.procedimentos.banda && (
                      <div className="pl-6 pt-1">
                        <select
                          value={baixaData.procedimentos.larguraBanda}
                          onChange={(e) => setBaixaData(prev => ({
                            ...prev,
                            procedimentos: { ...prev.procedimentos, larguraBanda: e.target.value }
                          }))}
                          className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white w-full"
                        >
                          <option value="Automático">Automático</option>
                          <option value="20 MHz">20 MHz (Maior estabilidade/Alcance)</option>
                          <option value="40 MHz">40 MHz</option>
                          <option value="20/40 MHz">20/40 MHz (Híbrido)</option>
                          <option value="80 MHz">80 MHz (Alta taxa para 5G)</option>
                          <option value="160 MHz">160 MHz</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* DNS */}
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all select-none ${
                    baixaData.procedimentos.dns ? 'bg-red-50/70 border-red-300 text-red-900' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <input
                      type="checkbox"
                      checked={baixaData.procedimentos.dns}
                      onChange={() => handleBaixaProcedimentoToggle('dns')}
                      className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Configuração de DNS de alta performance (Google / Cloudflare)</span>
                  </label>

                </div>
              </div>

              {/* 5. Conclusão */}
              <div>
                <label className={labelClass}>
                  5. Conclusão / Desfecho Final
                </label>
                <textarea
                  rows="2"
                  value={baixaData.conclusao}
                  onChange={(e) => setBaixaData(prev => ({ ...prev, conclusao: e.target.value }))}
                  placeholder="Ex: Após procedimentos e novos testes de velocidade, cliente confirmou normalização completa do sinal e encerramento do chamado."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 size={14} className="text-red-500" />
                    Resumo Formatado da Baixa N2
                  </span>
                  <span className="text-[11px] text-slate-400">Pronto para colar no CRM / OS</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-red-300 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[120px] border border-slate-800 shadow-inner select-all">
                  {gerarResumoBaixa()}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopiarBaixa}
                  className={`flex-1 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    copiedBaixa 
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                      : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                  }`}
                >
                  {copiedBaixa ? <Check size={18} /> : <Copy size={16} />}
                  <span>{copiedBaixa ? 'Resumo Copiado com Sucesso!' : 'Copiar Resumo da Baixa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLimparBaixa}
                  className="sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-95"
                >
                  <Trash2 size={16} />
                  <span>Limpar Campos</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* CONTEÚDO DA ABA 2: ADIANTAMENTO DE VAGA */}
      {activeTab === 'adiantamento' && (
        <motion.div
          key="aba-adiantamento"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardClass}>
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Vaga Para (Data Limite / Desejada)</label>
                  <input
                    type="text"
                    value={adiantamentoData.vagaData}
                    onChange={(e) => setAdiantamentoData(prev => ({ ...prev, vagaData: e.target.value }))}
                    placeholder="Ex: Antes do dia 28/09 ou Turno Manhã"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tipo de Serviço</label>
                  <select
                    value={adiantamentoData.servico}
                    onChange={(e) => setAdiantamentoData(prev => ({ ...prev, servico: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="Mudança de cômodo">Mudança de cômodo</option>
                    <option value="Mudança de endereço">Mudança de endereço</option>
                    <option value="Visita técnica / Reparo de Sinal">Visita técnica / Reparo de Sinal</option>
                    <option value="Instalação de ponto adicional">Instalação de ponto adicional</option>
                    <option value="Troca de equipamento / Roteador Dual Band">Troca de equipamento / Roteador Dual Band</option>
                    <option value="Outro">Outro (Especificar)</option>
                  </select>

                  {adiantamentoData.servico === 'Outro' && (
                    <input
                      type="text"
                      value={adiantamentoData.servicoOutro}
                      onChange={(e) => setAdiantamentoData(prev => ({ ...prev, servicoOutro: e.target.value }))}
                      placeholder="Especifique o tipo de serviço..."
                      className={`${inputClass} mt-2`}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nome Completo do Cliente</label>
                  <input
                    type="text"
                    value={adiantamentoData.nome}
                    onChange={(e) => setAdiantamentoData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: MARCIA CONCEICAO DOS SANTOS"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Cidade</label>
                  <input
                    type="text"
                    value={adiantamentoData.cidade}
                    onChange={(e) => setAdiantamentoData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Ex: Itanhaém"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Bairro</label>
                  <input
                    type="text"
                    value={adiantamentoData.bairro}
                    onChange={(e) => setAdiantamentoData(prev => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Ex: Jardim Oásis"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Situação / Motivo da Solicitação de Encaixe</label>
                <textarea
                  rows="3"
                  value={adiantamentoData.situacao}
                  onChange={(e) => setAdiantamentoData(prev => ({ ...prev, situacao: e.target.value }))}
                  placeholder="Ex: Cliente ciente da data agendada originalmente, porém necessita do adiantamento pois utiliza a conexão para trabalho em Home Office..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarPlus size={14} className="text-red-500" />
                  Texto Formatado para Adiantamento
                </label>
                <div className="p-4 rounded-xl bg-slate-900 text-red-300 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[100px] border border-slate-800 shadow-inner select-all">
                  {gerarResumoAdiantamento()}
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopiarAdiantamento}
                  className={`flex-1 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    copiedAdiantamento 
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                      : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                  }`}
                >
                  {copiedAdiantamento ? <Check size={18} /> : <Copy size={16} />}
                  <span>{copiedAdiantamento ? 'Solicitação Copiada!' : 'Copiar Solicitação de Vaga'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLimparAdiantamento}
                  className="sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-95"
                >
                  <Trash2 size={16} />
                  <span>Limpar Campos</span>
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* CONTEÚDO DA ABA 3: CONFIRMAÇÃO / RETORNO OS */}
      {activeTab === 'confirmacao' && (
        <motion.div
          key="aba-confirmacao"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className={cardClass}>
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nome do Cliente</label>
                  <input
                    type="text"
                    value={confirmacaoData.cliente}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, cliente: e.target.value }))}
                    placeholder="Ex: STEFANE DE JESUS MOREIRA"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Rota / Técnico Responsável</label>
                  <input
                    type="text"
                    value={confirmacaoData.tecnico}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, tecnico: e.target.value }))}
                    placeholder="Ex: Rota Marcos / Setor Sul"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Telefone de Contato</label>
                  <input
                    type="text"
                    value={confirmacaoData.telefone}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, telefone: formatPhone(e.target.value) }))}
                    placeholder="+55 (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-red-500" />
                    Data do Atendimento
                  </label>
                  <input
                    type="date"
                    value={confirmacaoData.dataAtendimento}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, dataAtendimento: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-red-500" />
                    Horário do Contato
                  </label>
                  <input
                    type="time"
                    value={confirmacaoData.horaContato}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, horaContato: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-red-500" />
                    Operador(a) Atendente
                  </label>
                  <input
                    type="text"
                    value={confirmacaoData.operador}
                    onChange={(e) => setConfirmacaoData(prev => ({ ...prev, operador: e.target.value }))}
                    placeholder="Ex: Gustavo"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Relato do Cliente / Observações do Retorno</label>
                <textarea
                  rows="3"
                  value={confirmacaoData.relato}
                  onChange={(e) => setConfirmacaoData(prev => ({ ...prev, relato: e.target.value }))}
                  placeholder="Ex: Cliente retornou contato confirmando que estará no local no período da tarde para receber a equipe técnica..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Formato 1: Logística / WhatsApp */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall size={14} />
                    1. Formato Logística / Operacional WhatsApp
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-red-300 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[70px] border border-slate-800 shadow-inner select-all">
                  {gerarResumoConfLogistica()}
                </div>
                <button
                  type="button"
                  onClick={handleCopiarConfLogistica}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                    copiedConf1 ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                  }`}
                >
                  {copiedConf1 ? <Check size={14} /> : <Copy size={13} />}
                  <span>{copiedConf1 ? 'Copiado!' : 'Copiar Formato Logística'}</span>
                </button>
              </div>

              {/* Formato 2: Atendimento / Histórico CRM */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 size={14} />
                    2. Formato Atendimento / Histórico do CRM
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 text-red-300 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[70px] border border-slate-800 shadow-inner select-all">
                  {gerarResumoConfAtendimento()}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCopiarConfAtendimento}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      copiedConf2 ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                    }`}
                  >
                    {copiedConf2 ? <Check size={14} /> : <Copy size={13} />}
                    <span>{copiedConf2 ? 'Formato Atendimento Copiado!' : 'Copiar Formato Atendimento / OS'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLimparConfirmacao}
                    className="sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-95"
                  >
                    <Trash2 size={15} />
                    <span>Limpar Campos</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
