import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/themeCore';

/**
 * Alternância entre Modo Claro e Modo Escuro Suave (estilo Apple):
 * linha discreta com ícone e switch; versão compacta (só ícone) quando a barra está recolhida.
 */
export function ThemeSwitch({ isCollapsed = false, className = '' }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const label = isDarkMode ? 'Modo Escuro Suave' : 'Modo Claro';

  if (isCollapsed) {
    return (
      <div className={`relative flex justify-center ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          aria-label={isDarkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro Suave'}
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[color:var(--text-2)] hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent)] transition-colors cursor-pointer group relative active:scale-95"
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          <span className="absolute left-full ml-3 px-2.5 py-1 glass text-[color:var(--text)] text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[color:var(--hairline)]">
            {label}
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDarkMode}
      onClick={toggleDarkMode}
      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-[color:var(--text-2)] hover:bg-[color:var(--accent-soft)] transition-colors cursor-pointer select-none ${className}`}
    >
      <span className="flex items-center gap-2.5">
        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
        <span className="text-[13px] font-medium text-[color:var(--text)]">{label}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
          isDarkMode ? 'bg-[color:var(--accent)]' : 'bg-black/15'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isDarkMode ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Switch compacto de acesso rápido (ícone em botão redondo).
 */
export function ThemeQuickSwitch({ className = '' }) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro Suave'}
      title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro Suave'}
      className={`w-9 h-9 rounded-full flex items-center justify-center text-[color:var(--text-2)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] transition-colors cursor-pointer ${className}`}
    >
      {isDarkMode ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
