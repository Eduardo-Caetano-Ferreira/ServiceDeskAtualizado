import { motion } from 'framer-motion';
import { 
  History, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Zap
} from 'lucide-react';

const changelogData = [
  {
    version: '1.1',
    releaseDate: '14 de Outubro de 2026',
    isLatest: true,
    highlight: 'Início do versionamento oficial, novo menu retrátil, identidade ETECC Telecom e perfil de operador.',
    changes: [
      {
        type: 'novo',
        title: 'Espaço para Logo ETECC Telecom',
        description: 'Adicionada área reservada no topo do menu lateral para a logo oficial da empresa na pasta public, com fallback vetorial responsivo.'
      },
      {
        type: 'novo',
        title: 'Barra Lateral Retrátil (Recolher/Expandir)',
        description: 'Novo controle para recolher a barra lateral com um clique, liberando mais espaço útil de tela para visualização e preenchimento das ordens de serviço.'
      },
      {
        type: 'melhoria',
        title: 'Remoção do Menu Inferior',
        description: 'Removida a opção de transitar a barra para o rodapé, padronizando a navegação em uma barra lateral limpa, consistente e moderna.'
      },
      {
        type: 'novo',
        title: 'Identificação do Operador no Primeiro Acesso',
        description: 'Modal de boas-vindas que solicita o nome do operador ao entrar no sistema. O nome fica fixado no rodapé do menu lateral e preenche automaticamente todos os formulários e scripts.'
      },
      {
        type: 'melhoria',
        title: 'Perfil do Operador no Rodapé da Navegação',
        description: 'Card de identificação do atendente na barra lateral com avatar gerado por iniciais, exibição do status ativo e atalho para alterar o nome a qualquer momento.'
      },
      {
        type: 'novo',
        title: 'Central de Changelog e Versionamento',
        description: 'Nova página dedicada no menu para que toda a equipe técnica e de atendimento acompanhe as melhorias e novidades de cada versão do sistema.'
      }
    ]
  },
  {
    version: '1.0',
    releaseDate: 'Outubro de 2026',
    highlight: 'Lançamento da plataforma ServiceDesk com geradores de OS e leitor inteligente de escalas.',
    changes: [
      {
        type: 'novo',
        title: 'Extração Automática de Escalas com IA Gemini',
        description: 'Leitura de tabelas e fotos de escalas com IA multimodal, separando automaticamente os técnicos em rotas de Moto e Carro com região e observações.'
      },
      {
        type: 'novo',
        title: 'Geradores Especializados de Ordens de Serviço',
        description: 'Módulos para OS Geral, Mudança de Endereço, Mudança de Cômodo, Ponto Adicional, Reparo de TV e Script de Feedback.'
      },
      {
        type: 'novo',
        title: 'Tabela de Técnicos da Região em Tempo Real',
        description: 'Widget de rota sincronizado via Firebase Firestore para acompanhamento de técnicos e status de operação (Normal, Atenção, Chuva).'
      },
      {
        type: 'melhoria',
        title: 'Cópia Instantânea e Validação de Formulários',
        description: 'Formatação padronizada para colar nos sistemas de gestão, com verificação de campos obrigatórios e animação de destaque em caso de pendências.'
      },
      {
        type: 'seguranca',
        title: 'Armazenamento Local Contínuo',
        description: 'Prevenção de perda de dados acidental salvando rascunhos automaticamente no navegador do usuário.'
      }
    ]
  }
];

const badgeColors = {
  novo: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  melhoria: 'bg-blue-100 text-blue-800 border-blue-300',
  design: 'bg-purple-100 text-purple-800 border-purple-300',
  seguranca: 'bg-amber-100 text-amber-800 border-amber-300'
};

const badgeLabels = {
  novo: 'Novo',
  melhoria: 'Melhoria',
  design: 'Interface',
  seguranca: 'Segurança'
};

export function Changelog() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-6"
    >
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2.5 rounded-xl text-red-600">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                  Histórico de Versões
                </h1>
                <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                  v1.1
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Acompanhe as atualizações, novos recursos e melhorias contínuas do ServiceDesk ETECC Telecom.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
          <div className="text-right px-2">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Versão Atual</span>
            <span className="text-sm font-extrabold text-slate-800">1.1.0 Produção</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-6">
        {changelogData.map((release) => (
          <div 
            key={release.version}
            className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
              release.isLatest ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200'
            }`}
          >
            {/* Version Header */}
            <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              release.isLatest ? 'bg-gradient-to-r from-red-50/70 to-slate-50 border-red-200' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-800">
                    Versão {release.version}
                  </span>
                  {release.isLatest && (
                    <span className="text-[11px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Sparkles size={12} />
                      Versão Atual
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  {release.releaseDate}
                </span>
              </div>

              <div className="text-xs font-medium text-slate-600 italic">
                {release.highlight}
              </div>
            </div>

            {/* Changes list */}
            <div className="p-5 sm:p-6 divide-y divide-slate-100 space-y-4">
              {release.changes.map((item, index) => (
                <div key={index} className={`pt-4 first:pt-0 flex items-start gap-3.5`}>
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className={`w-5 h-5 ${
                      item.type === 'novo' ? 'text-emerald-500' : 
                      item.type === 'melhoria' ? 'text-blue-500' : 
                      item.type === 'design' ? 'text-purple-500' : 'text-amber-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        {item.title}
                      </h3>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badgeColors[item.type]}`}>
                        {badgeLabels[item.type]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
