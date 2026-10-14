import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FileText, 
  MapPin, 
  Router, 
  Network, 
  MessageSquare, 
  MonitorPlay, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Radio,
  Edit3,
  Search,
  Sparkles
} from 'lucide-react';

// Seções organizadas do menu lateral
const menuSections = [
  {
    id: 'principal',
    title: 'Navegação',
    items: [
      { id: 'index', name: 'Início', icon: Home },
      { id: 'consulta_ceps', name: 'Consulta CEPs', icon: Search, badge: 'Novo' },
    ]
  },
  {
    id: 'ordens_servico',
    title: 'Ordens de Serviço',
    items: [
      { id: 'os_geral', name: 'OS Geral', icon: FileText },
      { id: 'mud_endereco', name: 'Mudança de Endereço', icon: MapPin },
      { id: 'mud_comodo', name: 'Mudança de Cômodo', icon: Router },
      { id: 'ponto_adicional', name: 'Ponto Adicional', icon: Network },
      { id: 'reparo_tv', name: 'Reparo TV', icon: MonitorPlay },
    ]
  },
  {
    id: 'comunicacao',
    title: 'Comunicação',
    items: [
      { id: 'feedback', name: 'Feedback', icon: MessageSquare },
    ]
  }
];

export function NavBar({ 
  active, 
  setActive, 
  isCollapsed, 
  setIsCollapsed,
  operatorName,
  onEditOperator 
}) {
  const [logoError, setLogoError] = useState(false);

  // Helper para obter as iniciais do nome do operador
  const getInitials = (fullName) => {
    if (!fullName) return 'OP';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isChangelogActive = active === 'changelog';

  return (
    <motion.nav
      layout
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* CABEÇALHO / ESPAÇO PARA LOGO DA ETECC TELECOM */}
      <div className={`border-b border-slate-800/80 relative flex items-center shrink-0 transition-all ${
        isCollapsed ? 'p-3 justify-center' : 'p-4 justify-between'
      }`}>
        {isCollapsed ? (
          /* Versão compacta da Logo */
          <div 
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md border border-red-500/30 cursor-pointer group"
            title="ETECC Telecom - Início"
            onClick={() => setActive('index')}
          >
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="ETECC Telecom" 
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" 
                onLoad={(e) => {
                  if (e.currentTarget.naturalWidth === 0) setLogoError(true);
                }}
                onError={() => setLogoError(true)} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Radio className="w-5 h-5 text-white animate-pulse" />
                <span className="text-[8px] font-black text-white leading-none mt-0.5">ET</span>
              </div>
            )}
          </div>
        ) : (
          /* Versão Expandida com Espaço Dedicado para Logo */
          <div 
            className="flex items-center gap-3 cursor-pointer group flex-1 mr-2"
            onClick={() => setActive('index')}
          >
            {/* Contêiner da Logo */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shrink-0 shadow-md border border-red-500/30 overflow-hidden">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="ETECC Telecom" 
                  className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
                  onLoad={(e) => {
                    if (e.currentTarget.naturalWidth === 0) setLogoError(true);
                  }}
                  onError={() => setLogoError(true)} 
                />
              ) : (
                <Radio className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Nome da Marca ETECC Telecom */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                  ETECC
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-600/25 text-red-400 rounded border border-red-500/30">
                  v1.3
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                TELECOM
              </span>
            </div>
          </div>
        )}

        {/* Botão de Recolher / Expandir barra no topo */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700 cursor-pointer ${
            isCollapsed ? 'absolute -right-3.5 top-6 bg-slate-800 border-slate-700 shadow-md text-white rounded-full' : ''
          }`}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* LISTA DE NAVEGAÇÃO ORGANIZADA EM SEÇÕES */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.id} className="space-y-1">
            {/* Título da Seção (apenas visível quando expandido) */}
            {!isCollapsed ? (
              <div className="px-2.5 py-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  {section.title}
                </span>
              </div>
            ) : (
              sectionIndex > 0 && (
                <div className="w-8 h-px bg-slate-800 mx-auto my-2" />
              )
            )}

            {/* Itens da Seção */}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                  <li key={item.id} className="w-full">
                    <button
                      type="button"
                      onClick={() => setActive(item.id)}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center w-full rounded-xl transition-all duration-150 group relative cursor-pointer ${
                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                      } ${
                        isActive 
                          ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950/40 border border-red-500' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                      }`}
                    >
                      <Icon 
                        size={isCollapsed ? 20 : 18} 
                        className={`shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        }`} 
                      />

                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 truncate">
                          <span className="text-xs font-semibold truncate text-left tracking-normal">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ml-1.5 ${
                              isActive 
                                ? 'bg-white text-red-600' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tooltip flutuante no modo recolhido */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                          {item.name}
                          {item.badge && (
                            <span className="ml-1.5 text-[9px] bg-red-600 px-1 py-0.5 rounded font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* SEÇÃO SEPARADA AO FINAL: CHANGELOG DISCRETO & OPERADOR */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/95 space-y-2.5 shrink-0">
        {/* Botão de Changelog Separado e Mais Discreto */}
        <div>
          <button
            type="button"
            onClick={() => setActive('changelog')}
            title={isCollapsed ? 'Changelog v1.2' : undefined}
            className={`w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer group relative ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            } ${
              isChangelogActive
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <History 
                size={isCollapsed ? 18 : 15} 
                className={`shrink-0 transition-transform group-hover:rotate-[-20deg] ${
                  isChangelogActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} 
              />
              {!isCollapsed && (
                <span className="text-xs font-medium text-left">
                  Changelog
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60">
                  v1.3
                </span>
                <Sparkles size={11} className="text-amber-400/80" />
              </div>
            )}

            {/* Tooltip flutuante para Changelog no modo recolhido */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                <span>Changelog & Novidades</span>
                <span className="ml-1.5 text-[9px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-bold">
                  v1.3
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Card do Operador Ativo */}
        <div 
          onClick={onEditOperator}
          title="Clique para alterar seu nome de operador"
          className={`flex items-center rounded-xl bg-slate-800/60 border border-slate-700/50 p-2 cursor-pointer hover:bg-slate-800 hover:border-red-500/40 transition group relative ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          }`}
        >
          {/* Avatar com iniciais */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs border border-red-400/30 group-hover:scale-105 transition-transform">
            {getInitials(operatorName)}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Operador Ativo
                </span>
                <Edit3 size={12} className="text-slate-400 group-hover:text-red-400 transition-colors" />
              </div>
              <p className="text-xs font-bold text-white truncate group-hover:text-red-300 transition-colors">
                {operatorName || 'Definir Nome...'}
              </p>
            </div>
          )}

          {/* Tooltip flutuante para operador quando recolhido */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Operador:</p>
              <p className="font-bold">{operatorName || 'Clique para definir'}</p>
            </div>
          )}
        </div>

        {/* Botão de Toggle Expandir/Recolher no rodapé */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800/70 transition flex items-center justify-center gap-1.5 border border-slate-800/80 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Recolher barra lateral</span>
          </button>
        )}
      </div>
    </motion.nav>
  );
}