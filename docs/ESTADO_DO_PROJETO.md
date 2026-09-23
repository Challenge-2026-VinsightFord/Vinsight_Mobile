# Estado do projeto — app do consultor (VINSight)

> Documento de passagem entre sessões e computadores. Anexe-o num chat novo junto com
> `CONTEXTO_Mobile_Expo.md` e `INTEGRACAO_MOBILE.md` para retomar sem perder contexto.
> Atualizado em **23/09/2026**. Entrega da Sprint 3: **27/09/2026**.

## Histórias

| US | O quê | Situação | Branch |
|---|---|---|---|
| US-44 | Base, tema Ford, componentes, camada de dados com `USE_MOCK` | ✅ Feita | `feat/us-44-base-design-system` |
| US-45 | Login, sessão no SecureStore, refresh, logout | ✅ Feita | `feat/us-45-login` |
| US-46 | Fila de leads: score, filtros, busca, paginação, estados | ✅ Feita | `feat/us-46-fila-leads` |
| US-47 | Detalhe do lead (visão 360°), contato conforme LGPD | ✅ Feita | `feat/us-47-detalhe-lead` |
| US-48 | Registro de desfecho com fila offline e reenvio idempotente | ✅ Feita | `feat/us-48-desfecho` |
| **US-49** | **APK pelo EAS, ícone/splash, README com prints e link do APK** | ⏳ **Próxima — obrigatória** | — |
| US-60 | Agendamento pelo app (Should) | ⬜ Se sobrar tempo | — |
| US-75 | Modo offline completo com cache (Could) | ⬜ Se sobrar tempo | — |

As branches são **empilhadas**: cada uma contém as anteriores. A mais recente tem tudo.
**Antes da entrega, levar tudo para a `main`** (pull request da branch mais recente → `main`): o
avaliador olha a branch padrão do repositório. A versão do cliente (Ford Care+) está preservada na tag `v1`.

## Plano da US-49 (combinado, ainda não iniciado)

1. `eas.json` com dois perfis de APK (`buildType: "apk"`):
   - **entrega**: `EXPO_PUBLIC_USE_MOCK=true`. O professor não terá a API rodando; em mock o APK funciona
     em qualquer aparelho com os dados reais do seed.
   - **api**: `EXPO_PUBLIC_API_URL` apontando para a API, e `usesCleartextTraffic` liberado
     (plugin `expo-build-properties`), porque o release bloqueia `http://`.
2. Atalhos de usuários de demonstração do login controlados por variável (hoje dependem de `__DEV__`,
   que é falso no APK).
3. Ícone, ícone adaptativo e splash do VINSight (hoje ainda são os do Ford Care+) e `version` no `app.json`.
4. Conta Expo **do usuário** + `npx eas-cli login`; depois `npx eas-cli build -p android --profile entrega`.
   Alternativa sem conta: build local com o SDK do Android Studio (`npx expo run:android --variant release`).
5. README final: descrição, arquitetura, como rodar, usuários de demo, **print de cada tela** e link do APK.

## Decisões já tomadas

- App do **consultor** (não do cliente), no repositório do Ford Care+.
- TypeScript, expo-router com rotas protegidas (`Stack.Protected`), tema em `src/theme` sem cor solta nas telas.
- Toda chamada de rede passa por `src/api` (`http.ts` + `servicos.ts`); mocks gerados da API real por
  `npm run gerar-mocks`.
- Tokens **e** registros pendentes (têm observações sobre clientes) no **SecureStore**; AsyncStorage só
  para contadores.
- Fila com abas "A contatar / Retornos / Não atenderam" para contornar `?status=OPEN` esconder leads abertos.
- Consultor recebe telefone mascarado e não liga pelo app; **gerente** liga (demo).
- Commits sem linha de coautoria.

## Para testar e gravar

- Guia completo de ambiente e roteiro do vídeo: [`GUIA_AMBIENTE.md`](GUIA_AMBIENTE.md).
- Pendências do backend (nenhuma urgente): [`PENDENCIAS_BACKEND.md`](PENDENCIAS_BACKEND.md).
- Casos do seed: lead **13** (Camila, suprimido por LGPD, só abre por link), lead **16** (403, outra unidade),
  **gerente** vê telefone completo (Ricardo Tavares e Mariana Rocha autorizaram ligação).
- **Registrar desfecho na API real altera o banco.** Teste e grave essas cenas em mock ou restaure o seed
  (`DROP DATABASE vinsight;` + reiniciar a API).
