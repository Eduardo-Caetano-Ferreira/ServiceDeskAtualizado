import { ChevronLeft } from 'lucide-react';
import { getPage, getSection } from '../lib/navConfig';
import { ThemeQuickSwitch } from './ThemeSwitch';

/**
 * Cabeçalho translúcido fixo no topo das telas internas:
 * botão de voltar para a Início, caminho da tela e dicas de atalho.
 */
export function PageHeader({ pageId, onHome }) {
  const page = getPage(pageId);
  if (!page) return null;
  const section = getSection(page.section);
  const Icon = page.icon;

  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 glass border-b border-[color:var(--hairline)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center gap-0.5 h-8 pl-2 pr-3 rounded-full text-[13px] font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] transition-colors cursor-pointer shrink-0"
            title="Voltar para a Início (Alt+1)"
          >
            <ChevronLeft size={16} />
            Início
          </button>

          <span className="h-4 w-px bg-[color:var(--hairline)] shrink-0" aria-hidden="true" />

          <div className="flex items-center gap-2 min-w-0">
            <Icon size={17} className="text-[color:var(--text-3)] shrink-0" />
            <h1 className="text-[15px] font-semibold tracking-tight truncate text-[color:var(--text)]">{page.name}</h1>
            {section && section.id !== 'principal' && (
              <span className="hidden md:inline text-[13px] text-[color:var(--text-3)] truncate">· {section.title}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {page.form && (
            <span className="hidden lg:flex items-center gap-4 text-[12px] text-[color:var(--text-3)]">
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
