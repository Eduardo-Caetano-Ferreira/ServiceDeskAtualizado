import { motion } from 'framer-motion';
import { Home, FileText, MapPin, Router, Network, MessageSquare, Layout, PanelBottom, MonitorPlay } from 'lucide-react';

const menuItems = [
  { id: 'index', name: 'Início', icon: Home },
  { id: 'os_geral', name: 'OS Geral', icon: FileText },
  { id: 'mud_endereco', name: 'Mudança de Endereço', icon: MapPin },
  { id: 'mud_comodo', name: 'Mudança de Cômodo', icon: Router },
  { id: 'ponto_adicional', name: 'Ponto Adicional', icon: Network },
  { id: 'reparo_tv', name: 'Reparo TV', icon: MonitorPlay },
  { id: 'feedback', name: 'Feedback', icon: MessageSquare },
];

// Agora recebemos position e setPosition do App.jsx
export function NavBar({ active, setActive, position, setPosition }) {
  const isLeft = position === 'left';

  return (
    <motion.nav
      layout
      className={`fixed bg-slate-800 border-slate-700 z-50 flex flex-shrink-0 transition-all duration-300 ${
        isLeft ? 'left-0 top-0 h-screen w-64 flex-col border-r' : 'bottom-0 left-0 w-full h-20 flex-row border-t items-center justify-center'
      }`}
    >
      {isLeft && (
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-primary">Gerador</span> de OS
          </h1>
        </div>
      )}

      <ul className={`flex ${isLeft ? 'flex-col gap-2 p-4 w-full' : 'flex-row gap-2 px-2 w-full justify-around overflow-x-auto'}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <li key={item.id} className={isLeft ? 'w-full' : 'flex-1 min-w-[70px]'}>
              <button
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-3 w-full transition-all duration-200 ${
                  isLeft ? 'px-4 py-3 rounded-xl' : 'flex-col p-2 rounded-lg text-xs justify-center text-center'
                } ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                }`}
              >
                <Icon size={isLeft ? 20 : 22} className={isActive ? 'text-primary' : ''} />
                <span className={isLeft ? 'text-base' : 'mt-1 leading-tight'}>{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`${isLeft ? 'mt-auto p-4 border-t border-slate-700' : 'fixed top-4 right-4'}`}>
         <button
          onClick={() => setPosition(isLeft ? 'bottom' : 'left')}
          className={`flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors ${
            isLeft ? 'w-full py-3 bg-slate-900 rounded-lg hover:bg-slate-700' : 'p-3 bg-slate-800 border border-slate-700 rounded-full shadow-md hover:border-primary'
          }`}
        >
          {isLeft ? (
            <>
              <PanelBottom size={18} />
              <span>Mover para baixo</span>
            </>
          ) : (
            <Layout size={20} className="text-primary" />
          )}
        </button>
      </div>
    </motion.nav>
  );
}