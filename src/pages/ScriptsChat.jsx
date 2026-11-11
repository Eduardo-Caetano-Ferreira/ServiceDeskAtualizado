import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessagesSquare,
  Search,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Save,
  X,
  MessageSquare,
  Lock,
  Globe,
  Pencil,
  Download
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Scripts de Chat compartilhados via Firestore (coleção "chatScripts").
// Não há login: a "autoria" é o nome do operador registrado na plataforma.
// Privado = só aparece para o mesmo nome de operador; Global = aparece para todos.
const COL = 'chatScripts';
const LEGACY_KEY = 'serviceDesk_scripts_chat';
const MIGRATED_KEY = 'serviceDesk_scripts_chat_migrated';
const VIS_KEY = 'serviceDesk_scripts_visibility';

// "  João  Silva " -> "joao silva" (compara nomes sem diferenciar acento/caixa/espaços)
const normalizeName = (name) =>
  String(name || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

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

const VISIBILITY_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'meus', label: 'Meus scripts' },
  { key: 'globais', label: 'Globais' },
];

const mapDoc = (d) => {
  const data = d.data({ serverTimestamps: 'estimate' });
  return {
    id: d.id,
    source: 'firestore',
    ...data,
    updatedMs: data.atualizadoEm?.toMillis?.() ?? 0,
  };
};

const readLegacyScripts = () => {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return [];
    const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const defaultsById = Object.fromEntries(DEFAULT_SCRIPTS.map((s) => [s.id, s]));
    // só o que o operador criou ou alterou neste navegador
    return parsed.filter((s) => {
      if (!s || !s.titulo || !s.texto) return false;
      const base = defaultsById[s.id];
      return !base || base.texto !== s.texto || base.titulo !== s.titulo;
    });
  } catch {
    return [];
  }
};

export function ScriptsChat({ operatorName }) {
  const myName = (operatorName || '').trim();
  const myKey = normalizeName(myName);

  const [globalDocs, setGlobalDocs] = useState([]);
  const [mineDocs, setMineDocs] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [visibility, setVisibility] = useState(() => {
    try {
      const v = localStorage.getItem(VIS_KEY);
      return VISIBILITY_FILTERS.some((f) => f.key === v) ? v : 'todos';
    } catch {
      return 'todos';
    }
  });

  const [drafts, setDrafts] = useState({}); // edições ainda não salvas, por id
  const [copiedId, setCopiedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal criar/editar
  const [modal, setModal] = useState(null); // { editingId } | null
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ATENDIMENTO_GERAL');
  const [newText, setNewText] = useState('');
  const [newVisibility, setNewVisibility] = useState('privado');

  // Migração dos scripts que estavam só no navegador
  const [legacyItems, setLegacyItems] = useState(() => readLegacyScripts());

  // Scripts globais de todos
  useEffect(() => {
    const q = query(collection(db, COL), where('visibilidade', '==', 'global'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setGlobalDocs(snap.docs.map(mapDoc));
        setLoading(false);
        setLoadError(false);
      },
      (err) => {
        console.error('Erro ao carregar scripts globais:', err);
        setLoadError(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Scripts do operador atual (privados e globais dele). Não baixa os privados dos outros.
  useEffect(() => {
    if (!myKey) return undefined;
    const q = query(collection(db, COL), where('autorKey', '==', myKey));
    const unsub = onSnapshot(
      q,
      (snap) => setMineDocs(snap.docs.map(mapDoc)),
      (err) => {
        console.error('Erro ao carregar seus scripts:', err);
        setLoadError(true);
      }
    );
    return () => {
      unsub();
      setMineDocs([]);
    };
  }, [myKey]);

  useEffect(() => {
    try {
      localStorage.setItem(VIS_KEY, visibility);
    } catch {
      /* storage indisponível */
    }
  }, [visibility]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isOwn = (s) => s.source === 'firestore' && !!myKey && s.autorKey === myKey;

  // Lista única: scripts do Firestore (globais + meus) e depois os padrões do sistema
  const allScripts = useMemo(() => {
    const byId = new Map();
    [...globalDocs, ...mineDocs].forEach((s) => byId.set(s.id, s));
    const fromDb = [...byId.values()].sort((a, b) => b.updatedMs - a.updatedMs);
    const defaults = DEFAULT_SCRIPTS.map((s) => ({ ...s, source: 'default', visibilidade: 'global' }));
    return [...fromDb, ...defaults];
  }, [globalDocs, mineDocs]);

  const matchesVisibility = (s, v) => {
    if (v === 'meus') return isOwn(s);
    if (v === 'globais') return s.visibilidade === 'global';
    return true;
  };

  const counts = useMemo(() => ({
    todos: allScripts.length,
    meus: allScripts.filter((s) => s.source === 'firestore' && !!myKey && s.autorKey === myKey).length,
    globais: allScripts.filter((s) => s.visibilidade === 'global').length,
  }), [allScripts, myKey]);

  const filteredScripts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allScripts.filter((item) => {
      const matchVis = matchesVisibility(item, visibility);
      const matchCat = selectedCategory === 'TODAS' || item.categoria === selectedCategory;
      const matchQuery = !q || item.titulo.toLowerCase().includes(q) || item.texto.toLowerCase().includes(q);
      return matchVis && matchCat && matchQuery;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScripts, searchQuery, selectedCategory, visibility, myKey]);

  const getCategoriaStyle = (catKey) => {
    switch (catKey) {
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

  const getOwnerBadge = (s) => {
    if (s.source === 'default') return { text: 'Padrão', cls: 'bg-slate-100 text-slate-600 border-slate-300', icon: null };
    if (s.visibilidade === 'privado') return { text: 'Só eu', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Lock };
    return {
      text: isOwn(s) ? 'Global · meu' : `Global · ${s.autor || 'equipe'}`,
      cls: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Globe,
    };
  };

  const textOf = (s) => (s.id in drafts ? drafts[s.id] : s.texto);

  // ---------- ações ----------
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

  const requireName = () => {
    if (myKey) return true;
    showToast('Defina seu nome de operador (menu lateral) para salvar scripts.', 'error');
    return false;
  };

  const handleSaveCard = async (script) => {
    if (!requireName()) return;
    const texto = textOf(script).trim();
    if (!texto) {
      showToast('O texto do script não pode ficar vazio.', 'error');
      return;
    }
    setBusy(true);
    try {
      if (isOwn(script)) {
        await updateDoc(doc(db, COL, script.id), { texto, atualizadoEm: serverTimestamp() });
        showToast('Alteração salva!');
      } else {
        // Padrão/de outro operador: salva uma cópia privada com o texto editado
        await addDoc(collection(db, COL), {
          titulo: script.titulo,
          categoria: script.categoria,
          texto,
          visibilidade: 'privado',
          autor: myName,
          autorKey: myKey,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });
        showToast('Cópia salva em "Meus scripts" (só você vê).');
      }
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[script.id];
        return next;
      });
      setSavedId(script.id);
      setTimeout(() => setSavedId(null), 1800);
    } catch (err) {
      console.error(err);
      showToast('Não foi possível salvar. Verifique a conexão.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleVisibility = async (script) => {
    if (!isOwn(script)) return;
    const next = script.visibilidade === 'global' ? 'privado' : 'global';
    try {
      await updateDoc(doc(db, COL, script.id), { visibilidade: next, atualizadoEm: serverTimestamp() });
      showToast(next === 'global' ? 'Script disponível para todos.' : 'Script agora é só seu.');
    } catch (err) {
      console.error(err);
      showToast('Não foi possível alterar a visibilidade.', 'error');
    }
  };

  const handleDeleteScript = async (script) => {
    if (!isOwn(script)) return;
    if (!window.confirm(`Excluir o script "${script.titulo}"?${script.visibilidade === 'global' ? '\nEle some para todos os operadores.' : ''}`)) return;
    try {
      await deleteDoc(doc(db, COL, script.id));
      showToast('Script removido.');
    } catch (err) {
      console.error(err);
      showToast('Não foi possível excluir o script.', 'error');
    }
  };

  const openCreateModal = () => {
    if (!requireName()) return;
    setNewTitle('');
    setNewCategory('ATENDIMENTO_GERAL');
    setNewText('');
    setNewVisibility('privado');
    setModal({ editingId: null });
  };

  const openEditModal = (script) => {
    if (!isOwn(script)) return;
    setNewTitle(script.titulo);
    setNewCategory(script.categoria);
    setNewText(textOf(script));
    setNewVisibility(script.visibilidade === 'global' ? 'global' : 'privado');
    setModal({ editingId: script.id });
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!requireName()) return;
    if (!newTitle.trim() || !newText.trim()) {
      showToast('Preencha o título e o texto da mensagem.', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        titulo: newTitle.trim(),
        categoria: newCategory,
        texto: newText.trim(),
        visibilidade: newVisibility,
        atualizadoEm: serverTimestamp(),
      };
      if (modal.editingId) {
        await updateDoc(doc(db, COL, modal.editingId), payload);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[modal.editingId];
          return next;
        });
        showToast('Script atualizado!');
      } else {
        await addDoc(collection(db, COL), {
          ...payload,
          autor: myName,
          autorKey: myKey,
          criadoEm: serverTimestamp(),
        });
        showToast(newVisibility === 'global' ? 'Script criado e disponível para todos!' : 'Script criado (só você vê).');
      }
      setModal(null);
    } catch (err) {
      console.error(err);
      showToast('Não foi possível salvar. Verifique a conexão.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleImportLegacy = async () => {
    if (!requireName() || legacyItems.length === 0) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      legacyItems.forEach((s) => {
        batch.set(doc(collection(db, COL)), {
          titulo: s.titulo,
          categoria: s.categoria || 'ATENDIMENTO_GERAL',
          texto: s.texto,
          visibilidade: 'privado',
          autor: myName,
          autorKey: myKey,
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        });
      });
      await batch.commit();
      try { localStorage.setItem(MIGRATED_KEY, '1'); } catch { /* ignora */ }
      showToast(`${legacyItems.length} script(s) importado(s) para "Meus scripts".`);
      setLegacyItems([]);
    } catch (err) {
      console.error(err);
      showToast('Não foi possível importar. Tente novamente.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const dismissLegacy = () => {
    try { localStorage.setItem(MIGRATED_KEY, '1'); } catch { /* ignora */ }
    setLegacyItems([]);
  };

  const emptyMessage = visibility === 'meus'
    ? { title: 'Você ainda não tem scripts salvos.', hint: 'Clique em "Novo script" ou use "Salvar como meu" em qualquer script para criar o seu.' }
    : { title: 'Nenhum script encontrado para esta busca ou categoria.', hint: 'Tente ajustar o termo de pesquisa ou limpar os filtros.' };

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
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Scripts de Chat para Atendimento
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/15 text-red-600 border border-red-500/30">
                {filteredScripts.length} {filteredScripts.length === 1 ? 'Script' : 'Scripts'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {myName
                ? <>Salvando como <strong>{myName}</strong>. Escolha se cada script é só seu ou de todos.</>
                : 'Defina seu nome de operador no menu lateral para salvar seus próprios scripts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
          >
            <PlusCircle size={15} />
            <span>Novo script</span>
          </button>
        </div>
      </div>

      {/* AVISO: scripts antigos salvos só neste navegador */}
      {legacyItems.length > 0 && (
        <div className="rounded-2xl border border-blue-300/60 bg-blue-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong>{legacyItems.length} script(s)</strong> criado(s) ou editado(s) estavam salvos apenas neste navegador.
            Importe para <strong>Meus scripts</strong> (ficam privados, só você vê) para não perdê-los.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImportLegacy}
              disabled={busy || !myKey}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              Importar
            </button>
            <button
              type="button"
              onClick={dismissLegacy}
              className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs border border-slate-300 cursor-pointer"
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div className="rounded-2xl border border-red-300/60 bg-red-500/10 p-4 text-xs text-red-700">
          Não foi possível carregar os scripts compartilhados agora. Os scripts padrão continuam disponíveis; tente recarregar a página.
        </div>
      )}

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
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

        {/* Visibilidade: todos / meus / globais */}
        <div className="flex items-center gap-2 flex-wrap">
          <div role="tablist" aria-label="Filtrar por autoria" className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {VISIBILITY_FILTERS.map((f) => {
              const active = visibility === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setVisibility(f.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.key === 'meus' && <Lock size={12} />}
                  {f.key === 'globais' && <Globe size={12} />}
                  {f.label}
                  <span className="text-[10px] font-extrabold text-slate-400">{counts[f.key]}</span>
                </button>
              );
            })}
          </div>
          {loading && <span className="text-[11px] text-slate-400">Carregando scripts compartilhados…</span>}
        </div>

        {/* Chips de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
          {CATEGORIAS_CONFIG.map((cat) => {
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
          <p className="text-sm font-bold text-slate-700">{emptyMessage.title}</p>
          <p className="text-xs text-slate-400">{emptyMessage.hint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScripts.map((script) => {
            const catInfo = getCategoriaStyle(script.categoria);
            const owner = getOwnerBadge(script);
            const OwnerIcon = owner.icon;
            const own = isOwn(script);
            const isCopied = copiedId === script.id;
            const isSaved = savedId === script.id;
            const dirty = script.id in drafts && drafts[script.id] !== script.texto;

            return (
              <div
                key={script.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-red-300 shadow-sm flex flex-col justify-between space-y-3.5 transition-all"
              >
                <div className="space-y-2.5">
                  {/* Topo do Card: categoria, autoria e ações do dono */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${catInfo.badge}`}>
                        {catInfo.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 max-w-[12rem] ${owner.cls}`}>
                        {OwnerIcon && <OwnerIcon size={10} className="shrink-0" />}
                        <span className="truncate">{owner.text}</span>
                      </span>
                    </div>

                    {own && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(script)}
                          title={script.visibilidade === 'global' ? 'Tornar privado (só eu)' : 'Disponibilizar para todos'}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {script.visibilidade === 'global' ? <Lock size={13} /> : <Globe size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(script)}
                          title="Editar título, categoria e visibilidade"
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScript(script)}
                          title="Excluir este script"
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-800 leading-snug">
                    {script.titulo}
                  </h3>

                  {/* Texto editável antes de copiar; só persiste ao clicar em Salvar */}
                  <textarea
                    rows="4"
                    value={textOf(script)}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [script.id]: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-slate-50/60 leading-relaxed font-sans resize-y transition-all"
                    placeholder="Mensagem do script..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyScript(script.id, textOf(script))}
                    className={`flex-1 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isCopied ? <Check size={14} className="stroke-[3]" /> : <Copy size={13} />}
                    <span>{isCopied ? 'Script Copiado!' : 'Copiar Script'}</span>
                  </button>

                  {/* Dono: salva o texto editado. Outros/padrão: salva uma cópia privada */}
                  <button
                    type="button"
                    onClick={() => handleSaveCard(script)}
                    disabled={busy || (own && !dirty)}
                    title={own ? 'Salvar alterações no texto deste script' : 'Salva uma cópia em "Meus scripts" (só você vê)'}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSaved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSaved ? <Check size={13} className="text-emerald-600" /> : <Save size={13} className="text-slate-500" />}
                    <span>{isSaved ? 'Salvo' : own ? 'Salvar' : 'Salvar como meu'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO / EDITAR SCRIPT */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {modal.editingId ? <Pencil className="w-5 h-5 text-red-500" /> : <PlusCircle className="w-5 h-5 text-red-500" />}
                  <h3 className="font-extrabold text-sm text-white">
                    {modal.editingId ? 'Editar script' : 'Novo script'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  aria-label="Fechar"
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
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
                    Quem pode usar este script?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'privado', label: 'Só eu', hint: 'Aparece apenas para o seu nome de operador', icon: Lock },
                      { key: 'global', label: 'Todos', hint: 'Todos os operadores podem ver e copiar', icon: Globe },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const selected = newVisibility === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setNewVisibility(opt.key)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'border-red-500 bg-red-50 ring-1 ring-red-400'
                              : 'border-slate-300 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Icon size={13} />
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.hint}</span>
                        </button>
                      );
                    })}
                  </div>
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
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{modal.editingId ? 'Salvar alterações' : 'Salvar script'}</span>
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
