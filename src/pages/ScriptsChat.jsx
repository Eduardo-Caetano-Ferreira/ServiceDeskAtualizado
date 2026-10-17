import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessagesSquare, 
  Search, 
  PlusCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Trash2, 
  Save, 
  X, 
  MessageSquare
} from 'lucide-react';

const DEFAULT_SCRIPTS = [
  {
    id: 'script-sa-1',
    categoria: 'SEM_ACESSO',
    titulo: 'Verificação Inicial de Leds e Cabos (Sem Sinal)',
    texto: 'Olá! Sou do Suporte Técnico Avançado N2. Identifiquei no sistema que seu equipamento está sem comunicação com nossa central. Por gentileza, verifique se o cabo de fibra (com a pontinha amarela/verde) está bem encaixado na parte de baixo do aparelho e se há alguma luz vermelha (como LOS) piscando.'
  },
  {
    id: 'script-sa-2',
    categoria: 'SEM_ACESSO',
    titulo: 'Procedimento de Reboot Físico do Equipamento',
    texto: 'Por favor, retire a fonte do modem da tomada de energia elétrica, aguarde cerca de 30 segundos e conecte novamente. Isso força o equipamento a solicitar um novo IP e sincronizar o sinal de fibra com nossa OLT.'
  },
  {
    id: 'script-sa-3',
    categoria: 'SEM_ACESSO',
    titulo: 'Aviso de Inexistência de Energia / Ausência no Local',
    texto: 'Conforme alinhado, identificamos que a conexão consta desconectada devido à falta de energia local ou ausência no imóvel para realização dos testes presenciais. Deixamos o atendimento registrado para que, assim que retornar ao local, entre em contato conosco para verificarmos o sinal em tempo real.'
  },
  {
    id: 'script-l-1',
    categoria: 'LENTIDAO',
    titulo: 'Boas-Vindas para Análise N2 de Instabilidade',
    texto: 'Olá! Sou o operador do Suporte N2. Recebi seu relato sobre oscilação/lentidão e já estou realizando uma análise detalhada da sua fibra, nível de sinal óptico e histórico de conexão para resolvermos isso.'
  },
  {
    id: 'script-l-2',
    categoria: 'LENTIDAO',
    titulo: 'Solicitação de Teste via Cabo de Rede (RJ45)',
    texto: 'Para isolarmos se o gargalo está na transmissão sem fio (Wi-Fi) ou na linha física da fibra, você teria algum computador ou notebook para realizarmos um teste de velocidade conectado diretamente via cabo de rede na porta LAN do roteador?'
  },
  {
    id: 'script-l-3',
    categoria: 'LENTIDAO',
    titulo: 'Explicativo Didático 2.4 GHz vs 5 GHz',
    texto: 'Notei que o seu dispositivo está conectado na rede 2.4GHz. Essa frequência tem ótimo alcance para atravessar paredes, porém é limitada em velocidade (chegando até no máximo 40-60 Mbps). Para aproveitar a velocidade total do seu plano, recomendo conectar na rede 5GHz mantendo-se mais próximo do roteador.'
  },
  {
    id: 'script-l-4',
    categoria: 'LENTIDAO',
    titulo: 'Otimização Remota de Canal e Largura de Banda',
    texto: 'Realizei uma varredura de interferência na sua região e ajustei remotamente o canal do seu Wi-Fi para uma frequência mais livre, além de otimizar os servidores de DNS da sua conexão. Por gentileza, desligue o Wi-Fi do seu celular por 10 segundos, reconecte e faça um novo teste.'
  },
  {
    id: 'script-mc-1',
    categoria: 'MUDANCA_COMODO',
    titulo: 'Informações e Pré-requisitos para Mudança de Cômodo',
    texto: 'Olá! Para realizarmos a Mudança de Cômodo do modem, é necessário o envio de uma equipe técnica para passagem e fusão de um novo cabo de fibra óptica até o ambiente desejado. O local de destino precisa ter tomadas de energia e canaleta/conduíte livre.'
  },
  {
    id: 'script-mc-2',
    categoria: 'MUDANCA_COMODO',
    titulo: 'Confirmação de Agendamento de Mudança de Cômodo',
    texto: 'Confirmamos o agendamento da visita para Mudança de Cômodo para a data combinada no período comercial. Solicitamos que haja um responsável maior de 18 anos no local para acompanhar o serviço do técnico.'
  },
  {
    id: 'script-me-1',
    categoria: 'MUDANCA_ENDERECO',
    titulo: 'Coleta de Dados para Viabilidade de Mudança de Endereço',
    texto: 'Olá! Para darmos prosseguimento ao pedido de Mudança de Endereço, por gentileza me informe o CEP, Nome da Rua, Número e Ponto de Referência do novo endereço para consultarmos a viabilidade técnica da nossa rede de fibra.'
  },
  {
    id: 'script-me-2',
    categoria: 'MUDANCA_ENDERECO',
    titulo: 'Orientação sobre Retirada de Equipamento na Mudança',
    texto: 'Informamos que no dia da mudança de endereço o assinante deve levar consigo a ONT/Roteador e a fonte de alimentação para a nova residência, onde o técnico efetuará a nova instalação no cabo de fibra do novo local.'
  },
  {
    id: 'script-pa-1',
    categoria: 'PONTO_ADICIONAL',
    titulo: 'Opções de Ponto Adicional (Cabo RJ45 ou Roteador MESH)',
    texto: 'Olá! Para expandir o sinal Wi-Fi para áreas com sinal fraco no seu imóvel, trabalhamos com a instalação de Ponto Adicional via Cabo de Rede de alta velocidade ou sistema de Roteadores MESH. Gostaria de entender melhor o espaço para indicarmos a melhor solução técnica.'
  },
  {
    id: 'script-pa-2',
    categoria: 'PONTO_ADICIONAL',
    titulo: 'Confirmação de Agendamento de Ponto Adicional',
    texto: 'Sua solicitação para instalação de Ponto Adicional foi aberta com sucesso. A equipe técnica comparecerá no local para realizar a passagem do cabeamento e configuração do novo equipamento.'
  },
  {
    id: 'script-ag-1',
    categoria: 'ATENDIMENTO_GERAL',
    titulo: 'Aguardando Resposta (Aviso de Tempo de Espera)',
    texto: 'Olá! Ainda está por aí? Caso não consiga responder agora, não se preocupe! Permanecemos à disposição para dar continuidade aos testes assim que puder nos retornar.'
  },
  {
    id: 'script-ag-2',
    categoria: 'ATENDIMENTO_GERAL',
    titulo: 'Encerramento por Falta de Interação',
    texto: 'Como não tivemos retorno no atendimento após os avisos, estamos encerrando este chamado por falta de interação. Caso volte a precisar de suporte, basta nos enviar uma nova mensagem. Tenha um excelente dia!'
  },
  {
    id: 'script-ag-3',
    categoria: 'ATENDIMENTO_GERAL',
    titulo: 'Mensagem de Finalização e Sucesso',
    texto: 'Excelente! Com os testes concluídos e o sinal 100% normalizado, estou encerrando o suporte. Agradeço sua paciência e colaboração durante os procedimentos. Qualquer dúvida, conte sempre com nossa equipe!'
  }
];

const CATEGORIAS_CONFIG = [
  { key: 'TODAS', label: 'Todos os Scripts' },
  { key: 'SEM_ACESSO', label: '🔴 Sem Acesso' },
  { key: 'LENTIDAO', label: '🟡 Instabilidade' },
  { key: 'MUDANCA_COMODO', label: '🏠 Mudança de Cômodo' },
  { key: 'MUDANCA_ENDERECO', label: '📍 Mudança de Endereço' },
  { key: 'PONTO_ADICIONAL', label: '➕ Ponto Adicional' },
  { key: 'ATENDIMENTO_GERAL', label: '💬 Atendimento Geral' },
];

export function ScriptsChat() {
  const [scripts, setScripts] = useState(() => {
    const saved = localStorage.getItem('serviceDesk_scripts_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Erro ao carregar scripts salvos', e);
      }
    }
    return DEFAULT_SCRIPTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [copiedId, setCopiedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form para novo script customizado
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ATENDIMENTO_GERAL');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    localStorage.setItem('serviceDesk_scripts_chat', JSON.stringify(scripts));
  }, [scripts]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getCategoriaStyle = (catKey) => {
    switch(catKey) {
      case 'SEM_ACESSO': 
        return { label: '🔴 Sem Acesso', badge: 'bg-red-50 text-red-700 border-red-200' };
      case 'LENTIDAO': 
        return { label: '🟡 Instabilidade', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'MUDANCA_COMODO': 
        return { label: '🏠 Cômodo', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'MUDANCA_ENDERECO': 
        return { label: '📍 Endereço', badge: 'bg-slate-200 text-slate-800 border-slate-300' };
      case 'PONTO_ADICIONAL': 
        return { label: '➕ Ponto Extra', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default: 
        return { label: '💬 Atendimento', badge: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const filteredScripts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scripts.filter(item => {
      const matchCat = (selectedCategory === 'TODAS' || item.categoria === selectedCategory);
      const matchQuery = !q || 
        item.titulo.toLowerCase().includes(q) || 
        item.texto.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [scripts, searchQuery, selectedCategory]);

  const handleCopyScript = async (id, text) => {
    if (!text) return;
    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        console.warn('Clipboard API falhou', err);
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
      setCopiedId(id);
      showToast('Script copiado para a área de transferência!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      showToast('Falha ao copiar automaticamente.', 'error');
    }
  };

  const handleUpdateText = (id, newTextVal) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, texto: newTextVal } : s));
  };

  const handleSaveCard = (id) => {
    setSavedId(id);
    showToast('Alteração salva no sistema local!');
    setTimeout(() => setSavedId(null), 1800);
  };

  const handleDeleteScript = (id) => {
    setScripts(prev => prev.filter(s => s.id !== id));
    showToast('Script removido da biblioteca.');
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Deseja restaurar os scripts padrão de fábrica?')) {
      setScripts(DEFAULT_SCRIPTS);
      showToast('Scripts de fábrica restaurados com sucesso!');
    }
  };

  const handleCreateCustomScript = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) {
      showToast('Preencha o título e o texto da mensagem.', 'error');
      return;
    }

    const newObj = {
      id: `script-custom-${Date.now()}`,
      categoria: newCategory,
      titulo: newTitle.trim(),
      texto: newText.trim()
    };

    setScripts(prev => [newObj, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewText('');
    setNewCategory('ATENDIMENTO_GERAL');
    showToast('Novo script customizado adicionado!');
  };

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
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Scripts de Chat para Atendimento
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/15 text-red-600 border border-red-500/30">
                {scripts.length} Prontos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mensagens padronizadas e respostas rápidas para agilizar o suporte no chat com o assinante.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle size={15} />
            <span>Adicionar Script Customizado</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            title="Restaura os scripts de fábrica"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer active:scale-95"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS DE CATEGORIA */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
        {/* Campo de Pesquisa por Palavra-Chave */}
        <div className="relative">
          <Search size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mensagem por palavra-chave (ex: luz vermelha, 5G, reboot, cabo, DNS, IPTV)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-slate-50/50 text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Chips de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
          {CATEGORIAS_CONFIG.map(cat => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-xl font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRADE DE CARDS DE SCRIPTS */}
      {filteredScripts.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Nenhum script encontrado para esta busca ou categoria.</p>
          <p className="text-xs text-slate-400">Tente ajustar o termo de pesquisa ou limpar os filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScripts.map(script => {
            const catInfo = getCategoriaStyle(script.categoria);
            const isCopied = copiedId === script.id;
            const isSaved = savedId === script.id;

            return (
              <div
                key={script.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-red-300 shadow-sm flex flex-col justify-between space-y-3.5 transition-all"
              >
                <div className="space-y-2.5">
                  {/* Topo do Card: Badge de Categoria e Ações */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${catInfo.badge}`}>
                      {catInfo.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteScript(script.id)}
                      title="Excluir este script"
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Título do Script */}
                  <h3 className="font-extrabold text-sm text-slate-800 leading-snug">
                    {script.titulo}
                  </h3>

                  {/* Textarea editável em tempo real antes de copiar */}
                  <div className="relative">
                    <textarea
                      rows="4"
                      value={script.texto}
                      onChange={(e) => handleUpdateText(script.id, e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-slate-50/60 leading-relaxed font-sans resize-y transition-all"
                      placeholder="Mensagem do script..."
                    />
                  </div>
                </div>

                {/* Rodapé do Card: Copiar e Salvar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyScript(script.id, script.texto)}
                    className={`flex-1 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isCopied ? <Check size={14} className="stroke-[3]" /> : <Copy size={13} />}
                    <span>{isCopied ? 'Script Copiado!' : 'Copiar Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCard(script.id)}
                    title="Salvar alterações no texto deste card"
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                      isSaved 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSaved ? <Check size={13} className="text-emerald-600" /> : <Save size={13} className="text-slate-500" />}
                    <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO SCRIPT CUSTOMIZADO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Header do Modal */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-extrabold text-sm text-white">
                    Novo Script Customizado
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form do Modal */}
              <form onSubmit={handleCreateCustomScript} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Título do Script *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Solicitação de Foto dos LEDs do Modem"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500 bg-white"
                  >
                    <option value="SEM_ACESSO">🔴 Cliente Sem Acesso</option>
                    <option value="LENTIDAO">🟡 Cliente com Lentidão / Instabilidade</option>
                    <option value="MUDANCA_COMODO">🏠 Mudança de Cômodo</option>
                    <option value="MUDANCA_ENDERECO">📍 Mudança de Endereço</option>
                    <option value="PONTO_ADICIONAL">➕ Ponto Adicional</option>
                    <option value="ATENDIMENTO_GERAL">💬 Atendimento Geral / Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mensagem do Script *
                  </label>
                  <textarea
                    rows="5"
                    required
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Digite a mensagem padrão que será enviada no chat..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-red-500 bg-white leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dica: Você poderá editar o texto individualmente a qualquer momento antes de copiá-lo.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    <span>Salvar Script</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
