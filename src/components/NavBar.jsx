import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Radio, Edit3, Sparkles, History } from 'lucide-react';
import { ThemeSwitch } from './ThemeSwitch';
import { PAGES, SECTIONS, APP_VERSION } from '../lib/navConfig';

const getInitials = (fullName) => {
  if (!fullName) return 'OP';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function NavBar({
  active,
  setActive,
  isCollapsed,
  setIsCollapsed,
  operatorName,
  onEditOperator
}) {
  const [logoError, setLogoError] = useState(false);
  const isChangelogActive = active === 'changelog';

  const tooltip = (children) => (
    <span className="absolute left-full ml-3 px-2.5 py-1.5 glass text-[color:var(--text)] text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[color:var(--hairline)]">
      {children}
    </span>
  );

  return (
    <nav
      aria-label="Navegação principal"
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col glass border-r border-[color:var(--hairline)] text-[color:var(--text)] transition-[width] duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* MARCA */}
      <div className={`shrink-0 flex items-center ${isCollapsed ? 'flex-col gap-3 py-4' : 'justify-between px-4 pt-5 pb-3'}`}>
        <button
          type="button"
          onClick={() => setActive('home')}
          title="Início"
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <span className="w-10 h-10 rounded-[0.85rem] bg-gradient-to-br from-[#ff5d73] to-[#c4213f] flex items-center justify-center shrink-0 shadow-md shadow-[#d6334f]/30 group-hover:scale-105 transition-transform">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="Service Desk"
                className="w-7 h-7 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Radio className="w-5 h-5 text-white" />
            )}
          </span>
          {!isCollapsed && (
            <span className="flex flex-col items-start leading-tight min-w-0">
              <span className="font-semibold text-[15px] tracking-tight">Service Desk</span>
              <span className="text-[11px] text-[color:var(--text-3)] font-medium">Versão {APP_VERSION}</span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[color:var(--text-3)] hover:text-[color:var(--text)] hover:bg-[color:var(--hairline)] transition-colors cursor-pointer shrink-0"
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 space-y-5">
        {SECTIONS.map((section) => {
          const items = PAGES.filter((p) => p.section === section.id && !p.hidden);
          if (items.length === 0) return null;
          return (
            <div key={section.id} className="space-y-0.5">
              {section.id !== 'principal' && !isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-3)] select-none">
                  {section.title}
                </div>
              )}
              {section.id !== 'principal' && isCollapsed && (
                <div className="w-6 h-px bg-[color:var(--hairline)] mx-auto my-2" />
              )}

              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setActive(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        title={isCollapsed ? undefined : item.shortcut ? `Alt+${item.shortcut}` : undefined}
                        className={`group relative w-full flex items-center rounded-xl transition-colors cursor-pointer ${
                          isCollapsed ? 'justify-center h-11' : 'gap-3 px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)] font-semibold'
                            : 'text-[color:var(--text-2)] hover:bg-[color:var(--hairline)] hover:text-[color:var(--text)]'
                        }`}
                      >
                        <Icon size={isCollapsed ? 20 : 17} className="shrink-0" strokeWidth={isActive ? 2.3 : 2} />
                        {!isCollapsed && (
                          <>
                            <span className="text-[13px] leading-tight text-left flex-1">{item.name}</span>
                          </>
                        )}
                        {isCollapsed && tooltip(
                          <>
                            {item.name}
                            {item.shortcut && (
                              <span className="ml-2 text-[10px] text-[color:var(--text-3)] font-medium">Alt+{item.shortcut}</span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* RODAPÉ: TEMA, NOVIDADES E OPERADOR */}
      <div className="shrink-0 p-3 border-t border-[color:var(--hairline)] space-y-1">
        <ThemeSwitch isCollapsed={isCollapsed} />

        <button
          type="button"
          onClick={() => setActive('changelog')}
          aria-current={isChangelogActive ? 'page' : undefined}
          className={`group relative w-full flex items-center rounded-xl transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center h-11' : 'justify-between px-3 py-2'
          } ${
            isChangelogActive
              ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)] font-semibold'
              : 'text-[color:var(--text-2)] hover:bg-[color:var(--hairline)] hover:text-[color:var(--text)]'
          }`}
        >
          <span className="flex items-center gap-3">
            <History size={isCollapsed ? 20 : 17} className="shrink-0" />
            {!isCollapsed && <span className="text-[13px]">Novidades</span>}
          </span>
          {!isCollapsed && (
            <span className="flex items-center gap-1 text-[11px] text-[color:var(--text-3)] font-medium">
              v{APP_VERSION}
              <Sparkles size={11} className="text-amber-500" />
            </span>
          )}
          {isCollapsed && tooltip(<>Novidades · v{APP_VERSION}</>)}
        </button>

        <button
          type="button"
          onClick={onEditOperator}
          title="Alterar nome do operador"
          className={`group relative w-full flex items-center rounded-xl p-2 text-left hover:bg-[color:var(--hairline)] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff5d73] to-[#c4213f] text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {getInitials(operatorName)}
          </span>
          {!isCollapsed && (
            <span className="flex-1 min-w-0 leading-tight">
              <span className="block text-[11px] text-[color:var(--text-3)] font-medium">Operador</span>
              <span className="block text-[13px] font-semibold truncate">{operatorName || 'Definir nome…'}</span>
            </span>
          )}
          {!isCollapsed && <Edit3 size={14} className="text-[color:var(--text-3)] group-hover:text-[color:var(--accent)] transition-colors" />}
          {isCollapsed && tooltip(<>Operador: {operatorName || 'definir nome'}</>)}
        </button>
      </div>
    </nav>
  );
}
