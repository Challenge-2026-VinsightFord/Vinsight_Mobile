# Estado do projeto — app do consultor (VINSight)

> Documento de passagem entre sessões e computadores. Anexe-o num chat novo junto com
> `CONTEXTO_Mobile_Expo.md` e `INTEGRACAO_MOBILE.md` para retomar sem perder contexto.
> Atualizado em **24/09/2026**. Entrega da Sprint 3: **27/09/2026**.

## Histórias

| US | O quê | Situação | Branch |
|---|---|---|---|
| US-44 | Base, tema Ford, componentes, camada de dados com `USE_MOCK` | ✅ Feita | `feat/us-44-base-design-system` |
| US-45 | Login, sessão no SecureStore, refresh, logout | ✅ Feita | `feat/us-45-login` |
| US-46 | Fila de leads: score, filtros, busca, paginação, estados | ✅ Feita | `feat/us-46-fila-leads` |
| US-47 | Detalhe do lead (visão 360°), contato conforme LGPD | ✅ Feita | `feat/us-47-detalhe-lead` |
| US-48 | Registro de desfecho com fila offline e reenvio idempotente | ✅ Feita | `feat/us-48-desfecho` |
| **US-49** | **APK, ícone/splash, README com prints e link do APK** | 🔧 **Em andamento (24/09)** | `feat/us-49-apk` |
| US-60 | Agendamento pelo app (Should) | ⬜ Se sobrar tempo | — |
| US-75 | Modo offline completo com cache (Could) | ⬜ Se sobrar tempo | — |

As branches são **empilhadas**: cada uma contém as anteriores. A mais recente tem tudo.
**Antes da entrega, levar tudo para a `main`** (pull request da branch mais recente → `main`): o
avaliador olha a branch padrão do repositório. A versão do cliente (Ford Care+) está preservada na tag `v1`.

## US-49 — o que foi feito em 24/09

- `eas.json` com os perfis `entrega` (mock) e `api`; `expo-build-properties` libera `http://` no release.
- `EXPO_PUBLIC_ATALHOS_DEMO=true` mostra os usuários de demo no login do APK (antes dependia de `__DEV__`).
- Ícones e splash do VINSight gerados por `scripts/gerar-icones.ps1`; `versionCode` 1.
- README reescrito (era o do Ford Care+), com lugar para os prints em `docs/prints/`.
- **Build local** com o SDK do Android Studio (sem conta Expo): `npx expo prebuild -p android` e
  `gradlew assembleRelease` com `JAVA_HOME` no JBR do Android Studio. APK sem `EXPO_PUBLIC_API_URL`
  procura a API em `10.0.2.2:8080` (o PC visto do emulador).
- **Armadilha do build local:** o `@react-native/gradle-plugin` declara o `foojay-resolver-convention`
  0.5.0, que quebra no Gradle 9.3 (`JvmVendorSpec IBM_SEMERU`). Troque para `1.0.0` em
  `node_modules/@react-native/gradle-plugin/settings.gradle.kts` (volta a cada `npm install`).
- **Outra armadilha:** o lint do release trava (bug do lint) em `react-native-screens` e `react-native-worklets`.
  Rode o `assembleRelease` com `-x lintVitalAnalyzeRelease`.
- **Mais uma:** o Gradle não percebe mudança nas `EXPO_PUBLIC_*` e reaproveita o bundle JS. Entre o APK da API
  e o de demo, apague `android/app/build/generated/assets`. `react`/`react-dom` precisam ser **19.2.3** exatos
  (o renderer do RN 0.85); com 19.2.6 o APK fecha ao abrir.

Falta: prints de cada tela, publicar os APKs no GitHub Releases, vídeo, e levar a branch para a `main`.

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
