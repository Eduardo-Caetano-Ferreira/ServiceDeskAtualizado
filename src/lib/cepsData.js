import cepsCsvRaw from '../ceps.csv?raw';

export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const CITIES_CONFIG = [
  { key: 'TODAS', label: 'Todas as Cidades', shortLabel: 'Todas', color: 'slate' },
  { key: 'PERUIBE', label: 'Peruíbe', shortLabel: 'Peruíbe', color: 'emerald' },
  { key: 'ITANHAEM', label: 'Itanhaém', shortLabel: 'Itanhaém', color: 'blue' },
  { key: 'MONGAGUA', label: 'Mongaguá', shortLabel: 'Mongaguá', color: 'amber' },
  { key: 'PRAIA GRANDE', label: 'Praia Grande', shortLabel: 'Praia Grande', color: 'purple' },
];

let cachedData = null;

export function getCepsData() {
  if (cachedData) return cachedData;

  const lines = cepsCsvRaw.split('\n');
  const items = [];
  const counts = {
    TODAS: 0,
    PERUIBE: 0,
    ITANHAEM: 0,
    MONGAGUA: 0,
    'PRAIA GRANDE': 0,
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pular cabeçalhos duplicados no arquivo
    if (line.startsWith('CEP,') || line.includes('LOGRADOURO,BAIRRO,CIDADE')) {
      continue;
    }

    const parts = line.split(',');
    if (parts.length < 4) continue;

    const cep = parts[0].trim();
    const logradouro = parts[1].trim();
    const bairro = parts[2].trim();
    const rawCidade = parts[3].trim().toUpperCase();

    let cidadeKey;
    let cidadeDisplay;

    if (rawCidade === 'ITANHAEM') {
      cidadeKey = 'ITANHAEM';
      cidadeDisplay = 'Itanhaém';
    } else if (rawCidade === 'PERUIBE') {
      cidadeKey = 'PERUIBE';
      cidadeDisplay = 'Peruíbe';
    } else if (rawCidade === 'MONGAGUA') {
      cidadeKey = 'MONGAGUA';
      cidadeDisplay = 'Mongaguá';
    } else if (rawCidade === 'PRAIA GRANDE') {
      cidadeKey = 'PRAIA GRANDE';
      cidadeDisplay = 'Praia Grande';
    } else {
      continue;
    }

    counts[cidadeKey] = (counts[cidadeKey] || 0) + 1;
    counts.TODAS += 1;

    const cleanCep = cep.replace(/\D/g, '');
    const normalizedLogradouro = normalizeText(logradouro);
    const normalizedBairro = normalizeText(bairro);

    items.push({
      id: `${cleanCep}-${i}`,
      cep,
      cleanCep,
      logradouro,
      bairro,
      cidade: cidadeKey,
      cidadeDisplay,
      normalizedLogradouro,
      normalizedBairro,
      // Texto pré-composto para busca super rápida
      searchEndereco: `${normalizedLogradouro} ${normalizedBairro}`,
      searchFull: `${cleanCep} ${cep} ${normalizedLogradouro} ${normalizedBairro}`,
    });
  }

  cachedData = {
    items,
    counts,
    total: items.length,
  };

  return cachedData;
}
