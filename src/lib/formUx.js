import { useEffect, useRef } from 'react';

// Utilitários compartilhados para reduzir o tempo de preenchimento dos formulários.

// ---------- Datas ----------
const pad2 = (n) => String(n).padStart(2, '0');

/** Retorna a data de hoje + `days` dias no formato DD/MM/AAAA. */
export const formatDateOffset = (days = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ---------- Normalizadores de campo (usar no onBlur) ----------

/**
 * "Cliente desde": aceita 2020, 012020, 1/2020, 01-2020, 01/20 e datas completas.
 * Devolve MM/AAAA, AAAA ou a data completa. Se não reconhecer, devolve o texto original.
 */
export const normalizeClienteDesde = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';
  let m;
  if (/^\d{4}$/.test(v)) return v; // só o ano
  if ((m = v.match(/^(\d{2})(\d{4})$/))) return validMonth(m[1]) ? `${m[1]}/${m[2]}` : v;
  if ((m = v.match(/^(\d{1,2})[/\-. ](\d{4})$/))) return validMonth(m[1]) ? `${pad2(m[1])}/${m[2]}` : v;
  if ((m = v.match(/^(\d{1,2})[/\-. ](\d{2})$/))) return validMonth(m[1]) ? `${pad2(m[1])}/20${m[2]}` : v;
  if ((m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/))) return `${pad2(m[1])}/${pad2(m[2])}/${m[3]}`;
  return v;
};

const validMonth = (mm) => Number(mm) >= 1 && Number(mm) <= 12;

/** Horário: aceita 1630, 16h30, 16h, 930, 9 -> HH:MM. Se inválido, devolve o original. */
export const normalizeTime = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return '';
  let h;
  let min = '00';
  let m;
  if ((m = v.match(/^(\d{1,2})\s*(?:h|:)\s*(\d{1,2})?$/))) {
    h = m[1];
    min = m[2] ? m[2].padStart(2, '0') : '00';
  } else if ((m = v.match(/^(\d{1,2})(\d{2})$/))) {
    h = m[1];
    min = m[2];
  } else if ((m = v.match(/^(\d{1,2})$/))) {
    h = m[1];
  } else {
    return String(value).trim();
  }
  if (Number(h) > 23 || Number(min) > 59) return String(value).trim();
  return `${pad2(h)}:${min}`;
};

// ---------- "Colar e preencher" ----------

/**
 * Extrai campos conhecidos de um texto colado (CRM / chat).
 * Só devolve o que for encontrado com segurança; o operador confere o resultado.
 */
export const parseQuickPaste = (text) => {
  const out = {};
  const src = String(text || '');
  if (!src.trim()) return out;

  // Telefones brasileiros (com ou sem DDI/máscara)
  const phoneRe = /(?:\+?55[\s-]*)?\(?\b\d{2}\)?[\s-]*9?\d{4}[\s-]?\d{4}\b/g;
  const phones = [...new Set((src.match(phoneRe) || []).map((p) => p.trim()))];
  if (phones.length) out.phones = phones;

  const desde = src.match(/cliente\s+desde\s*[:-]?\s*([^\n]+)/i);
  if (desde) out.clienteDesde = normalizeClienteDesde(desde[1].trim());

  const dbm = src.match(/(-\s?\d{1,2}(?:[.,]\d+)?)\s*dbm/i);
  if (/\blos\b/i.test(src)) out.sinalStatus = 'LOS';
  else if (/sem\s+energia/i.test(src)) out.sinalStatus = 'Sem energia';
  else if (dbm) {
    const num = dbm[1].replace(/\s/g, '').replace(',', '.');
    const state = /\boffline\b/i.test(src) ? 'Offline' : 'Online';
    out.sinalStatus = `${num}dBm / ${state}`;
  }

  const hw = (label) => {
    const m = src.match(new RegExp(`${label}\\s*[:\\-]?\\s*(comodato|compra|smart[\\s-]?pr[eé])`, 'i'));
    if (!m) return undefined;
    const v = m[1].toLowerCase();
    return v.startsWith('smart') ? 'Smart-Pré' : v === 'compra' ? 'Compra' : 'Comodato';
  };
  const roteador = hw('roteador');
  const onu = hw('onu');
  if (roteador) out.roteador = roteador;
  if (onu) out.onu = onu;

  const motivo = src.match(/(?:solicita[cç][aã]o|motivo)\s*[:-]?\s*([\s\S]+?)(?:\n\s*\n|$)/i);
  if (motivo && motivo[1].trim()) out.solicitacao = motivo[1].trim();

  return out;
};

// ---------- Rótulos amigáveis para a mensagem "Faltam: ..." ----------
const FIELD_LABELS = {
  dataAgendamento: 'Data de Agendamento',
  periodo: 'Período',
  horarioApos: 'Horário',
  roteador: 'Roteador',
  onu: 'ONU',
  contato: 'Contato',
  conseguiuContato: 'Conseguiu contato',
  clienteDesde: 'Cliente desde',
  solicitacao: 'Solicitação',
  sinalStatus: 'Sinal/Status',
  tipoOSRecente: 'Tipo da última O.S.',
  dataOSRecente: 'Data da última O.S.',
  encerramentoOSRecente: 'Encerramento da última O.S.',
  nomeAtendente: 'Atendente',
  nomeAutorizou: 'Quem autorizou',
  avaliacaoAtendimento: 'Avaliação do atendimento',
  baixaAvaliacao: 'Motivo da baixa avaliação',
  cienteCusto: 'Ciente do custo',
  comprovante: 'Comprovante',
  conexaoEstabilidade: 'Conexão/Estabilidade',
  descricao: 'Descrição',
  dispositivoTV: 'Dispositivo da TV',
  enderecoAtual: 'Endereço atual',
  equipamentoTV: 'Equipamento da TV',
  eteccResolve: 'Etecc resolve',
  indicacaoOutroTexto: 'Indicação (outro)',
  motivoIsencao: 'Motivo da isenção',
  motivoOutroTexto: 'Motivo (outro)',
  nomeCliente: 'Nome do cliente',
  novoEndereco: 'Novo endereço',
  observacaoCliente: 'Observação do cliente',
  onuPrincipal: 'ONU principal',
  planoAtual: 'Plano atual',
  podeAdiantar: 'Pode adiantar',
  pontoAdicional: 'Ponto adicional',
  refNovoEndereco: 'Referência do novo endereço',
  relatoInicial: 'Relato inicial',
  respostaIndicacao: 'Resposta de indicação',
  roteadorPrincipal: 'Roteador principal',
  sinalFibra: 'Sinal da fibra',
  sintoniaRealizada: 'Sintonia realizada',
  telefone: 'Telefone',
  tipoRoteador: 'Tipo de roteador',
  valorCusto: 'Valor do custo',
  vencimentoCusto: 'Vencimento do custo',
};

const prettify = (field) =>
  field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

export const labelFor = (field) => FIELD_LABELS[field] || prettify(field);

// ---------- Hooks ----------

/**
 * Persiste `value` no localStorage com debounce (evita gravar a cada tecla).
 * Grava imediatamente ao desmontar, para não perder o que foi digitado.
 */
export function useDebouncedStorage(key, value, delay = 300) {
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });

  const write = () => {
    try {
      localStorage.setItem(key, JSON.stringify(latest.current));
    } catch {
      /* quota cheia ou storage indisponível: ignora */
    }
  };

  useEffect(() => {
    const t = setTimeout(write, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key, delay]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => write(), []);
}

/**
 * Quando o operador tenta copiar o script (clique no botão `data-action="copy-script"`,
 * inclusive via Ctrl+Enter) e há campos inválidos: mostra "Faltam: ..." e rola/foca
 * o primeiro campo destacado. Não dispara enquanto o operador só está digitando.
 */
export function useFocusFirstError(errorFields, showToast) {
  const errorsRef = useRef(errorFields);
  const toastRef = useRef(showToast);
  useEffect(() => {
    errorsRef.current = errorFields;
    toastRef.current = showToast;
  });

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest?.('[data-action="copy-script"]')) return;
      // espera o setState da validação ser aplicado
      setTimeout(() => {
        const errors = errorsRef.current;
        if (!errors || errors.length === 0) return;

        const labels = errors.map(labelFor);
        const shown = labels.slice(0, 4).join(', ');
        const extra = labels.length > 4 ? ` +${labels.length - 4}` : '';
        toastRef.current?.(`Faltam: ${shown}${extra}`, 'error');

        const el = document.querySelector('main .animate-error');
        if (!el) return;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const focusable = el.matches('input, textarea, select, button')
          ? el
          : el.querySelector('input, textarea, select, button');
        focusable?.focus({ preventScroll: true });
      }, 80);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

// ---------- Observação destacada no topo dos scripts de O.S. ----------

/**
 * Bloco de observação para o INÍCIO do script (vazio se não houver texto).
 * Em texto puro (sem emojis) para colar em qualquer campo do CRM.
 */
export const formatObservation = (text) => {
  const t = String(text || '').trim();
  if (!t) return '';
  return `!!! OBSERVAÇÃO !!!\n${t}\n!!!!!!!!!!!!!!!!!!\n\n`;
};
