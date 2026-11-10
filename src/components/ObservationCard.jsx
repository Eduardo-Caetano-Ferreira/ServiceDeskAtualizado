import { AlertTriangle } from 'lucide-react';

/**
 * Campo "Observação" das ordens de serviço, em destaque no topo do formulário.
 * O texto sai destacado no início do script copiado.
 */
export function ObservationCard({ value, onChange }) {
  return (
    <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <label htmlFor="observacao" className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} />
          Observação
          <span className="font-normal text-xs opacity-80">(opcional)</span>
        </label>
        <span className="hidden sm:block text-[11px] text-amber-700/80 dark:text-amber-300/80">
          Sai destacada no topo do script
        </span>
      </div>
      <textarea
        id="observacao"
        name="observacao"
        value={value || ''}
        onChange={onChange}
        rows="2"
        placeholder="Alguma informação importante que o técnico/logística precisa ver primeiro…"
        className="w-full resize-none rounded-lg border border-amber-300/70 bg-white/80 px-3 py-2.5 text-sm text-slate-800 focus:outline-none"
      />
    </div>
  );
}
