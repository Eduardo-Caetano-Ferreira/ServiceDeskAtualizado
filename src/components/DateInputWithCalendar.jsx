import { useRef, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Normaliza qualquer formato de data colado ou digitado (Ex: 2026-08-05, 05-08-2026, 05082026, 05/08/2026)
 * para o formato legível no Brasil (DD/MM/AAAA).
 */
function formatToDisplayDate(val) {
  if (!val) return '';
  const trimmed = String(val).trim();

  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }

  // Formato separado por barra, ponto ou hífen
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    let [p1, p2, p3] = parts;
    if (p3.length === 4 && p1.length <= 2 && p2.length <= 2) {
      return `${p1.padStart(2, '0')}/${p2.padStart(2, '0')}/${p3}`;
    }
    if (p1.length === 4 && p2.length <= 2 && p3.length <= 2) {
      return `${p3.padStart(2, '0')}/${p2.padStart(2, '0')}/${p1}`;
    }
  }

  // 8 dígitos numéricos contínuos: DDMMAAAA (Ex: 05082026)
  if (/^\d{8}$/.test(trimmed)) {
    const d = trimmed.slice(0, 2);
    const m = trimmed.slice(2, 4);
    const y = trimmed.slice(4, 8);
    return `${d}/${m}/${y}`;
  }

  return trimmed;
}

/**
 * Tenta converter uma string DD/MM/AAAA em objeto Date
 */
function parseDateFromDisplay(val) {
  if (!val) return new Date();
  const parts = String(val).trim().split(/[/.-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date();
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function DateInputWithCalendar({
  name,
  value = '',
  onChange,
  className = '',
  placeholder = 'DD/MM/AAAA',
  id,
  required = false
}) {
  const containerRef = useRef(null);
  const [showPopover, setShowPopover] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateFromDisplay(value));

  // Fechar popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manipulador de colagem (Ctrl + V)
  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text');
    if (pastedText) {
      const normalized = formatToDisplayDate(pastedText);
      if (normalized) {
        e.preventDefault();
        onChange({
          target: {
            name,
            value: normalized,
            type: 'text'
          }
        });
      }
    }
  };

  const toggleCalendar = () => {
    setShowPopover((prev) => {
      const nextState = !prev;
      if (nextState) {
        setViewDate(parseDateFromDisplay(value));
      }
      return nextState;
    });
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const d = String(day).padStart(2, '0');
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const y = viewDate.getFullYear();
    const formatted = `${d}/${m}/${y}`;
    onChange({
      target: {
        name,
        value: formatted,
        type: 'text'
      }
    });
    setShowPopover(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const formatted = `${d}/${m}/${y}`;
    onChange({
      target: {
        name,
        value: formatted,
        type: 'text'
      }
    });
    setShowPopover(false);
  };

  // Cálculos do mês
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const today = new Date();
  const isTodayMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayDateNumber = today.getDate();

  // Verifica se o dia renderizado é o dia selecionado atualmente no campo
  const parsedValueDate = parseDateFromDisplay(value);
  const isSelectedMonth = value && parsedValueDate.getFullYear() === currentYear && parsedValueDate.getMonth() === currentMonth;
  const selectedDayNumber = value ? parsedValueDate.getDate() : null;

  return (
    <div ref={containerRef} className="relative flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        required={required}
        className={`${className} pr-10`}
      />

      {/* Botão com Ícone do Calendário */}
      <button
        type="button"
        onClick={toggleCalendar}
        title="Abrir calendário para escolher data"
        className="absolute right-2 p-1.5 text-slate-400 hover:text-primary active:text-primary cursor-pointer transition-colors rounded-md hover:bg-slate-200/60"
      >
        <CalendarIcon size={18} />
      </button>

      {/* Popover de Calendário */}
      {showPopover && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3 select-none animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Cabeçalho do Popover */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-sm text-slate-800">
              {MONTHS_PT[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 text-center mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Espaços vazios antes do primeiro dia */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = isSelectedMonth && selectedDayNumber === dayNum;
              const isCurrentDay = isTodayMonth && todayDateNumber === dayNum;

              let btnStyle = 'text-slate-700 hover:bg-slate-100';
              if (isSelected) {
                btnStyle = 'bg-primary text-white font-bold shadow-sm';
              } else if (isCurrentDay) {
                btnStyle = 'border border-primary text-primary font-semibold hover:bg-primary/10';
              }

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg transition-all text-xs ${btnStyle}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Rodapé com atalho "Hoje" */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-medium text-primary hover:underline px-1 py-0.5"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X size={14} /> Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
