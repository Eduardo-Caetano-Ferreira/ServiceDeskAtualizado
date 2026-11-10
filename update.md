# Plano de Atualização — v1.7 → v1.8

Análise baseada na leitura de `api/extract-technicians.ts`, `server.ts`, `vercel.json`, `firestore.rules`, `src/pages/Inicio.jsx`, `src/pages/OsGeral.jsx`, `src/components/TechniciansRegion.jsx`, `src/lib/phoneUtils.js`, `src/App.jsx` e `Changelog.jsx`. As demais páginas de formulário (MudComodo, MudEndereco, PontoAdicional, ReparoTV, Feedback, Encerramento) foram só inspecionadas por grep, então os itens que as citam são inferidos pelo padrão de `OsGeral`.

---

## 1. API da IA (Gemini): falhas e failover

### 1.1 Problemas encontrados no código atual

| # | Problema | Onde | Impacto |
|---|----------|------|---------|
| A1 | **Duas implementações duplicadas** da extração, com listas de modelos **diferentes**. Local: `gemini-3.1-flash-lite → 3.8-flash → 3.5-flash → flash-latest`. Vercel: `2.5-flash → 3.8-flash → 2.5-pro → 3.5-flash`. | `server.ts:39`, `api/extract-technicians.ts:77` | Produção (Vercel) e dev se comportam diferente; um bug corrigido num lado continua no outro. |
| A2 | **`/api/test-gemini` não existe na Vercel.** `vercel.json` só declara `extract-technicians`; o rewrite `/(.*)` → `index.html` devolve HTML e o `response.json()` do botão "Testar Comunicação" quebra. | `vercel.json`, `Inicio.jsx:219` | Botão de teste sempre falha em produção, o que parece "IA fora do ar" mesmo com a IA ok. |
| A3 | **Todo erro é tratado igual.** O loop tenta o próximo modelo em qualquer exceção (400 imagem inválida, 401/403 chave inválida, 404 modelo inexistente, 429 cota, 503 sobrecarga). | os dois loops | 401/403 e 400 não se resolvem trocando de modelo e só gastam tempo. 429 e 503 pedem backoff, não troca imediata. |
| A4 | **Sem timeout por tentativa.** Uma chamada pendurada consome os 60s do `maxDuration` e impede os fallbacks. | `vercel.json:5` | Falha total mesmo havendo modelos saudáveis na lista. |
| A5 | **Sem retry no mesmo modelo.** Um 503 transitório já descarta o modelo prioritário. | os dois loops | Cai para modelos piores sem necessidade. |
| A6 | **Sem failover de provedor/chave.** Tudo depende de uma única `GEMINI_API_KEY`. Se a cota ou a chave acabar, nenhum modelo funciona. | `getApiKey()` | Ponto único de falha. |
| A7 | **Nomes de modelo suspeitos / não validados**: `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`. Se algum não existir, vira 404 e é pulado em silêncio a cada requisição. | listas de modelos | Latência desperdiçada. **Validar com `ai.models.list()`** antes de fixar a lista. |
| A8 | **JSON inválido vira "sucesso vazio".** Se o parse falha, devolve `{moto:[],car:[]}` com 200 e o front **sobrescreve a escala do dia no Firestore com listas vazias**. | `extract-technicians.ts:133-152` | Perda da escala válida. Esse é o risco mais sério do arquivo. |
| A9 | **Sem validação do schema.** Aceita qualquer coisa que tenha `moto` ou `car`. Itens sem `name` são gravados. | `Inicio.jsx:296`, `:324` | Lixo na tabela de técnicos. |
| A10 | **Prompt sem `responseSchema`.** Só `responseMimeType: "application/json"`, e o formato fica descrito em texto. | os dois | Mais respostas fora do formato; o SDK suporta schema estruturado. |
| A11 | **`VITE_GEMINI_API_KEY` como fallback** no servidor. Variáveis `VITE_*` entram no bundle do front. | `getApiKey()` | Risco de vazar a chave se alguém a definir com esse prefixo. Remover. |
| A12 | **Limite de payload.** A Vercel limita o body de função a ~4,5 MB; o base64 aumenta a imagem em ~33%. A compressão só roda acima de 800 KB. | `Inicio.jsx:157` | Prints grandes que passam da compressão podem falhar com 413 sem mensagem clara. |
| A13 | **Retry no front só para 503** e só 2 tentativas. Erros de rede e 429 não recebem tratamento diferenciado. | `Inicio.jsx:301` | Usuário vê erro genérico. |
| A14 | **Sem observabilidade.** `failedAttempts` só vai na resposta 503 do `server.ts`. Não há histórico de qual modelo falhou quando. | — | Não dá para saber quanto a IA falha de fato. |

### 1.2 Arquitetura de failover proposta

Extrair a lógica para **um módulo único** `api/_lib/gemini.ts`, importado por `api/extract-technicians.ts`, `api/test-gemini.ts` (novo) e `server.ts`. O `server.ts` passa a ser só o adaptador do Express.

**Cadeia de tentativas (em ordem):**

1. Modelo primário (ex.: lite), chave 1
2. Mesmo modelo, **retry com backoff** (só para 429/500/503/timeout), no máximo 2 vezes
3. Modelo secundário (flash), chave 1
4. Modelo terciário (pro), chave 1
5. **Mesma cadeia com a chave 2** (`GEMINI_API_KEY_2`), se configurada
6. *(Opcional)* **Provedor alternativo**, por exemplo a API da Anthropic com visão, via `FALLBACK_PROVIDER`

**Classificação de erro (decide o que fazer):**

| Erro | Ação |
|------|------|
| 400 (imagem/prompt inválido) | **Abortar**, devolver 400 ao usuário. Trocar de modelo não ajuda. |
| 401 / 403 (chave ruim) | Pular para a próxima chave; registrar alerta. |
| 404 (modelo inexistente) | Marcar modelo como inválido, não tentar mais até o próximo deploy. |
| 429 (cota/limite) | Backoff com jitter; depois próxima chave/modelo. |
| 500 / 503 / timeout | Retry 1×, depois próximo modelo. |
| Resposta sem JSON válido ou sem schema | Tratar como **falha** (vai para o próximo modelo), **nunca** como lista vazia (corrige A8). |

**Detalhes de implementação:**

- `AbortController` / timeout de **~12–15 s por tentativa** e **orçamento total de ~50 s**, abaixo do `maxDuration` de 60 s.
- **Circuit breaker em memória** (por instância serverless): depois de 3 falhas seguidas, o modelo fica fora da lista por 60 s. Não gasta timeout em modelo já sabidamente fora.
- **Lista de modelos por variável de ambiente** (`GEMINI_MODELS=a,b,c`), para trocar sem deploy de código.
- Usar `responseSchema` do SDK (`type: OBJECT`, arrays `moto` e `car`, itens com `name` obrigatório) para reduzir parse quebrado.
- **Validar e normalizar** a resposta (trim, remover itens sem nome, remover duplicados) antes de devolver.
- **Não sobrescrever o Firestore** se `moto.length + car.length === 0`; pedir confirmação ao operador ("a IA não achou nenhum técnico — salvar mesmo assim?").
- Devolver sempre `{ modelUsed, attempts[], latencyMs }` para o diagnóstico.
- Criar `api/test-gemini.ts` e adicioná-lo ao `vercel.json` (corrige A2). O teste deve exercitar a **mesma cadeia** e mostrar qual nível respondeu.

**Esboço da função central:**

```ts
// api/_lib/gemini.ts
type Attempt = { model: string; keyIdx: number; ok: boolean; status?: number; ms: number; error?: string };

const classify = (e: any) => {
  const s = e?.status ?? e?.code;
  if (s === 400) return "abort";
  if (s === 401 || s === 403) return "next-key";
  if (s === 404) return "bad-model";
  if (s === 429) return "backoff";
  return "retry"; // 5xx, timeout, rede
};

export async function extractWithFailover(img: string, mime: string) {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  const models = (process.env.GEMINI_MODELS ?? "…").split(",");
  const deadline = Date.now() + 50_000;
  const attempts: Attempt[] = [];

  for (const [keyIdx, key] of keys.entries())
    for (const model of models) {
      if (breaker.isOpen(model)) continue;
      for (let retry = 0; retry < 2; retry++) {
        if (Date.now() > deadline) throw new ExhaustedError(attempts);
        try {
          const text = await callGemini(key, model, img, mime, { timeoutMs: 15_000 });
          const data = validate(parse(text));          // lança se inválido
          if (!data.moto.length && !data.car.length) throw new EmptyResult();
          breaker.success(model);
          return { data, model, attempts };
        } catch (e) {
          // registra attempt; classify(e) decide: abort | next-key | bad-model | backoff | retry
        }
      }
    }
  throw new ExhaustedError(attempts);
}
```

*(Esboço de intenção; ainda não testado nem compilado.)*

### 1.3 Melhorias no front, relacionadas à IA (`Inicio.jsx`)

- Mostrar o **nível do failover** que respondeu (ex.: "Modelo secundário") e a lista de tentativas no widget "Comunicação com IA".
- Estados distintos na UI: *sobrecarga (tente de novo)*, *cota esgotada*, *imagem inválida*, *sem técnicos encontrados*. Hoje tudo cai no mesmo texto.
- Substituir o retry fixo de 2× só para 503 por um retry **respeitando `Retry-After`** quando existir.
- **Pré-visualizar o resultado antes de gravar** no Firestore: tabela editável com "Confirmar e publicar" / "Descartar". Corrige A8/A9 do lado do usuário e permite corrigir um nome mal lido pela IA.
- Guardar **a última escala válida** (`techniciansList/previous`) para o botão "Desfazer" caso a IA erre.
- Reduzir a compressão para **sempre** redimensionar acima de ~1600 px e ficar abaixo de ~3 MB em base64 (A12).
- O badge "API Online" hoje fica verde se `data.geminiStatus === 'online'`, que é o **valor padrão** do snapshot quando o campo não existe (`Inicio.jsx:68`). Pode mostrar "Online" sem nunca ter testado.

---

## 2. Interface: reduzir tempo de preenchimento

O foco são as telas de script (`OsGeral`, `MudComodo`, `MudEndereco`, `PontoAdicional`, `ReparoTV`, `Feedback`, `Encerramento`), que são o uso diário.

### 2.1 Ganhos rápidos (alto impacto, baixo esforço)

1. **Atalhos de teclado globais**
   - `Ctrl+Enter` → validar e copiar script (hoje exige mouse até o botão no fim da página).
   - `Ctrl+Shift+L` → limpar (com confirmação).
   - `Alt+1…9` → trocar de tela pelo menu lateral.
2. **"Colar e preencher"**: um campo para colar o texto bruto do CRM/atendimento e preencher telefone, "cliente desde", sinal da ONU etc. por regex (e, opcionalmente, pela IA). É o maior ganho de tempo possível, porque hoje cada campo é digitado.
3. **Máscara e normalização na colagem**: `Cliente desde` (`OsGeral.jsx:493`) é texto livre; aceitar `MM/AAAA`, `AAAA` ou data completa e normalizar. `Horário específico` também (`16:30`, `1630`, `16h30`).
4. **Foco automático e Tab ordenado**: ao abrir a tela, foco no primeiro campo vazio; `Enter` em campo de linha única avança para o próximo em vez de nada.
5. **Botão "Hoje" e atalhos de data**: já existe "Hoje"; acrescentar "Amanhã" e "+2 dias" (agendamento raramente é para o mesmo dia).
6. **Roteador/ONU em uma linha**: hoje são 2 colunas × 3 botões grandes empilhados (`OsGeral.jsx:412-475`). Um segmented control horizontal ocupa menos de metade da altura. Considerar "Igual ao roteador" na ONU, já que o caso mais comum é o mesmo valor.
7. **Atalhos de sinal ampliados**: hoje só `LOS`, `Sem energia` e `Não encontrado`. Acrescentar chips para os valores comuns (`Online`, `Offline`, faixas de dBm) e um campo numérico que monta `-20dBm / Online`.
8. **"Copiar e limpar"**: opção para copiar o script e já resetar o formulário, mantendo o operador, para o próximo atendimento.

### 2.2 Estrutura e consistência

9. **Eliminar a duplicação de código entre páginas.** O grep mostra helpers repetidos em 6–8 arquivos (`showToast`, `formatDate`, `getTodayFormatted`, `getInputClass`, `validateForm`, `copiarScript`, `confirmClear`). Em `OsGeral.jsx:83` há um `formatPhone` **local, sem suporte a +55**, enquanto `lib/phoneUtils.js` já tem a versão completa. O campo `contato` legado usa a versão antiga.
   - Criar `src/lib/formUtils.js` (datas, toast) e hooks `useFormDraft(key, initial)` e `useCopyScript(validate, build)`.
   - Criar componentes `<Field>`, `<SegmentedChoice>`, `<ConfirmModal>`, `<Toast>`.
   - Resultado esperado: as páginas de 800–1300 linhas encolhem bastante e um ajuste vale para todas as telas.
10. **Chaves do `localStorage` inconsistentes** (`serviceDeskScriptData`, `osMudancaEndData`, `reparoTvScriptData`, `feedbackScriptData`, `serviceDesk_baixa_form`…, mais um `…_v1_4` e um `…_migrated_v2`). Padronizar com prefixo `serviceDesk_<tela>` e um número de versão de schema, com migração.
11. **`localStorage.getItem` dentro do JSX** (`OsGeral.jsx:660`) roda a cada render. Ler do state.
12. **Persistência a cada tecla**: `useEffect` grava o formulário inteiro no `localStorage` em todo `onChange`. Aplicar debounce (~300 ms).
13. **Validação mais útil**: ao falhar, rolar até o primeiro campo com erro, dar foco nele e listar os campos faltando no toast ("Faltam: Período, ONU"). Hoje só aparece "preencha todos os campos obrigatórios".
14. **Divergência de estado do operador**: `App.jsx` dispara `new Event('storage')` manualmente para sincronizar. Um contexto `OperatorContext` resolve isso sem depender do evento.

### 2.3 Funcionalidades novas que economizam tempo

15. **Rascunhos nomeados / atendimentos em abas**: manter 2–3 formulários abertos em paralelo (o operador atende chats simultâneos) em vez de um único rascunho por tela.
16. **Histórico dos últimos scripts copiados** (últimos 20, com busca) para reaproveitar texto, por exemplo em retornos do mesmo cliente.
17. **Templates de "Solicitação (Motivo)"**: lista de motivos frequentes inserida com um clique, em linha com a biblioteca de `ScriptsChat`.
18. **Busca global (`Ctrl+K`)** pelo menu para ir a qualquer tela ou script.
19. **Painel de técnicos mais útil** (`TechniciansRegion.jsx`):
    - botão de copiar na linha (já existe em `Inicio`, falta aqui);
    - busca tolerante a acento e maiúscula (hoje `toLowerCase().includes`; "Sao Paulo" não acha "São Paulo");
    - `key={idx}` nas linhas: usar uma chave estável;
    - preencher o campo de região do formulário com um clique no técnico.
20. **Integração CEP → região → técnico**: a tela `ConsultaCeps` e o painel de técnicos são independentes. Digitar o CEP poderia filtrar o técnico automaticamente.

### 2.4 Acessibilidade e polimento

- Muitos botões só têm ícone/cor para indicar estado (verde/amarelo/vermelho); acrescentar `aria-pressed` e texto.
- Modais sem fechamento por `Esc` nem *focus trap*.
- Toasts sem `role="status"`.
- Fontes de 10–11 px em várias áreas (`text-[10px]`, `text-[11px]`) dificultam a leitura em jornadas longas.
- Verificar contraste do modo escuro nas tags de status.

---

## 3. Segurança e infraestrutura

| # | Item | Detalhe |
|---|------|---------|
| S1 | **Firestore totalmente aberto** | `firestore.rules`: `allow read, write: if true`. Qualquer pessoa com o `projectId` (que está no bundle) lê e **apaga/altera a escala**. Mínimo: restringir a escrita ao documento `techniciansList/current`, validar campos/tamanho e adicionar autenticação (Firebase Auth anônima ou login). |
| S2 | **Endpoint de IA sem proteção** | `/api/extract-technicians` é público e consome sua cota do Gemini. Adicionar um segredo/token simples, rate limit por IP ou checagem de token do Firebase Auth. |
| S3 | **`VITE_GEMINI_API_KEY`** | Remover do fallback (ver A11). |
| S4 | **`firebase-applet-config.json` e `.aistudio/`** | Estão versionados no repositório. Conferir se há chave/ID que não deveria estar público e se `.aistudio/artifacts/...png` precisa estar no git (talvez adicionar ao `.gitignore`). |
| S5 | **`package.json`** | `name: "gerador-os"`, `version: "0.0.0"`. Alinhar a versão com o changelog (hoje 1.7) e exibir a versão no rodapé a partir de uma única fonte. |
| S6 | **README genérico** | É o template do Vite. Documentar: variáveis de ambiente, como rodar local, deploy na Vercel, estrutura das telas. Incluir as novas variáveis (`GEMINI_API_KEY_2`, `GEMINI_MODELS`, etc.) no `.env.example` (hoje só tem `GEMINI_API_KEY` e `PORT`). |
| S7 | **Sem testes** | Nenhum teste no `package.json`. Prioridade: testes unitários de `phoneUtils`, `extractWithFailover` (com cliente simulado) e geração do script final de cada tela. |
| S8 | **Sem TypeScript no front** | O back está em `.ts`, o front em `.jsx`. Adoção gradual com `// @ts-check` ou migração de `lib/` primeiro. |
| S9 | **Sem Error Boundary** | Erro em uma tela derruba a aplicação inteira (`App.jsx` renderiza tudo sem proteção). |
| S10 | **Roteamento por estado** | `paginaAtual` é `useState`, então não há URL por tela, o botão Voltar do navegador não funciona e não dá para favoritar. React Router ou hash simples resolveria. Também é a base para o `Ctrl+K`. |

---

## 4. Ordem de execução sugerida

**Fase 1 — Estabilidade da IA (prioridade máxima)**
1. Módulo único `gemini.ts` com classificação de erro, timeout, retry e cadeia de modelos (A1, A3, A4, A5)
2. Não gravar escala vazia / JSON inválido como sucesso (A8, A9)
3. Criar `api/test-gemini.ts` na Vercel (A2)
4. Validar nomes de modelo via `models.list()` (A7); remover `VITE_GEMINI_API_KEY` (A11)
5. Segunda chave + circuit breaker (A6)
6. Pré-visualização editável antes de publicar + "Desfazer" (front)

**Fase 2 — Segurança mínima**
7. Regras do Firestore + proteção do endpoint (S1, S2, S4)

**Fase 3 — Velocidade de preenchimento**
8. Atalhos de teclado, `Ctrl+Enter` copiar, foco no primeiro erro (2.1 #1, 2.2 #13)
9. Refatoração de componentes e hooks compartilhados (2.2 #9–12), pois facilita tudo que vem depois
10. "Colar e preencher" (2.1 #2)
11. Roteador/ONU compactos, datas rápidas, chips de sinal (2.1 #3–7)

**Fase 4 — Extras**
12. Rascunhos em abas, histórico de scripts, busca global, rota por URL (2.3, S10)
13. Testes, README, `.env.example` (S6, S7)

---

## 5. Sugestão de changelog para a v1.8

> **1.8 — Alta disponibilidade da leitura de escala com IA e preenchimento mais rápido**
> - *Novo:* failover em cadeia (modelos, chaves e retry com backoff) com diagnóstico das tentativas.
> - *Novo:* revisão da escala extraída antes de publicar e botão "Desfazer".
> - *Novo:* atalhos de teclado (`Ctrl+Enter` copia o script) e foco no primeiro campo inválido.
> - *Correção:* teste de comunicação com a IA funcionando em produção; escala não é mais sobrescrita por resultado vazio.
> - *Melhoria:* regras de segurança do banco e proteção do endpoint de extração.

---

## 6. Pontos para decidir antes de implementar

1. **Provedor alternativo no failover:** ficar só no Gemini (várias chaves/modelos) ou incluir outro provedor (ex.: Anthropic) como último recurso? A segunda opção exige outra chave e tem custo próprio.
2. **Autenticação:** a ferramenta é usada só pela equipe interna? Se sim, Firebase Auth anônimo + token no endpoint é o mínimo; login por e-mail é o ideal.
3. **Nomes dos modelos:** confirmar quais estão realmente disponíveis na sua conta (`models.list()`) antes de fixar a cadeia.
