import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Building2, 
  Navigation, 
  Hash, 
  X,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { getCepsData, normalizeText, CITIES_CONFIG } from '../lib/cepsData';

export function ConsultaCeps() {
  const { items, counts, total } = useMemo(() => getCepsData(), []);

  // Cidade selecionada (default: 'TODAS' ou Peruíbe)
  const [selectedCity, setSelectedCity] = useState('TODAS');
  
  // Modo de pesquisa: 'endereco' ou 'cep'
  const [searchMode, setSearchMode] = useState('endereco'); // 'endereco' | 'cep'
  
  // Termo digitado
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quantidade de resultados visíveis para paginação suave
  const [displayLimit, setDisplayLimit] = useState(50);

  // Controle de cópia para feedback visual
  const [copiedId, setCopiedId] = useState(null);
  const [copiedType, setCopiedType] = useState(null); // 'cep' | 'endereco'
  const [toastMessage, setToastMessage] = useState(null);

  const handleCityChange = (cityKey) => {
    setSelectedCity(cityKey);
    setDisplayLimit(50);
  };

  const handleModeChange = (mode) => {
    setSearchMode(mode);
    setDisplayLimit(50);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setDisplayLimit(50);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDisplayLimit(50);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyToClipboard = (text, id, type, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    showToast(`${label} copiado para a área de transferência!`);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  // Filtragem ultra-rápida em tempo real
  const filteredResults = useMemo(() => {
    const term = normalizeText(searchTerm);
    const cleanNumbers = searchTerm.replace(/\D/g, '');

    return items.filter((item) => {
      // 1. Filtro por cidade
      if (selectedCity !== 'TODAS' && item.cidade !== selectedCity) {
        return false;
      }

      // Se não houver termo de busca, exibe os itens da cidade
      if (!term && !cleanNumbers) {
        return true;
      }

      // 2. Filtro de acordo com o modo selecionado
      if (searchMode === 'cep') {
        // Busca direta pelo número do CEP
        if (cleanNumbers) {
          return item.cleanCep.includes(cleanNumbers);
        }
        return item.cep.toLowerCase().includes(term);
      } else {
        // Modo Endereço: busca em logradouro e bairro
        return (
          item.normalizedLogradouro.includes(term) ||
          item.normalizedBairro.includes(term)
        );
      }
    });
  }, [items, selectedCity, searchMode, searchTerm]);

  // Lista limitada para manter a renderização ultra rápida (60fps)
  const visibleResults = useMemo(() => {
    return filteredResults.slice(0, displayLimit);
  }, [filteredResults, displayLimit]);

  const getCityBadgeColor = (cityKey) => {
    switch (cityKey) {
      case 'PERUIBE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ITANHAEM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MONGAGUA':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PRAIA GRANDE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* CARD PRINCIPAL NO TOPO: ESTATÍSTICAS E LOGRADOUROS REGISTRADOS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                <FileSpreadsheet size={13} className="text-red-400" />
                Base Local ceps.csv
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={13} />
                Sincronizado
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Consulta de CEPs & Logradouros</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Localize instantaneamente CEPs, ruas, avenidas e bairros das cidades de atuação com cópia direta para a área de transferência.
            </p>
          </div>

          {/* Contador em destaque */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl shadow-inner backdrop-blur-sm self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-rose-700 flex items-center justify-center text-white shadow-md">
              <Building2 size={24} />
            </div>
            <div>
              <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider">
                Logradouros Registrados
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">
                  {total.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs text-slate-400">no ceps.csv</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown de logradouros por cidade */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CITIES_CONFIG.filter(c => c.key !== 'TODAS').map((city) => {
            const count = counts[city.key] || 0;
            const isSelected = selectedCity === city.key;

            return (
              <button
                key={city.key}
                type="button"
                onClick={() => handleCityChange(city.key)}
                className={`p-3 rounded-xl border transition-all text-left group flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'bg-white/10 border-white/40 ring-2 ring-primary/60 shadow-md' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                    {city.label}
                  </span>
                  <MapPin size={13} className={isSelected ? 'text-primary' : 'text-slate-500'} />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-white">
                    {count.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-slate-400">ruas</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ÁREA DE CONTROLES E BUSCA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-5">
        
        {/* LINHA 1: SELETOR DE CIDADE E SELETOR DE MODO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Seletor de Cidade */}
          <div className="lg:col-span-7 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 size={14} className="text-primary" />
              Selecione a Cidade
            </label>
            <div className="flex flex-wrap gap-2">
              {CITIES_CONFIG.map((c) => {
                const isSelected = selectedCity === c.key;
                const count = counts[c.key] || 0;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleCityChange(c.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count.toLocaleString('pt-BR')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Modo: Pesquisar por CEP ou Endereço */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              Pesquisar Por
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleModeChange('endereco')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  searchMode === 'endereco'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Navigation size={14} className={searchMode === 'endereco' ? 'text-primary' : 'text-slate-400'} />
                <span>Endereço (Rua/Bairro)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('cep')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  searchMode === 'cep'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash size={14} className={searchMode === 'cep' ? 'text-primary' : 'text-slate-400'} />
                <span>CEP</span>
              </button>
            </div>
          </div>
        </div>

        {/* LINHA 2: CAMPO DE BUSCA EM TEMPO REAL */}
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} className={searchTerm ? 'text-primary' : 'text-slate-400'} />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                searchMode === 'cep'
                  ? "Digite o número do CEP (ex: 11742-628 ou 11742)..."
                  : "Digite o nome da rua, avenida ou bairro (ex: Abel Caniçais, Gaivota, Savoy)..."
              }
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
            <span>
              {searchTerm ? (
                <>
                  Encontrados <strong className="text-slate-900 font-bold">{filteredResults.length.toLocaleString('pt-BR')}</strong> logradouro(s)
                  {selectedCity !== 'TODAS' && ` em ${CITIES_CONFIG.find(c => c.key === selectedCity)?.label}`}
                </>
              ) : (
                <>
                  Mostrando logradouros de{' '}
                  <strong className="text-slate-900 font-bold">
                    {selectedCity === 'TODAS' ? 'todas as cidades' : CITIES_CONFIG.find(c => c.key === selectedCity)?.label}
                  </strong>{' '}
                  ({filteredResults.length.toLocaleString('pt-BR')} registros)
                </>
              )}
            </span>

            {filteredResults.length > visibleResults.length && (
              <span className="text-slate-400">
                Exibindo primeiros {visibleResults.length} de {filteredResults.length.toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE RESULTADOS EM TEMPO REAL */}
      <div className="space-y-3">
        {visibleResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {visibleResults.map((item) => {
              const fullAddress = `${item.logradouro}, ${item.bairro}, ${item.cidadeDisplay} - SP - CEP ${item.cep}`;
              const isCopiedCep = copiedId === item.id && copiedType === 'cep';
              const isCopiedAddr = copiedId === item.id && copiedType === 'endereco';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Informações do Logradouro */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* CEP em destaque */}
                      <span className="font-mono text-sm font-extrabold bg-slate-900 text-white px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                        {item.cep}
                      </span>

                      {/* Cidade */}
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCityBadgeColor(item.cidade)}`}>
                        {item.cidadeDisplay}
                      </span>

                      {/* Bairro */}
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                        {item.bairro}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 break-words group-hover:text-primary transition-colors">
                      {item.logradouro}
                    </h3>
                  </div>

                  {/* Botões de Ação ao Lado */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Botão Copiar CEP */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.cep, item.id, 'cep', `CEP ${item.cep}`)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isCopiedCep
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                      title="Copiar apenas o CEP"
                    >
                      {isCopiedCep ? <Check size={14} /> : <Hash size={14} className="text-slate-500" />}
                      <span>{isCopiedCep ? 'Copiado!' : 'Copiar CEP'}</span>
                    </button>

                    {/* Botão Copiar Endereço Completo */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fullAddress, item.id, 'endereco', 'Endereço completo')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isCopiedAddr
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-primary hover:bg-primary/90 text-white border-primary/90'
                      }`}
                      title="Copiar endereço completo"
                    >
                      {isCopiedAddr ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopiedAddr ? 'Copiado!' : 'Copiar Endereço'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                Nenhum logradouro encontrado
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Não encontramos correspondências para <span className="font-semibold text-slate-700">"{searchTerm}"</span>{' '}
                {selectedCity !== 'TODAS' && `na cidade de ${CITIES_CONFIG.find(c => c.key === selectedCity)?.label}`}.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Limpar Busca
              </button>
              {selectedCity !== 'TODAS' && (
                <button
                  type="button"
                  onClick={() => handleCityChange('TODAS')}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition cursor-pointer"
                >
                  Buscar em Todas as Cidades
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botão para carregar mais resultados quando houver muitos */}
        {filteredResults.length > visibleResults.length && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:border-slate-400"
            >
              Carregar mais 50 logradouros (Restam {filteredResults.length - visibleResults.length})
            </button>
          </div>
        )}
      </div>

      {/* TOAST DE FEEDBACK DE CÓPIA */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check size={14} />
            </div>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
