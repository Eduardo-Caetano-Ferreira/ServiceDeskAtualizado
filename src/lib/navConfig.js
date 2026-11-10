import {
  Home, FileText, MapPin, Router, Network, MonitorPlay, MessageSquare,
  FileCheck2, MessagesSquare, Search, UploadCloud, History
} from 'lucide-react';
import pkg from '../../package.json';

// Fonte única da navegação: usada pela barra lateral, pela Home, pelo cabeçalho e pelos atalhos.

// "1.9.0" -> "1.9"
export const APP_VERSION = String(pkg.version).split('.').slice(0, 2).join('.');

export const SECTIONS = [
  { id: 'principal', title: 'Navegação' },
  { id: 'os', title: 'Ordens de Serviço', subtitle: 'Gere o script de abertura da O.S.' },
  { id: 'comunicacao', title: 'Comunicação & Encerramento', subtitle: 'Scripts, baixas e feedback do cliente' },
  { id: 'ferramentas', title: 'Ferramentas', subtitle: 'Apoio ao dia a dia do atendimento' },
];

// tone: cor do ícone nos cartões (ver TONES em pages/Home.jsx)
// shortcut: Alt + tecla ('1'..'9', '0' ou uma letra)
// form: tela de formulário com "Copiar script" (aceita Ctrl+Enter)
export const PAGES = [
  {
    id: 'home', name: 'Início', icon: Home, section: 'principal', shortcut: '1',
    description: 'Escolha o que você quer fazer.'
  },
  {
    id: 'os_geral', name: 'OS Geral', icon: FileText, section: 'os', shortcut: '2', tone: 'red', form: true, featured: true,
    description: 'Agendamento, dados do cliente e informações técnicas em um único script.'
  },
  {
    id: 'mud_endereco', name: 'Mudança de Endereço', icon: MapPin, section: 'os', shortcut: '3', tone: 'orange', form: true,
    description: 'Script de O.S. para mudança de endereço do cliente.'
  },
  {
    id: 'mud_comodo', name: 'Mudança de Cômodo', icon: Router, section: 'os', shortcut: '4', tone: 'violet', form: true,
    description: 'Script de O.S. para mudar roteador e ONU de cômodo.'
  },
  {
    id: 'ponto_adicional', name: 'Ponto Adicional', icon: Network, section: 'os', shortcut: '5', tone: 'teal', form: true,
    description: 'Script de O.S. para instalação de ponto adicional.'
  },
  {
    id: 'reparo_tv', name: 'Reparo TV', icon: MonitorPlay, section: 'os', shortcut: '6', tone: 'blue', form: true,
    description: 'Script de O.S. para reparo de TV e sinal.'
  },
  {
    id: 'encerramento', name: 'Encerramento de Atendimento', icon: FileCheck2, section: 'comunicacao', shortcut: '7', tone: 'indigo', badge: 'Novo',
    description: 'Baixa N2, adiantamento de vaga e confirmação de O.S.'
  },
  {
    id: 'scripts_chat', name: 'Scripts de Chat', icon: MessagesSquare, section: 'comunicacao', shortcut: '8', tone: 'pink', badge: 'Novo',
    description: 'Biblioteca de scripts prontos, com busca e cópia em 1 clique.'
  },
  {
    id: 'feedback', name: 'Feedback', icon: MessageSquare, section: 'comunicacao', shortcut: '9', tone: 'amber', form: true,
    description: 'Registro padronizado do feedback do cliente.'
  },
  {
    id: 'consulta_ceps', name: 'Consulta CEPs', icon: Search, section: 'ferramentas', shortcut: '0', tone: 'emerald', badge: 'Novo',
    description: 'Consulta rápida de CEPs.'
  },
  {
    id: 'atualizar_rota', name: 'Atualizar Rota', icon: UploadCloud, section: 'ferramentas', shortcut: 'R', tone: 'slate',
    description: 'Envie a imagem da escala e a IA atualiza os técnicos da região.'
  },
  {
    id: 'changelog', name: 'Novidades', icon: History, section: 'ferramentas', tone: 'slate', hidden: true,
    description: 'Veja o que mudou em cada versão.'
  },
];

export const getPage = (id) => PAGES.find((p) => p.id === id);
export const getSection = (id) => SECTIONS.find((s) => s.id === id);

// Atalho Alt+tecla -> id da página (usa event.code, que não muda com o Alt)
export const SHORTCUT_BY_CODE = Object.fromEntries(
  PAGES.filter((p) => p.shortcut).map((p) => [
    /^\d$/.test(p.shortcut) ? `Digit${p.shortcut}` : `Key${p.shortcut.toUpperCase()}`,
    p.id
  ])
);
