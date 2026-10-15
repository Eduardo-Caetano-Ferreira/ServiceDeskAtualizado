// Utilitários de formatação e manipulação de contatos e telefones

/**
 * Formata telefone com máscara automática inteligente:
 * - Se identificar DDI 55 (+55, 55 13..., 55139..., etc.):
 *   +55 (XX) XXXXX-XXXX (celular 9 dígitos) ou +55 (XX) XXXX-XXXX (fixo 8 dígitos)
 * - Padrão nacional sem 55:
 *   (XX) XXXXX-XXXX (celular 9 dígitos) ou (XX) XXXX-XXXX (fixo 8 dígitos)
 */
export const formatPhone = (value) => {
  if (!value) return '';
  const trimmed = value.toString().trim();
  const rawDigits = value.toString().replace(/\D/g, '');

  // Identifica se o número começa com 55 (DDI do Brasil)
  // Casos:
  // 1. Inicia com '+' ou '+55'
  // 2. Inicia com '55' seguido de espaço, traço, ponto ou parênteses
  // 3. String de dígitos começa com '55' e possui 12 ou 13 dígitos no total
  const isDDI55 = 
    trimmed.startsWith('+55') || 
    trimmed.startsWith('+') || 
    /^55[\s\-.()]/.test(trimmed) || 
    (rawDigits.startsWith('55') && rawDigits.length >= 12);

  if (isDDI55) {
    let digits = rawDigits;
    if (digits.startsWith('55')) {
      digits = digits.slice(2);
    }
    // DDD (2 dígitos) + número (até 9 dígitos) = até 11 dígitos
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '+55 ';
    if (digits.length <= 2) return `+55 (${digits}`;
    if (digits.length <= 6) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  // Padrão nacional convencional sem DDI (DDD + número)
  const digits = rawDigits.slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Cria um objeto de contato padrão
 */
export const createDefaultContact = (numero = '', isTitular = true, nome = '') => ({
  id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  numero: formatPhone(numero),
  isTitular: Boolean(isTitular),
  nome: nome || ''
});

/**
 * Normaliza os contatos carregados do localStorage ou estado anterior
 */
export const normalizeContacts = (savedContatos, fallbackString = '') => {
  if (Array.isArray(savedContatos) && savedContatos.length > 0) {
    return savedContatos.map((c, idx) => ({
      id: c.id || `c_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      numero: formatPhone(c.numero || ''),
      isTitular: c.isTitular !== undefined ? c.isTitular : idx === 0,
      nome: c.nome || ''
    }));
  }

  if (fallbackString && fallbackString.trim()) {
    return [createDefaultContact(fallbackString, true, '')];
  }

  return [createDefaultContact('', true, '')];
};

/**
 * Formata lista de contatos para o Script final da O.S / Atendimento
 */
export const formatContactsForScript = (contatos) => {
  if (!Array.isArray(contatos) || contatos.length === 0) {
    return '';
  }

  const valid = contatos.filter(c => c && c.numero && c.numero.trim() !== '');
  if (valid.length === 0) return '';

  return valid.map(c => {
    const num = c.numero.trim();
    if (c.isTitular) {
      return `${num} (Titular${c.nome && c.nome.trim() ? ` - ${c.nome.trim()}` : ''})`;
    }
    const rotulo = c.nome && c.nome.trim() ? c.nome.trim() : 'Recado';
    return `${num} (${rotulo})`;
  }).join(' / ');
};
