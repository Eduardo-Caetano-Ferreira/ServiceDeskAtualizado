import { ChevronLeft, Menu } from 'lucide-react';
import { getPage, getSection } from '../lib/navConfig';
import { ThemeQuickSwitch } from './ThemeSwitch';

/**
 * Cabeçalho translúcido fixo no topo:
 * - telas largas: voltar para a Início, caminho da tela e dicas de atalho;
 * - telas estreitas (isCompact): botão de menu (gaveta), título e tema.
 */
export function PageHeader({ pageId, onHome, isCompact = false, onMenu }) {
  const page = getPage(pageId);
  if (!page) return null;
  const section = getSection(page.section);
  const Icon = page.icon;
  const isHome = pageId === 'home';
  const TitleTag = isHome ? 'span' : 'h1'; // a Início já tem o próprio h1

  return (
    <header className="sticky top-0 z-30 -mx-3 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8 py-2 sm:py-3 glass border-b border-[color:var(--hairline)] pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {isCompact && (
            <button
              type="button"
              onClick={onMenu}
              aria-label="Abrir menu"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[color:var(--text)] hover:bg-[color:var(--hairline)] transition-colors cursor-pointer shrink-0"
            >
              <Menu size={20} />
            </button>
          )}

          {!isHome && (
            <button
              type="button"
              onClick={onHome}
              className="inline-flex items-center gap-0.5 h-8 pl-1.5 pr-2 sm:pl-2 sm:pr-3 rounded-full text-[13px] font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] transition-colors cursor-pointer shrink-0"
              title="Voltar para a Início (Alt+1)"
              aria-label="Voltar para a Início"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Início</span>
            </button>
          )}

          {!isHome && !isCompact && (
            <span className="h-4 w-px bg-[color:var(--hairline)] shrink-0" aria-hidden="true" />
          )}

          <div className="flex items-center gap-2 min-w-0">
            <Icon size={17} className="text-[color:var(--text-3)] shrink-0" />
            <TitleTag className="text-[15px] font-semibold tracking-tight truncate text-[color:var(--text)]">
              {isHome ? 'Service Desk' : page.name}
            </TitleTag>
            {section && section.id !== 'principal' && !isCompact && (
              <span className="hidden md:inline text-[13px] text-[color:var(--text-3)] truncate">· {section.title}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {page.form && !isCompact && (
            <span className="hidden xl:flex items-center gap-4 text-[12px] text-[color:var(--text-3)]">
              <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Ctrl+Enter</kbd> copiar</span>
              <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Ctrl+Shift+L</kbd> limpar</span>
            </span>
          )}
          <ThemeQuickSwitch />
        </div>
      </div>
    </header>
  );
}
