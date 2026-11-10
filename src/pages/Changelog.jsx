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
    version: '2.1.1',
    releaseDate: '10 de Novembro de 2026',
    isLatest: true,
    highlight: 'Observação movida para dentro da seção de detalhes de cada O.S. e remoção do "Colar e preencher".',
    changes: [
      {
        type: 'melhoria',
        title: 'Observação dentro da seção de detalhes',
        description: 'O campo deixou o topo da página e agora fica na seção de detalhes de cada O.S. (Detalhes da O.S., Agendamento & Detalhes, Detalhes e Custo, Informações da O.S. e Detalhes do Reparo), mantendo o destaque em amarelo. No script copiado, a observação continua saindo destacada no início.'
      },
      {
        type: 'melhoria',
        title: 'Colar e preencher removido',
        description: 'O painel "Colar e preencher" da OS Geral foi retirado, simplificando a tela.'
      },
      {
        type: 'melhoria',
        title: 'Versão completa na interface',
        description: 'A versão exibida no menu lateral passou a mostrar também o número de correção (ex.: 2.1.1).'
      }
    ]
  },
  {
    version: '2.1',
    releaseDate: '10 de Novembro de 2026',
    isLatest: false,
    highlight: 'Campo de Observação em todas as ordens de serviço (destacado no topo do formulário e do script), novo favicon e ajustes visuais.',
    changes: [
      {
        type: 'novo',
        title: 'Campo Observação nas ordens de serviço',
        description: 'OS Geral, Mudança de Endereço, Mudança de Cômodo, Ponto Adicional e Reparo TV ganharam um campo opcional de Observação em destaque no topo da tela. Quando preenchido, o texto sai destacado no início do script copiado, antes de todas as demais informações.'
      },
      {
        type: 'melhoria',
        title: 'Novo favicon',
        description: 'O ícone da aba do navegador agora é o mesmo da barra de navegação: logo branco sobre fundo vermelho, em quadrado de cantos arredondados. Também foi incluído o ícone para atalhos em dispositivos Apple.'
      },
      {
        type: 'melhoria',
        title: 'Barra de navegação sem tags "Novo"',
        description: 'As etiquetas de novidade foram removidas do menu lateral para um visual mais limpo.'
      },
      {
        type: 'correcao',
        title: 'Painel Técnicos da Região no Modo Escuro',
        description: 'O fundo das tabelas de técnicos e regiões ficava cinza claro no tema escuro. Agora segue as cores do Modo Escuro Suave, incluindo o destaque ao passar o mouse nas linhas.'
      }
    ]
  },
  {
    version: '2.0',
    releaseDate: '10 de Novembro de 2026',
    isLatest: false,
    highlight: 'Novo visual inspirado nos produtos Apple e nova tela Início com cartões para acessar cada ferramenta. A atualização da rota saiu da Início e ganhou página própria.',
    changes: [
      {
        type: 'novo',
        title: 'Nova tela Início com cartões',
        description: 'Saudação personalizada, busca de ferramentas (Ctrl+K) e cartões organizados por seção: Ordens de Serviço, Comunicação & Encerramento e Ferramentas. Cada cartão mostra ícone, descrição, atalho de teclado e selo de novidade.'
      },
      {
        type: 'novo',
        title: 'Resumo da escala na Início',
        description: 'Uma linha informa quantos técnicos estão na escala, o horário da última atualização e o status da rota. Se a escala estiver desatualizada, o aviso leva direto para Atualizar Rota.'
      },
      {
        type: 'melhoria',
        title: 'Atualizar Rota em página própria',
        description: 'O envio da imagem da escala e a lista de técnicos deixaram a tela inicial e agora ficam em Ferramentas > Atualizar Rota (atalho Alt+R).'
      },
      {
        type: 'melhoria',
        title: 'Novo visual em todo o sistema',
        description: 'Fundo claro suave, cantos mais arredondados, sombras em camadas, fonte do sistema (SF Pro nos dispositivos Apple, Inter nos demais) e foco com realce suave. O Modo Escuro Suave foi mantido com as mesmas cores nos novos componentes.'
      },
      {
        type: 'melhoria',
        title: 'Barra lateral translúcida e cabeçalho fixo',
        description: 'Menu lateral com efeito de vidro, item ativo em tom suave e versão exibida automaticamente a partir do projeto. As telas internas ganharam cabeçalho fixo com botão para voltar à Início e dicas de atalho.'
      },
      {
        type: 'melhoria',
        title: 'Atalhos Alt reorganizados',
        description: 'Alt+1 Início, 2 OS Geral, 3 Mudança de Endereço, 4 Mudança de Cômodo, 5 Ponto Adicional, 6 Reparo TV, 7 Encerramento, 8 Scripts de Chat, 9 Feedback, 0 Consulta CEPs e R Atualizar Rota. Ctrl+K abre a busca da Início.'
      },
      {
        type: 'melhoria',
        title: 'Data de agendamento mais limpa',
        description: 'Na OS Geral, os atalhos Hoje, Amanhã e +2 dias viraram chips abaixo do campo de data.'
      }
    ]
  },
  {
    version: '1.9',
    releaseDate: '10 de Novembro de 2026',
    isLatest: false,
    highlight: 'Preenchimento mais rápido: atalhos de teclado, foco automático, "Colar e preencher", normalização de campos e revisão editável da escala lida pela IA.',
    changes: [
      {
        type: 'novo',
        title: 'Atalhos de teclado',
        description: 'Ctrl+Enter valida e copia o script da tela atual, Ctrl+Shift+L abre a confirmação de limpeza e Alt+1…9/0 troca de tela na ordem do menu lateral.'
      },
      {
        type: 'novo',
        title: 'Colar e preencher (OS Geral)',
        description: 'Cole o texto do CRM ou chat e o sistema preenche telefone, cliente desde, sinal, roteador, ONU e solicitação. Só preenche o que reconhece e informa o que foi preenchido para conferência.'
      },
      {
        type: 'novo',
        title: 'Foco automático e erro mais claro',
        description: 'Ao abrir uma tela o foco vai para o primeiro campo vazio. Ao tentar copiar com pendências, a mensagem lista os campos que faltam ("Faltam: Período, ONU…") e a tela rola até o primeiro campo destacado.'
      },
      {
        type: 'melhoria',
        title: 'Normalização de Cliente desde e Horário',
        description: '"Cliente desde" aceita 012020, 1/2020 ou 01-20 e vira 01/2020; "Horário" aceita 1630 ou 16h30 e vira 16:30. Aplicado em OS Geral, Mudança de Endereço, Mudança de Cômodo, Ponto Adicional e Reparo TV.'
      },
      {
        type: 'melhoria',
        title: 'OS Geral mais compacta',
        description: 'Roteador e ONU em três botões lado a lado com "Igual ao roteador", datas rápidas (Hoje, Amanhã, +2 dias) e atalhos de sinal Online/Offline e campo de dBm (digitar 20 vira -20dBm / Online).'
      },
      {
        type: 'melhoria',
        title: 'Revisão editável da escala e novas proteções da IA',
        description: 'Na revisão antes de publicar é possível corrigir nome, região e cidade ou remover técnicos. Em indisponibilidade temporária o sistema respeita o Retry-After e tenta de novo, e imagens grandes são redimensionadas e comprimidas para não estourar o limite de envio.'
      },
      {
        type: 'melhoria',
        title: 'Gravação do rascunho sem sobrecarga',
        description: 'Os formulários passaram a salvar o rascunho com atraso curto (debounce), gravando imediatamente ao sair da tela para não perder o que foi digitado.'
      }
    ]
  },
  {
    version: '1.8',
    releaseDate: '10 de Novembro de 2026',
    isLatest: false,
    highlight: 'Alta disponibilidade da leitura de escala com IA: failover em cadeia (modelos e chaves), retry com backoff e revisão do resultado antes de publicar.',
    changes: [
      {
        type: 'novo',
        title: 'Failover em cadeia na IA',
        description: 'Cada falha é classificada (imagem inválida, chave rejeitada, modelo inexistente, cota, sobrecarga) e recebe a ação certa: abortar, trocar de chave, pular o modelo ou repetir com backoff. Timeout por tentativa, orçamento total de tempo e circuit breaker para modelos instáveis. Suporte a uma segunda chave (GEMINI_API_KEY_2) e à lista de modelos por variável GEMINI_MODELS.'
      },
      {
        type: 'novo',
        title: 'Revisão antes de publicar e botão Desfazer',
        description: 'A escala extraída pela IA agora aparece para conferência e só é gravada após confirmação. A escala anterior fica salva como backup e pode ser restaurada com um clique.'
      },
      {
        type: 'novo',
        title: 'Diagnóstico das tentativas',
        description: 'O painel de comunicação com a IA lista cada modelo tentado, o resultado e o tempo gasto.'
      },
      {
        type: 'correcao',
        title: 'Escala não é mais sobrescrita por resultado vazio',
        description: 'Resposta inválida ou sem nenhum técnico agora conta como falha e passa para o próximo modelo, em vez de gravar listas vazias.'
      },
      {
        type: 'correcao',
        title: 'Teste de comunicação em produção',
        description: 'O endpoint de teste da IA passou a existir também na Vercel e usa a mesma cadeia de failover da extração. O selo "API Online" deixou de aparecer sem teste real.'
      },
      {
        type: 'melhoria',
        title: 'Mensagens de erro específicas',
        description: 'Indisponibilidade da IA, chave inválida, imagem inválida e imagem sem técnicos agora mostram mensagens distintas.'
      }
    ]
  },
  {
    version: '1.7',
    releaseDate: '17 de Outubro de 2026',
    isLatest: false,
    highlight: 'Adição da Central de Encerramento de Atendimento (Baixa N2, Adiantamento de Vaga e Confirmação de OS) e Biblioteca Completa de Scripts Prontos de Chat.',
    changes: [
      {
        type: 'novo',
        title: 'Máscara de Encerramento e Baixa N2',
        description: 'Módulo completo para geração do resumo de encerramento de chamado técnico N2, incluindo relato inicial, verificações de sinal óptico e status, orientações ao assinante, procedimentos remotos aplicados (reboot, canal Wi-Fi, largura de banda e DNS) e desfecho padronizado para CRM.'
      },
      {
        type: 'novo',
        title: 'Solicitação de Adiantamento de Vaga',
        description: 'Formulário integrado para pedidos de encaixe e priorização de visitas técnicas com formatação padronizada para o setor de logística de campo.'
      },
      {
        type: 'novo',
        title: 'Confirmação e Retorno de Agendamento (OS)',
        description: 'Geração simultânea em dois formatos essenciais: Formato Logística / WhatsApp e Formato Atendimento / Histórico CRM, com máscara telefônica inteligente e operador vinculado automaticamente.'
      },
      {
        type: 'novo',
        title: 'Biblioteca de Scripts Prontos de Chat',
        description: 'Painel com 16 scripts padronizados pré-carregados (Sem Acesso, Lentidão, Mudança de Cômodo, Mudança de Endereço, Ponto Adicional e Atendimento Geral), busca instantânea, edição direta nos cards, adição de scripts customizados e cópia em 1 clique.'
      },
      {
        type: 'melhoria',
        title: 'Harmonização Visual e Modo Escuro Suave',
        description: 'Todas as novas ferramentas contam com conformidade visual completa ao design system atual do projeto e suporte nativo ao Modo Escuro Suave.'
      }
    ]
  },
  {
    version: '1.6',
    releaseDate: '17 de Outubro de 2026',
    isLatest: false,
    highlight: 'Modo Escuro Suave para maior conforto visual e redução do cansaço visual em jornadas diárias, com botão de alternância estilo Switch.',
    changes: [
      {
        type: 'novo',
        title: 'Modo Escuro Suave (Dark Mode)',
        description: 'Implementação de tema escuro com paleta suave e relaxante para os olhos, eliminando contrastes agressivos e mantendo legibilidade ideal em todos os formulários, painéis, tabelas e modais.'
      },
      {
        type: 'novo',
        title: 'Botão de Alternância Estilo Switch',
        description: 'Controle moderno e intuitivo no estilo Switch com ícones de Sol e Lua na barra lateral e atalho no topo da tela, permitindo alternar instantaneamente entre o Modo Claro e o Modo Escuro Suave a qualquer momento.'
      },
      {
        type: 'melhoria',
        title: 'Paleta Anti-Fadiga e Alta Visibilidade',
        description: 'Cores balanceadas com tons suaves de ardósia (slate), superfícies elevadas e contraste equilibrado que proporcionam conforto visual durante jornadas contínuas sem cansar a visão.'
      },
      {
        type: 'melhoria',
        title: 'Persistência Automática de Preferência',
        description: 'A preferência de tema é memorizada localmente no navegador, mantendo o modo escolhido mesmo após atualizar a página ou fechar o sistema.'
      }
    ]
  },
  {
    version: '1.5',
    releaseDate: '15 de Outubro de 2026',
    isLatest: false,
    highlight: 'Correção e Alta Disponibilidade na Leitura de Imagens com IA: migração para a versão Lite prioritária (gemini-3.1-flash-lite) e fallback automático em cascata entre versões.',
    changes: [
      {
        type: 'correcao',
        title: 'Correção de Modelos Descontinuados',
        description: 'Substituição definitiva de modelos legados descontinuados pela Google pelo motor de última geração do SDK @google/genai.'
      },
      {
        type: 'melhoria',
        title: 'Prioridade para Versão Lite e Fallback Sequencial',
        description: 'A leitura de tabelas e fotos de escalas agora tenta primeiro a versão Lite ultra-rápida (gemini-3.1-flash-lite). Caso ela não responda ou haja pico de demanda, o sistema tenta automaticamente em sequência as versões Flash (gemini-3.8-flash, gemini-3.5-flash e gemini-flash-latest) até o sucesso da leitura.'
      },
      {
        type: 'novo',
        title: 'Diagnóstico de Modelo e Latência em Tempo Real',
        description: 'Exibição do modelo exato que processou a imagem e a latência de processamento em milissegundos tanto no teste de comunicação quanto na extração de técnicos.'
      },
      {
        type: 'novo',
        title: 'Gestão Inteligente de Contatos e Máscara +55',
        description: 'Detecção automática quando o número inicia com DDI 55, aplicando máscara no formato +55 (XX) XXXXX-XXXX ou +55 (XX) XXXX-XXXX. Suporte para adicionar múltiplas linhas de contato através do botão (+), check de identificação do número do Titular e campo de identificação/nome para números de terceiros (ex: Esposa, Filho, Maria).'
      }
    ]
  },
  {
    version: '1.4',
    releaseDate: '14 de Outubro de 2026',
    isLatest: false,
    highlight: 'Padronização Global das Telas de Atendimento (Mudança de Cômodo, Ponto Adicional, Reparo TV e Feedback): remoção de títulos/tags redundantes, seleção em coluna de hardware, máscara telefônica, switches interativos e operador vinculado automaticamente.',
    changes: [
      {
        type: 'melhoria',
        title: 'Remoção de Títulos e Tags de Data',
        description: 'Cabeçalhos e tags de data removidos das telas operacionais (Mudança de Cômodo, Ponto Adicional, Reparo TV e Feedback) para harmonização visual e aproveitamento otimizado da área útil.'
      },
      {
        type: 'novo',
        title: 'Seleção em Coluna de Roteador e ONU',
        description: 'Substituição das caixas suspensas por botões estilizados em coluna para Comodato (Verde), Compra (Azul) e Smart-Pré (Vermelho), com vínculo inteligente que replica Smart-Pré na ONU automaticamente.'
      },
      {
        type: 'melhoria',
        title: 'Máscara Telefônica e Switch "Conseguiu Contato?"',
        description: 'Formatação em tempo real de números fixos e celulares no campo Contato/Telefone, com switch Sim/Não desmarcado por padrão e validação obrigatória antes da cópia do script.'
      },
      {
        type: 'novo',
        title: 'Campos Sim/Não e Estrutura Convertidos para Switches Interativos',
        description: 'Transformação de todos os seletores Sim/Não (indicação, custos, exceções, upgrades, sintomas) em switches modernos de alta usabilidade com feedback tátil e visual.'
      },
      {
        type: 'melhoria',
        title: 'Atendente Vinculado Automaticamente',
        description: 'Campo de operador substituído por indicador padronizado com o sistema em todas as telas, exibindo o usuário conectado e o badge "Preenchido Automaticamente".'
      }
    ]
  },
  {
    version: '1.3',
    releaseDate: '14 de Outubro de 2026',
    isLatest: false,
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
                  v1.7
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Acompanhe as atualizações, novos recursos e melhorias contínuas do Service Desk.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
          <div className="text-right px-2">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Versão Atual</span>
            <span className="text-sm font-extrabold text-slate-800">1.7 Produção</span>
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
