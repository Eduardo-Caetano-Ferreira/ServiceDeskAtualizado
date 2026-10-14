import { useState } from 'react';
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
import { OperatorModal } from './components/OperatorModal';

function App() {
  const [paginaAtual, setPaginaAtual] = useState('os_geral');
  
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
      case 'changelog':
        return <Changelog />;
      default:
        return <div className="text-slate-600">Página em construção...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex">
      {/* Barra Lateral com suporte a recolher e identificação de operador */}
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

export default App;