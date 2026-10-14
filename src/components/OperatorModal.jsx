import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, User, ArrowRight } from 'lucide-react';

export function OperatorModal({ isOpen, onClose, currentName, onSaveName }) {
  const [name, setName] = useState(currentName || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Por favor, informe seu nome para continuar.');
      return;
    }
    if (cleanName.length < 2) {
      setError('O nome deve conter pelo menos 2 caracteres.');
      return;
    }
    onSaveName(cleanName);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/20">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-200 bg-red-900/40 px-3 py-0.5 rounded-full mb-1">
                ServiceDesk ETECC Telecom
              </span>
              <h2 className="text-xl font-black tracking-tight">
                Identificação do Atendente
              </h2>
              <p className="text-xs text-red-100 mt-1 max-w-xs">
                Informe seu nome para personalizar a barra lateral e preencher automaticamente todas as Ordens de Serviço.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-red-600" />
                Nome do Operador / Atendente
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: Matheus Santos"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold transition-all focus:outline-none ${
                  error
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20 text-slate-800'
                    : 'border-slate-300 bg-slate-50 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20 text-slate-800'
                }`}
              />
              {error && (
                <p className="text-xs font-semibold text-red-600 mt-1.5">
                  {error}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {currentName && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Confirmar e Salvar Nome</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
