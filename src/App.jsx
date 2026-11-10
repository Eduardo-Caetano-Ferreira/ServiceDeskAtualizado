import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/themeCore';
import { NavBar } from './components/NavBar';
import { OsGeral } from './pages/OsGeral';
import { MudEndereco } from './pages/MudEndereco';
import { MudComodo } from './pages/MudComodo';
import { PontoAdicional } from './pages/PontoAdicional';
import { Feedback } from './pages/Feedback';
import { ReparoTV } from './pages/ReparoTV';
import { ConsultaCeps } from './pages/ConsultaCeps';
import { Inicio } from './pages/Inicio';
import { Changelog } from './pages/Changelog';
import { EncerramentoAtendimento } from './pages/EncerramentoAtendimento';
import { ScriptsChat } from './pages/ScriptsChat';
import { OperatorModal } from './components/OperatorModal';

// Ordem do menu lateral: Alt+1..9 e Alt+0 (10º item)
const NAV_SHORTCUT_ORDER = [
  'index', 'consulta_ceps', 'os_geral', 'mud_endereco', 'mud_comodo',
  'ponto_adicional', 'reparo_tv', 'encerramento', 'scripts_chat', 'feedback'
];

// Telas cujo primeiro campo é busca/filtro: não recebem foco automático
const NO_AUTOFOCUS_PAGES = ['index', 'consulta_ceps', 'scripts_chat', 'changelog'];

function AppContent() {
  const [paginaAtual, setPaginaAtual] = useState('os_geral');
  const { isDarkMode } = useTheme();
  
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

      // Alt+1..9 / Alt+0: trocar de tela
      if (e.altKey && !mod && !e.shiftKey && /^Digit[0-9]$/.test(e.code)) {
        const n = Number(e.code.slice(5));
        const target = NAV_SHORTCUT_ORDER[n === 0 ? 9 : n - 1];
        if (target) {
          e.preventDefault();
          setPaginaAtual(target);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  const renderizarPagina = () => {
    switch (paginaAtual) {
      case 'index':
        return <Inicio />;
      case 'os_geral':
        return <OsGeral />;
      case 'consulta_ceps':
        return <ConsultaCeps />;
      case 'mud_endereco':
        return <MudEndereco />;
      case 'mud_comodo':
        return <MudComodo />;
      case 'ponto_adicional':
        return <PontoAdicional />;
      case 'reparo_tv':
        return <ReparoTV />;
      case 'feedback':
        return <Feedback />;
      case 'encerramento':
        return <EncerramentoAtendimento />;
      case 'scripts_chat':
        return <ScriptsChat />;
      case 'changelog':
        return <Changelog />;
      default:
        return <div className="text-slate-600">Página em construção...</div>;
    }
  };

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-250 ${
      isDarkMode ? 'bg-[#151921] text-slate-200' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Barra Lateral com suporte a recolher, controle de tema e identificação de operador */}
      <NavBar
        active={paginaAtual}
        setActive={setPaginaAtual}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
        operatorName={operatorName}
        onEditOperator={() => setIsOperatorModalOpen(true)}
      />

      {/* Conteúdo Principal com margem adaptativa de acordo com a barra lateral */}
      <main className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 w-full flex justify-center ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        <div className="w-full">
          {renderizarPagina()}
        </div>
      </main>

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