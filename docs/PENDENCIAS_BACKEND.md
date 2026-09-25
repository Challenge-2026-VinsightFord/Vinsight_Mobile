# Pendências para o backend (vinsight-api)

Pontos encontrados ao integrar o app com a API. **O app funciona com a API como está hoje**: cada
item diz como o app contorna a falta dele. A lista existe para decidir o que vale fazer no tempo
que sobra.

| Prioridade | Significado |
|---|---|
| 🔴 **Urgente** | Bloqueia um fluxo da entrega ou um critério de avaliação |
| 🟡 **Antes do vídeo** | O app funciona, mas a demonstração fica visivelmente melhor |
| 🟢 **Melhoria** | O app já contorna; vale para a Sprint 4 ou se sobrar tempo |

> Situação em 23/09/2026: **nenhum item urgente.** O que mais pesa na demo é o seed (itens 1 a 4).

---

## 🟡 Antes do vídeo

### 1. Mais leads e mais variedade no seed

A fila da Ford Morumbi tem só **5 leads abertos**. É pouco para a demo e para mostrar a rolagem
infinita num print. Sugestão: 25 a 30 leads na Morumbi, cobrindo os casos que o app sabe mostrar e que
hoje **não aparecem em nenhum lead aberto**:

- garantia **`PROXIMA_DO_FIM`** (nenhum veículo do seed está nessa situação, e é o "gancho de venda" do contrato);
- revisão **`VENCIDA`** com risco alto;
- mais leads com **consentimento de telefone**, para o gerente demonstrar a ligação;
- telemetria com **códigos de falha** em leads de risco alto.

*Hoje o app contorna com* `EXPO_PUBLIC_TAMANHO_PAGINA=2`, que força várias páginas com poucos leads.

### 2. Acentos nos textos do seed

Motivos e ações aparecem na tela sem acento: "Revisao de 90.000 km", "vencida ha 81 dias",
"pecas Motorcraft com preco". É o texto de maior destaque do app (o bloco "Por que este cliente
agora") e vai aparecer em todos os prints.

### 3. Coerência dos dados do seed

- Leads com status `CONTATADO` (ex.: Beatriz Carvalho, lead 8) **não têm nenhum registro em
  `desfechos`**. Na tela, um "Retorno" aparece sem histórico de contato.
- Serviços de **"Atendimento em garantia"** e **"Campanha de recall"** registrados em **oficina
  independente** (Luciana Mendes, lead 7). Garantia e recall só são feitos na rede Ford.

### 4. Restaurar o seed com um comando

Registrar desfecho na API real **altera o banco**, e um lead encerrado não volta para a fila. Cada
tomada do vídeo "gasta" leads. Hoje o jeito é `DROP DATABASE vinsight;` e reiniciar a API (o Flyway
recria tudo). Um script em `tools/` (ou um perfil `demo` que recria o banco a cada subida) facilita as
regravações.

*Contorno:* gravar as cenas de registro em modo mock (`EXPO_PUBLIC_USE_MOCK=true`), que volta ao
estado original ao recarregar o app.

---

## 🟢 Melhorias (o app já contorna)

### 5. Filtro de leads abertos

`CONTATADO` e `SEM_SUCESSO` são status **abertos** (aceitam novo desfecho), mas `?status=OPEN` só devolve
lead nunca trabalhado. Sugestão: `?status=` aceitar vários valores (`?status=OPEN,CONTATADO,SEM_SUCESSO`)
ou um `?abertos=true`. É uma mudança pequena no `LeadController`.

*O app contorna* com as abas "A contatar", "Retornos" e "Não atenderam", uma consulta por status.

### 6. Expor `Idempotent-Replayed` no CORS

Falta incluir o header em `setExposedHeaders` no `SecurityConfig`. No celular não faz diferença (CORS
só existe no navegador). Na web, o app não consegue saber se um reenvio foi reconhecido.

### 7. Busca textual na fila (`?q=` em `/leads`)

*O app contorna* baixando as páginas restantes e filtrando localmente quando há busca. Só compensa
quando a fila tiver centenas de leads.

### 8. Contadores do dia do consultor

A tela "Resumo do dia" pede contadores (contatos feitos, agendamentos). Não há endpoint que diga
"o que este consultor registrou hoje": a listagem de leads não traz `ultimoContatoEm` nem quem registrou.
Sugestão: `GET /api/v1/leads/resumo?data=2026-09-23` → `{ contatados, agendados, semSucesso, recusados, numeroInvalido }`.

*O app contorna* contando os registros feitos **neste aparelho**.

### 9. Agendamento com disponibilidade (Sprint 4, US-57 e US-60)

`GET /appointments/availability` e o `409` em reserva simultânea são da Sprint 4. Até lá o app usa
`POST /api/v1/agendamentos`, que não informa os horários livres.

---

## Decisão de produto: telefone mascarado para o consultor

Como o backend mascara o telefone para o `CONSULTOR`, **ele não consegue ligar pelo app**. Recebe o aviso
"faça o contato pela central". Isso protege a LGPD, mas na demo pode parecer que falta um pedaço.

| Opção | Esforço | Comentário |
|---|---|---|
| A. Deixar como está e explicar na apresentação | nenhum | Coerente com "o app nunca desmascara" |
| B. Liberar o telefone completo **só** no detalhe de um lead da própria unidade, com consentimento ativo | pequeno | É exatamente o caso em que o contato é legítimo |
| C. Click-to-call: o backend faz a ponte da ligação | grande | Fora do escopo da Sprint 3 |

**Recomendação:** B, se sobrar tempo. Enquanto isso, **a demo funciona com o gerente**, que recebe os
dados completos: "Ligar" abre o discador (ex.: Ricardo Tavares, Mariana Rocha).
