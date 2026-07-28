import { useState } from 'react';
import { NavBar } from './components/NavBar';
import { OsGeral } from './pages/OsGeral';
import { MudEndereco } from './pages/MudEndereco';
import { MudComodo } from './pages/MudComodo';
import { PontoAdicional } from './pages/PontoAdicional';
import { Feedback } from './pages/Feedback';
import { ReparoTV } from './pages/ReparoTV';

import { Inicio } from './pages/Inicio';

function App() {
  const [paginaAtual, setPaginaAtual] = useState('os_geral');

  // Agora o App controla a posição do menu
  const [menuPosition, setMenuPosition] = useState('left');

  const renderizarPagina = () => {
    switch (paginaAtual) {
      case 'mud_comodo':
        return <MudComodo />;
      case 'os_geral':
        return <OsGeral />;
      case 'mud_endereco':
        return <MudEndereco />;
      case 'ponto_adicional':
        return <PontoAdicional />;
      case 'reparo_tv':
        return <ReparoTV />;
      case 'feedback':
        return <Feedback />;
      case 'index':
        return <Inicio />;
      default:
        return <div className="text-slate-600">Página em construção...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex">
      <NavBar
        active={paginaAtual}
        setActive={setPaginaAtual}
        position={menuPosition}
        setPosition={setMenuPosition}
      />

      {/* Aqui está a mágica: a margem (ml-64) só é aplicada se o menu estiver na esquerda */}
      <main className={`flex-1 p-6 md:p-10 transition-all duration-300 w-full flex justify-center ${menuPosition === 'left' ? 'ml-0 md:ml-64 mb-24 md:mb-0' : 'ml-0 mb-24'
        }`}>
        <div className="w-full">
          {renderizarPagina()}
        </div>
      </main>
    </div>
  );
}

export default App;