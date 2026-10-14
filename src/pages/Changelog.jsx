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
    version: '1.3',
    releaseDate: '14 de Outubro de 2026',
    isLatest: true,
    highlight: 'Reformulação da Tela de Mudança de Endereço, novos switches interativos, máscara de telefone, novo logo de prancheta e favicon.',
    changes: [
      {
        type: 'melhoria',
        title: 'Remoção do Título da Página e Tag de Data',
        description: 'Cabeçalho e tag de data removidos na tela de Mudança de Endereço para ganho de espaço útil, permitindo foco imediato nos campos do atendimento.'
      },
      {
        type: 'melhoria',
        title: 'Ocultação de Campos Fixos (Solicitação e Taxa)',
        description: 'Os dados fixos (Solicitação: MUDANÇA DE ENDEREÇO e Taxa: ISENTO) foram ocultados da visão do operador, permanecendo gerados automaticamente no script final.'
      },
      {
        type: 'novo',
        title: 'Switch Obrigatório "Pode Adiantar?" (Sim/Não)',
        description: 'Campo transformado em switch de seleção Sim/Não, desmarcado por padrão e com validação obrigatória antes da cópia da máscara.'
      },
      {
        type: 'novo',
        title: 'Controle "Adicionar Observação?" Sim/Não',
        description: 'Novo toggle interativo para registrar observações e orientações repassadas pelo cliente (ex: ligar com antecedência, pontos de referência adicionais).'
      },
      {
        type: 'melhoria',
        title: 'Máscara de Telefone e Switch de Contato',
        description: 'Formatação automática para telefones fixos e celulares no campo de contato, acompanhado de switch de verificação se conseguiu contato (desmarcado por padrão e obrigatório).'
      },
      {
        type: 'melhoria',
        title: 'Switch em Autorização por Exceção',
        description: 'Substituição das opções por switch interativo com valor padrão em "Não", expandindo o campo de responsável apenas mediante seleção de "Sim".'
      },
      {
        type: 'design',
        title: 'Novo Logo de Prancheta e Favicon Técnico',
        description: 'Identidade visual renovada com logo vetorial de prancheta de ordens de serviço na paleta ETECC Telecom, atualizando o favicon e título do navegador.'
      }
    ]
  },
  {
    version: '1.2',
    releaseDate: '14 de Outubro de 2026',
    isLatest: false,
    highlight: 'Layout da tela de início com 100% de aproveitamento, teste de comunicação com a API do Gemini e modal de nome simplificado.',
    changes: [
      {
        type: 'melhoria',
        title: 'Layout 100% da Tela na Tela de Início',
        description: 'Removido o cabeçalho estático e redesenhado os painéis de escala e tabela de técnicos para ocupar toda a largura disponível no monitor sem barras de rolagem desnecessárias.'
      },
      {
        type: 'novo',
        title: 'Botão de Teste da API do Gemini e Status de Comunicação',
        description: 'Novo teste de conectividade direta com o Gemini no servidor, calculando tempo de resposta (ms) e modelo ativo com retorno imediato.'
      },
      {
        type: 'novo',
        title: 'Registro Persistente da Última Sincronização',
        description: 'Armazenamento do horário da última sincronização da escala e testes de IA no Firestore e LocalStorage, visível em tempo real no painel de controle.'
      },
      {
        type: 'melhoria',
        title: 'Aprimoramento dos Cartões da Tela Inicial',
        description: 'Novo design do card de upload com área de arrastar/soltar e suporte a Ctrl+V aprimorado, além de tabela de técnicos com ações rápidas de cópia e contadores dinâmicos.'
      },
      {
        type: 'melhoria',
        title: 'Modal de Identificação Focado e Direto',
        description: 'Removidas as sugestões pré-configuradas no modal de operador para um preenchimento mais limpo, ágil e focado.'
      }
    ]
  },
  {
    version: '1.1',
    releaseDate: '14 de Outubro de 2026',
    isLatest: false,
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
                  v1.3
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
            <span className="text-sm font-extrabold text-slate-800">1.3.0 Produção</span>
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
