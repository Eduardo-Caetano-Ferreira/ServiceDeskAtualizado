import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NavBar } from './components/NavBar';
import { PageHeader } from './components/PageHeader';
import { Home } from './pages/Home';
import { OsGeral } from './pages/OsGeral';
import { MudEndereco } from './pages/MudEndereco';
import { MudComodo } from './pages/MudComodo';
import { PontoAdicional } from './pages/PontoAdicional';
import { Feedback } from './pages/Feedback';
import { ReparoTV } from './pages/ReparoTV';
import { ConsultaCeps } from './pages/ConsultaCeps';
import { AtualizarRota } from './pages/AtualizarRota';
import { Changelog } from './pages/Changelog';
import { EncerramentoAtendimento } from './pages/EncerramentoAtendimento';
import { ScriptsChat } from './pages/ScriptsChat';
import { OperatorModal } from './components/OperatorModal';
import { SHORTCUT_BY_CODE, PAGES } from './lib/navConfig';
import { useMediaQuery } from './lib/useMediaQuery';
import { usePwaUpdate } from './lib/pwa';

// Telas cujo primeiro campo é busca/filtro: não recebem foco automático
const NO_AUTOFOCUS_PAGES = ['home', 'consulta_ceps', 'scripts_chat', 'atualizar_rota', 'changelog'];

const PAGES_COMPONENTS = {
  os_geral: OsGeral,
  consulta_ceps: ConsultaCeps,
  mud_endereco: MudEndereco,
  mud_comodo: MudComodo,
  ponto_adicional: PontoAdicional,
  reparo_tv: ReparoTV,
  feedback: Feedback,
  encerramento: EncerramentoAtendimento,
  scripts_chat: ScriptsChat,
  atualizar_rota: AtualizarRota,
  changelog: Changelog,
};

function AppContent() {
  const [paginaAtual, setPaginaAtual] = useState(() => {
    // atalhos do app instalado (manifest) abrem direto na tela: /?page=os_geral
    try {
      const p = new URLSearchParams(window.location.search).get('page');
      return PAGES.some((x) => x.id === p) ? p : 'home';
    } catch {
      return 'home';
    }
  });

  // Telas estreitas (janela encostada no canto, celular): o menu vira uma gaveta
  const isCompact = useMediaQuery('(max-width: 1023px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const showDrawer = isCompact && drawerOpen;
  const navigate = (id) => {
    setPaginaAtual(id);
    setDrawerOpen(false);
  };
  const { updateReady, applyUpdate } = usePwaUpdate();

  // Controle de recolhimento da barra lateral
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('serviceDesk_sidebar_collapsed') === 'true';
  });

  // Identificação do Operador
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem('serviceDesk_operador') || '';
  });

  // Modal de identificação abre automaticamente no primeiro acesso se não houver nome
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(() => {
    const savedName = localStorage.getItem('serviceDesk_operador');
    return !savedName || savedName.trim() === '';
  });

  // Atalhos globais de teclado
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+Enter: validar e copiar o script da tela atual
      if (mod && !e.shiftKey && !e.altKey && e.key === 'Enter') {
        const btn = document.querySelector('[data-action="copy-script"]');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
        return;
      }

      // Ctrl+Shift+L: limpar o formulário (abre a confirmação)
      if (mod && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l') {
        const btn = document.querySelector('[data-action="clear-form"]');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
        return;
      }

      // Ctrl+K: vai para a Início e foca a busca de ferramentas
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaginaAtual('home');
        setDrawerOpen(false);
        setTimeout(() => document.querySelector('[data-home-search]')?.focus(), 120);
        return;
      }

      // Alt+tecla: trocar de tela (ver SHORTCUT_BY_CODE em lib/navConfig.js)
      if (e.altKey && !mod && !e.shiftKey) {
        const target = SHORTCUT_BY_CODE[e.code];
        if (target) {
          e.preventDefault();
          setPaginaAtual(target);
          setDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Sempre abre a tela nova no topo
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [paginaAtual]);

  // Foco automático no primeiro campo vazio ao abrir uma tela de preenchimento
  useEffect(() => {
    if (NO_AUTOFOCUS_PAGES.includes(paginaAtual) || isOperatorModalOpen) return;
    const t = setTimeout(() => {
      const candidates = document.querySelectorAll(
        'main input[type="text"], main input[type="tel"], main input:not([type]), main textarea'
      );
      for (const el of candidates) {
        if (el.value || el.disabled || el.readOnly || el.dataset.noAutofocus !== undefined) continue;
        if (el.offsetParent === null || el.closest('.fixed')) continue; // oculto ou dentro de modal
        el.focus({ preventScroll: true });
        break;
      }
    }, 450); // aguarda a animação de entrada da tela
    return () => clearTimeout(t);
  }, [paginaAtual, isOperatorModalOpen]);

  const handleToggleCollapse = (collapsedState) => {
    setIsCollapsed(collapsedState);
    localStorage.setItem('serviceDesk_sidebar_collapsed', String(collapsedState));
  };

  const handleSaveOperatorName = (newName) => {
    localStorage.setItem('serviceDesk_operador', newName);
    setOperatorName(newName);
    // Dispara evento para sincronizar se alguma aba ou formulário estiver ouvindo
    window.dispatchEvent(new Event('storage'));
  };

  const isHome = paginaAtual === 'home';
  const PageComponent = PAGES_COMPONENTS[paginaAtual];

  return (
    <div className="app-shell min-h-dvh font-sans flex">
      {/* Menu: barra lateral fixa em telas largas; gaveta em telas estreitas */}
      <NavBar
        active={paginaAtual}
        setActive={navigate}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
        operatorName={operatorName}
        onEditOperator={() => {
          setDrawerOpen(false);
          setIsOperatorModalOpen(true);
        }}
        isDrawer={isCompact}
        drawerOpen={showDrawer}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      {showDrawer && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Conteúdo principal com margem adaptativa de acordo com a barra lateral */}
      <main className={`flex-1 min-w-0 px-3 sm:px-6 md:px-8 pb-10 transition-[margin] duration-300 w-full ${
        isCompact ? 'ml-0' : isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {(!isHome || isCompact) && (
          <PageHeader
            pageId={paginaAtual}
            onHome={() => navigate('home')}
            isCompact={isCompact}
            onMenu={() => setDrawerOpen(true)}
          />
        )}

        <div className={isHome ? (isCompact ? 'pt-5' : 'pt-10 sm:pt-14') : 'pt-4 sm:pt-6'}>
          {isHome ? (
            <Home onNavigate={navigate} operatorName={operatorName} />
          ) : PageComponent ? (
            <PageComponent operatorName={operatorName} />
          ) : (
            <div className="text-[color:var(--text-2)]">Página em construção...</div>
          )}
        </div>
      </main>

      {/* Nova versão do app pronta (PWA): o operador decide quando atualizar */}
      {updateReady && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass border border-[color:var(--hairline)] shadow-lg rounded-full pl-4 pr-2 py-2 flex items-center gap-3 max-w-[calc(100vw-1.5rem)]"
        >
          <span className="text-[13px] font-medium text-[color:var(--text)]">Nova versão disponível</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="h-8 px-3.5 rounded-full bg-[color:var(--accent)] text-white text-xs font-semibold cursor-pointer active:scale-95"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Modal de identificação de operador no primeiro acesso ou edição */}
      <OperatorModal
        key={isOperatorModalOpen ? (operatorName || 'new-operator') : 'closed'}
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        currentName={operatorName}
        onSaveName={handleSaveOperatorName}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
