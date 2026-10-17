import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/themeCore';

/**
 * Componente de alternância entre Modo Claro e Modo Escuro Suave
 * Estilo: Switch moderno com animação suave e ícones de Sol e Lua
 */
export function ThemeSwitch({ isCollapsed = false, className = '' }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  if (isCollapsed) {
    return (
      <div className={`relative flex justify-center ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label={isDarkMode ? 'Desativar Modo Escuro Suave' : 'Ativar Modo Escuro Suave'}
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Modo Escuro Suave (Clique para Modo Claro)' : 'Modo Claro (Clique para Modo Escuro Suave)'}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer group relative shadow-xs active:scale-95"
        >
          {isDarkMode ? (
            <Moon size={18} className="text-indigo-300 transition-transform group-hover:rotate-12" />
          ) : (
            <Sun size={18} className="text-amber-400 transition-transform group-hover:rotate-45" />
          )}

          {/* Tooltip flutuante no modo recolhido */}
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-amber-400'}`} />
            <span>{isDarkMode ? 'Modo Escuro Suave' : 'Modo Claro'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">(Alternar)</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={toggleDarkMode}
      className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/80 transition-all cursor-pointer group select-none ${className}`}
      title={isDarkMode ? 'Clique para alternar para o Modo Claro' : 'Clique para alternar para o Modo Escuro Suave'}
    >
      {/* Identificação com Ícone e Descrição */}
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
          isDarkMode 
            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50' 
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
        }`}>
          {isDarkMode ? (
            <Moon size={16} className="stroke-[2.2] transition-transform group-hover:rotate-12" />
          ) : (
            <Sun size={16} className="stroke-[2.2] transition-transform group-hover:rotate-45" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-200 leading-tight group-hover:text-white transition-colors">
              Modo Escuro
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">
            {isDarkMode ? 'Escuro Suave Ativo' : 'Modo Claro Ativo'}
          </span>
        </div>
      </div>

      {/* Botão Estilo Switch */}
      <div className="flex items-center pl-2">
        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label="Alternar tema escuro suave"
          onClick={(e) => {
            e.stopPropagation();
            toggleDarkMode();
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500/40 shadow-inner ${
            isDarkMode ? 'bg-red-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isDarkMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {isDarkMode ? (
              <Moon size={11} className="text-slate-900 fill-slate-900 stroke-[2.5]" />
            ) : (
              <Sun size={11} className="text-amber-500 fill-amber-500 stroke-[2.5]" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Switch compacto de acesso rápido para o topo do painel
 */
export function ThemeQuickSwitch({ className = '' }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div 
      onClick={toggleDarkMode}
      className={`hidden sm:inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border shadow-xs backdrop-blur-md transition-all cursor-pointer select-none group ${
        isDarkMode 
          ? 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-slate-600' 
          : 'bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300'
      } ${className}`}
      title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro Suave'}
    >
      <div className="flex items-center gap-1.5">
        {isDarkMode ? (
          <Moon size={14} className="text-indigo-400 stroke-[2.2] transition-transform group-hover:rotate-12" />
        ) : (
          <Sun size={14} className="text-amber-500 stroke-[2.2] transition-transform group-hover:rotate-45" />
        )}
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
        </span>
      </div>

      {/* Switch Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={isDarkMode}
        onClick={(e) => {
          e.stopPropagation();
          toggleDarkMode();
        }}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isDarkMode ? 'bg-red-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            isDarkMode ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
