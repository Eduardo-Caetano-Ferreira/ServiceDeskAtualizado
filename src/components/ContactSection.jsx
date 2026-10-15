import { Plus, Trash2, Check, User, Phone } from 'lucide-react';
import { formatPhone, createDefaultContact } from '../lib/phoneUtils';

/**
 * Componente unificado para gerenciamento de contatos com suporte a:
 * 1. Máscara com DDI +55 ou padrão nacional (XX)
 * 2. Adição de múltiplas linhas de contato (+)
 * 3. Seleção de qual número é o do Titular
 * 4. Campo de nome/identificação para contatos secundários (ex: Esposa, Filho)
 * 5. Switch obrigatório 'Conseguiu contato?' (Sim / Não)
 */
export function ContactSection({
  contatos = [],
  onChangeContatos,
  conseguiuContato = '',
  onChangeConseguiuContato,
  errorFields = [],
  showConseguiuContato = true,
  label = 'Contato *',
  disabled = false
}) {
  // Garante que haja ao menos um contato na lista
  const contactsList = Array.isArray(contatos) && contatos.length > 0 
    ? contatos 
    : [createDefaultContact('', true, '')];

  const handlePhoneChange = (id, rawValue) => {
    const formatted = formatPhone(rawValue);
    const updated = contactsList.map(c => {
      if (c.id === id) {
        return { ...c, numero: formatted };
      }
      return c;
    });
    onChangeContatos(updated);
  };

  const handleNomeChange = (id, nome) => {
    const updated = contactsList.map(c => {
      if (c.id === id) {
        return { ...c, nome };
      }
      return c;
    });
    onChangeContatos(updated);
  };

  const handleSetTitular = (id) => {
    const updated = contactsList.map(c => ({
      ...c,
      isTitular: c.id === id
    }));
    onChangeContatos(updated);
  };

  const handleAddContact = () => {
    // Novo contato adicionado por padrão não é titular se já existir um titular
    const hasTitular = contactsList.some(c => c.isTitular);
    const newContact = createDefaultContact('', !hasTitular, '');
    onChangeContatos([...contactsList, newContact]);
  };

  const handleRemoveContact = (id) => {
    if (contactsList.length <= 1) return;
    const remaining = contactsList.filter(c => c.id !== id);
    // Se removeu o titular, torna o primeiro restante como titular
    if (!remaining.some(c => c.isTitular) && remaining.length > 0) {
      remaining[0].isTitular = true;
    }
    onChangeContatos(remaining);
  };

  const hasContatoError = errorFields.includes('contato') || errorFields.includes('telefone');
  const hasConseguiuError = errorFields.includes('conseguiuContato');

  return (
    <div className="w-full">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone size={13} className="text-red-500" />
          <span>{label}</span>
          {contactsList.length > 1 && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded-full">
              {contactsList.length} números
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={handleAddContact}
          disabled={disabled}
          title="Adicionar outra linha de contato"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
        >
          <Plus size={13} className="stroke-[2.5]" />
          <span>Adicionar</span>
        </button>
      </div>

      {/* Lista de Linhas de Contato */}
      <div className="space-y-2">
        {contactsList.map((contact, index) => {
          const isFirst = index === 0;
          const isOnlyOne = contactsList.length === 1;
          const isNumberEmpty = !contact.numero || contact.numero.trim() === '';
          const showErrorThisRow = hasContatoError && isNumberEmpty && isFirst;

          return (
            <div
              key={contact.id || index}
              className={`p-2.5 rounded-xl border transition-all ${
                contact.isTitular
                  ? 'bg-slate-50/90 border-slate-300 shadow-2xs'
                  : 'bg-slate-50/50 border-dashed border-slate-300'
              } ${showErrorThisRow ? 'border-red-500 ring-1 ring-red-500 bg-red-50/40' : ''}`}
            >
              {/* Barra superior de identificação: Check Titular e Botão Excluir */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleSetTitular(contact.id)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                    contact.isTitular
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
                  }`}
                  title="Marcar este número como sendo do Titular"
                >
                  <Check size={12} className={contact.isTitular ? 'text-white stroke-[3]' : 'opacity-30'} />
                  <span>{contact.isTitular ? 'Titular' : 'Marcar como Titular'}</span>
                </button>

                {!isOnlyOne && (
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(contact.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remover esta linha de contato"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Input com Máscara Inteligente */}
              <div className="relative">
                <input
                  type="text"
                  value={contact.numero}
                  onChange={(e) => handlePhoneChange(contact.id, e.target.value)}
                  placeholder="+55 (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
                  disabled={disabled}
                  className={`w-full border text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${
                    showErrorThisRow
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50 animate-error'
                      : 'border-slate-300 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  }`}
                />
              </div>

              {/* Se não for titular, exibe campo para nome de quem é o número */}
              {!contact.isTitular && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <User size={12} />
                    </div>
                    <input
                      type="text"
                      value={contact.nome || ''}
                      onChange={(e) => handleNomeChange(contact.id, e.target.value)}
                      placeholder="Nome de quem é o número (ex: Esposa, Filho, Maria)"
                      disabled={disabled}
                      className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasContatoError && (
        <p className="text-[10px] font-bold text-red-600 mt-1">
          Informe ao menos um número de contato válido.
        </p>
      )}

      {/* Switch Conseguiu Contato (Sim / Não) */}
      {showConseguiuContato && onChangeConseguiuContato && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1.5 min-h-[24px]">
            <span className="block text-xs font-semibold text-slate-700">Conseguiu contato? *</span>
            {conseguiuContato && (
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                conseguiuContato === 'Sim' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              }`}>
                {conseguiuContato}
              </span>
            )}
          </div>
          
          <div className={`grid grid-cols-2 p-1 rounded-xl border transition-all h-[42px] items-center ${
            hasConseguiuError
              ? 'border-red-500 bg-red-50 ring-1 ring-red-500 animate-error'
              : 'border-slate-300 bg-slate-100'
          }`}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConseguiuContato('Sim')}
              className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                conseguiuContato === 'Sim'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Check size={13} className={conseguiuContato === 'Sim' ? 'text-white' : 'opacity-30'} />
              Sim
            </button>
            
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConseguiuContato('Não')}
              className={`h-full px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                conseguiuContato === 'Não'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className={`text-xs ${conseguiuContato === 'Não' ? 'text-white' : 'opacity-30'}`}>✕</span>
              Não
            </button>
          </div>

          {hasConseguiuError && (
            <p className="text-[10px] font-bold text-red-600 mt-1">
              Selecione Sim ou Não.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
