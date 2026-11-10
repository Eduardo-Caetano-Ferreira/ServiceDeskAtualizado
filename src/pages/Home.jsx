import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search, X, UploadCloud, ChevronRight } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PAGES, SECTIONS } from '../lib/navConfig';

// Cores dos ícones dos cartões [início, fim] do degradê
const TONES = {
  red: ['#ff5d73', '#c4213f'],
  orange: ['#ffb04a', '#f2711c'],
  violet: ['#a78bfa', '#6d3fe0'],
  teal: ['#2dd4bf', '#0d9488'],
  blue: ['#60a5fa', '#2563eb'],
  indigo: ['#818cf8', '#4338ca'],
  pink: ['#f472b6', '#db2777'],
  amber: ['#fbbf24', '#d97706'],
  emerald: ['#34d399', '#059669'],
  slate: ['#94a3b8', '#475569'],
};

const STATUS_DOT = {
  green: 'bg-emerald-500', emerald: 'bg-emerald-500',
  yellow: 'bg-amber-500', amber: 'bg-amber-500',
  red: 'bg-red-500', rose: 'bg-red-500',
};

const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function IconTile({ page, size = 48 }) {
  const [from, to] = TONES[page.tone] || TONES.slate;
  const Icon = page.icon;
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(145deg, ${from}, ${to})`,
        boxShadow: `0 8px 18px -8px ${to}`,
      }}
    >
      <Icon size={size * 0.46} strokeWidth={2} />
    </span>
  );
}

function PageCard({ page, onNavigate }) {
  const [from] = TONES[page.tone] || TONES.slate;
  return (
    <motion.button
      type="button"
      variants={item}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onNavigate(page.id)}
      className={`group relative overflow-hidden text-left rounded-3xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-5 cursor-pointer flex flex-col shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow duration-300 ${
        page.featured ? 'sm:col-span-2 min-h-[11rem]' : 'min-h-[11rem]'
      }`}
    >
      {/* brilho suave na cor do cartão */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-[0.10] group-hover:opacity-[0.18] transition-opacity duration-300 blur-2xl"
        style={{ background: from }}
      />

      <div className="relative flex items-start justify-between">
        <IconTile page={page} size={page.featured ? 56 : 48} />
        {page.badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
            {page.badge}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex-1">
        <h3 className={`font-semibold tracking-tight text-[color:var(--text)] ${page.featured ? 'text-xl' : 'text-[17px]'}`}>
          {page.name}
        </h3>
        <p className={`mt-1 text-[color:var(--text-2)] leading-snug ${page.featured ? 'text-sm max-w-md' : 'text-[13px]'}`}>
          {page.description}
        </p>
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        {page.shortcut ? (
          <kbd className="text-[11px] font-medium text-[color:var(--text-3)] font-sans">Alt + {page.shortcut}</kbd>
        ) : <span />}
        <span className="w-8 h-8 rounded-full bg-[color:var(--surface-2)] text-[color:var(--text-2)] flex items-center justify-center group-hover:bg-[color:var(--accent)] group-hover:text-white transition-colors duration-300">
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.button>
  );
}

export function Home({ onNavigate, operatorName }) {
  const [query, setQuery] = useState('');
  const [route, setRoute] = useState(null); // resumo da escala (somente leitura)
  const searchRef = useRef(null);

  // Resumo da escala do dia vindo do Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'techniciansList', 'current'),
      (snap) => {
        if (!snap.exists()) return setRoute({ empty: true });
        const d = snap.data();
        const count = (Array.isArray(d.moto) ? d.moto.length : 0) + (Array.isArray(d.car) ? d.car.length : 0);
        setRoute({
          count,
          updatedAt: d.updatedAt || null,
          statusText: d.statusText || 'NORMAL',
          statusColor: d.statusColor || 'green',
        });
      },
      () => setRoute({ error: true })
    );
    return () => unsub();
  }, []);

  // Digitar em qualquer lugar da Home leva para a busca; Ctrl+K também foca a busca
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const t = e.target;
      if (t.closest?.('input, textarea, select, [contenteditable="true"], .fixed')) return;
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const firstName = (operatorName || '').trim().split(/\s+/)[0];
  const todayRaw = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  const visible = useMemo(() => PAGES.filter((p) => p.id !== 'home'), []);
  const q = normalize(query.trim());
  const results = useMemo(
    () => (q ? visible.filter((p) => normalize(`${p.name} ${p.description}`).includes(q)) : []),
    [q, visible]
  );

  const routeInfo = (() => {
    if (!route) return { text: 'Carregando escala…', tone: 'muted' };
    if (route.error) return { text: 'Não foi possível ler a escala', tone: 'warn' };
    if (route.empty || !route.updatedAt) return { text: 'Escala não carregada', tone: 'warn', cta: 'Atualizar rota' };
    const d = new Date(route.updatedAt);
    const isToday = !isNaN(d) && d.toDateString() === new Date().toDateString();
    const hhmm = isNaN(d) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return isToday
      ? { text: `Escala de hoje · ${route.count} técnicos · atualizada às ${hhmm}`, tone: 'ok', dot: STATUS_DOT[route.statusColor] || 'bg-emerald-500', status: route.statusText }
      : { text: `Escala desatualizada · ${route.count} técnicos · última em ${d.toLocaleDateString('pt-BR')}`, tone: 'warn', cta: 'Atualizar rota' };
  })();

  return (
    <div className="w-full max-w-6xl mx-auto pb-16">
      {/* HERO */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pt-2 pb-8"
      >
        <p className="text-sm font-medium text-[color:var(--text-3)]">{today}</p>
        <h1 className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight text-[color:var(--text)] leading-[1.05]">
          {greeting()}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-[color:var(--text-2)]">O que você vai fazer agora?</p>

        <div className="mt-6 flex flex-col xl:flex-row xl:items-center gap-3">
          {/* BUSCA */}
          <div className="relative w-full xl:max-w-md shrink-0">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-3)] pointer-events-none" />
            <input
              ref={searchRef}
              data-home-search
              data-no-autofocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) onNavigate(results[0].id);
                if (e.key === 'Escape') setQuery('');
              }}
              placeholder="Buscar ferramenta… (Ctrl+K)"
              aria-label="Buscar ferramenta"
              className="w-full h-11 pl-11 pr-10 rounded-full bg-[color:var(--surface)] border border-[color:var(--hairline)] text-[15px] text-[color:var(--text)] placeholder:text-[color:var(--text-3)] shadow-[var(--card-shadow)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[color:var(--text-3)] hover:bg-[color:var(--hairline)] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* STATUS DA ESCALA */}
          <button
            type="button"
            onClick={() => onNavigate('atualizar_rota')}
            className={`group inline-flex items-center gap-2.5 h-11 pl-4 pr-3 rounded-full border text-[13px] font-medium cursor-pointer transition-colors min-w-0 self-start xl:self-auto max-w-full ${
              routeInfo.tone === 'warn'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/15'
                : 'bg-[color:var(--surface)] border-[color:var(--hairline)] text-[color:var(--text-2)] hover:text-[color:var(--text)]'
            }`}
          >
            {routeInfo.tone === 'warn'
              ? <UploadCloud size={15} />
              : <span className={`w-2 h-2 rounded-full ${routeInfo.dot || 'bg-slate-400'} ${routeInfo.dot ? 'animate-pulse' : ''}`} />}
            <span className="truncate">{routeInfo.text}</span>
            {routeInfo.status && routeInfo.status !== 'NORMAL' && (
              <span className="px-2 py-0.5 rounded-full bg-[color:var(--hairline)] text-[10px] font-bold uppercase tracking-wide">{routeInfo.status}</span>
            )}
            <span className="inline-flex items-center gap-0.5 text-[color:var(--accent)] font-semibold whitespace-nowrap shrink-0">
              {routeInfo.cta || 'Atualizar rota'}
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </motion.header>

      {/* RESULTADO DA BUSCA OU SEÇÕES */}
      {q ? (
        <section aria-live="polite">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--text)] mb-4">
            {results.length ? `${results.length} resultado${results.length > 1 ? 's' : ''}` : 'Nada encontrado'}
          </h2>
          {results.length === 0 ? (
            <p className="text-[color:var(--text-2)]">Nenhuma ferramenta corresponde a “{query}”.</p>
          ) : (
            <motion.div key={q} variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((p) => <PageCard key={p.id} page={{ ...p, featured: false }} onNavigate={onNavigate} />)}
            </motion.div>
          )}
        </section>
      ) : (
        <div className="space-y-12">
          {SECTIONS.filter((s) => s.id !== 'principal').map((section) => {
            const pages = visible.filter((p) => p.section === section.id);
            if (!pages.length) return null;
            return (
              <section key={section.id} aria-labelledby={`sec-${section.id}`}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 id={`sec-${section.id}`} className="text-2xl font-semibold tracking-tight text-[color:var(--text)]">
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <span className="hidden sm:block text-sm text-[color:var(--text-3)]">{section.subtitle}</span>
                  )}
                </div>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {pages.map((p) => <PageCard key={p.id} page={p} onNavigate={onNavigate} />)}
                </motion.div>
              </section>
            );
          })}
        </div>
      )}

      {/* DICAS DE ATALHO */}
      <footer className="mt-14 pt-6 border-t border-[color:var(--hairline)] flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[color:var(--text-3)]">
        <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Ctrl + Enter</kbd> copia o script</span>
        <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Ctrl + Shift + L</kbd> limpa o formulário</span>
        <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Alt + 1…0</kbd> troca de tela</span>
        <span><kbd className="font-sans font-semibold text-[color:var(--text-2)]">Ctrl + K</kbd> busca na Início</span>
      </footer>
    </div>
  );
}
