import { Check } from 'lucide-react';

const OPTIONS = [
  {
    label: 'Comodato',
    active: 'bg-emerald-600 text-white border-emerald-700 ring-1 ring-emerald-400',
    inactive: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
  },
  {
    label: 'Compra',
    active: 'bg-blue-600 text-white border-blue-700 ring-1 ring-blue-400',
    inactive: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
  },
  {
    label: 'Smart-Pré',
    active: 'bg-red-600 text-white border-red-700 ring-1 ring-red-400',
    inactive: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
  }
];

/**
 * Seletor compacto (3 botões lado a lado) para Roteador/ONU.
 * `extra` permite acrescentar um atalho ao lado do rótulo (ex.: "Igual ao roteador").
 */
export function HardwareSegment({ label, value, onSelect, hasError, extra }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="block text-sm font-semibold text-slate-600">{label} *</span>
        {extra}
      </div>
      <div
        role="group"
        aria-label={label}
        className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-xl border transition-all ${
          hasError
            ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500 animate-error'
            : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(opt.label)}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                selected ? opt.active : opt.inactive
              }`}
            >
              {selected && <Check size={12} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
