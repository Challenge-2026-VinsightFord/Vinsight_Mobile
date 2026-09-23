# Guia de ambiente — rodar o VINSight em outro computador

Passo a passo para rodar **API + app** num PC novo (ex.: em casa) e gravar a demonstração com o OBS.

> **Atalho:** se o objetivo for só gravar o app, dá para pular a API e o MySQL inteiros usando o
> modo mock (seção 4.3). O app funciona igual, com dados reais do seed, sem backend nenhum.

---

## 1. O que instalar

| Ferramenta | Para quê | Obrigatória? | Download aprox. |
|---|---|---|---|
| Git | clonar os repositórios | sim | 60 MB |
| Node.js **22 LTS** (ou 24) | rodar o app (Expo) | sim | 30 MB |
| Expo Go (no celular, Play Store) | abrir o app no celular | sim, se usar celular | 100 MB no celular |
| JDK **21** | rodar a API | só se usar a API | 190 MB |
| MySQL **8** | banco da API | só se usar a API | 300 MB a 450 MB |
| Android Studio | emulador Android | **não** (ver seção 5) | ver abaixo |
| scrcpy | espelhar um celular Android no PC para o OBS | só se tiver Android | 40 MB |

### Quanto pesa o Android Studio

Vale saber antes de baixar. Os números abaixo são aproximados e variam um pouco por versão.

| Item | Tamanho |
|---|---|
| Instalador | cerca de 1,2 GB |
| IDE instalada | 3 GB a 4 GB |
| SDK + ferramentas do emulador | 2 GB a 3 GB |
| Imagem do Android para o emulador (1 aparelho) | 3 GB a 6 GB |
| Aparelho virtual criado (dados) | 2 GB a 6 GB |
| **Total em disco** | **reserve 15 GB** |

Uso de memória:

| Cenário | RAM |
|---|---|
| Android Studio aberto | 1,5 GB a 3 GB |
| Emulador rodando | 2 GB a 4 GB |
| Emulador + Metro + API + MySQL + OBS gravando | pede **16 GB** de RAM |

Com 8 GB de RAM o conjunto funciona, mas engasga, e isso aparece no vídeo.

O emulador também exige **virtualização ligada na BIOS** (Intel VT-x ou AMD-V). O instalador do
Android Studio configura a parte do Windows sozinho.

**Não é preciso ter o Android Studio para gerar o APK:** o build da US-49 roda na nuvem da Expo (EAS Build).
Ele só serve para o emulador, que é o caminho para gravar sem um Android físico (seção 5.2).

---

## 2. Clonar os repositórios

```bash
git clone https://github.com/glaucoheitor21/vinsight-api.git
git clone https://github.com/Junqueiraprr/mobile_fiap.git vinsight_mobile
cd vinsight_mobile
git checkout feat/us-47-detalhe-lead
```

A última linha só é necessária enquanto o trabalho estiver nas branches `feat/us-*`. Depois do merge
na `main`, o clone já vem atualizado.

---

## 3. API (vinsight-api)

1. Instale o **MySQL 8**. O usuário e a senha padrão da API são `root` / `fiap`. Se o seu MySQL usa outros,
   passe por variável de ambiente e **não edite o código**:
   ```bash
   DB_USER=root DB_PASSWORD=suasenha ./mvnw spring-boot:run
   ```
2. O banco `vinsight` é criado sozinho, e o Flyway carrega o schema e a massa de demonstração
   (perfil `dev`, que é o padrão).
3. Suba a API:
   ```bash
   cd vinsight-api
   ./mvnw spring-boot:run
   ```
   No PowerShell ou no cmd: `mvnw.cmd spring-boot:run`.
4. Teste no navegador: <http://localhost:8080/actuator/health> deve responder `{"status":"UP"}`.
5. **Firewall do Windows:** na primeira vez, o Windows pergunta se o Java pode usar a rede. Marque **Redes
   privadas** e permita. Sem isso, o celular não alcança a API e dá "Sem conexão".

---

## 4. App (vinsight_mobile)

### 4.1 Instalar e subir

```bash
cd vinsight_mobile
npm install
npx expo start
```

Aparece um QR code no terminal.

### 4.2 Onde o app procura a API

Não é preciso configurar nada: o app usa o **IP do PC onde o Metro está rodando**. Como é o mesmo PC da
API, isso funciona em casa e na faculdade sem editar arquivo.

Para forçar outro endereço, crie um `.env.local` (fica fora do git):

```
EXPO_PUBLIC_API_URL=http://192.168.0.15:8080
```

O IP do PC aparece no `ipconfig`, no campo "Endereço IPv4". Depois de mexer no `.env.local`, reinicie o
`npx expo start`.

### 4.3 Modo mock (sem API e sem MySQL)

Crie um `.env.local` com:

```
EXPO_PUBLIC_USE_MOCK=true
```

O app passa a usar os JSONs de `src/api/mock/dados`, que são respostas reais da API. Login, fila,
detalhe, erros e LGPD funcionam igual. As alterações (ex.: desfechos registrados) somem ao recarregar o app.

### 4.4 Outras variáveis úteis para testes e demo

| Variável | Efeito |
|---|---|
| `EXPO_PUBLIC_TAMANHO_PAGINA=2` | Páginas pequenas, para mostrar a rolagem infinita com poucos leads |
| `EXPO_PUBLIC_MOCK_ACCESS_TTL=20` | No mock: token vence em 20 s, para mostrar a renovação automática |
| `EXPO_PUBLIC_MOCK_REFRESH_TTL=60` | No mock: sessão expira em 60 s e o app volta ao login com aviso |

---

## 5. Onde abrir o app

### 5.1 Celular com Expo Go (mais simples)

1. Instale o **Expo Go** pela Play Store. Ele precisa ser compatível com o **SDK 56** do projeto; a versão
   da loja normalmente é.
2. Deixe **celular e PC na mesma rede Wi-Fi**.
3. Abra o Expo Go e leia o QR code do terminal.

Se não conectar:
- confira se o firewall liberou o **Node.js** (porta 8081) e o **Java** (porta 8080) em rede privada;
- se a rede isola os aparelhos (comum em redes corporativas e de faculdade), use o hotspot do celular ou `npx expo start --tunnel`.
  **Atenção:** o túnel leva só o app até o celular, não a API. Com túnel, use o modo mock ou
  defina `EXPO_PUBLIC_API_URL` com um endereço que o celular alcance.

### 5.2 Emulador do Android Studio + OBS (recomendado para gravar)

**Criar o aparelho virtual (uma vez só):**

1. Instale o Android Studio e siga o assistente padrão; ele baixa o SDK e o emulador.
2. Na tela inicial, abra **More Actions → Virtual Device Manager → Create Virtual Device**.
3. Escolha um **Pixel 8**, com a imagem **Google Play**, **x86_64**, API 35 ou mais nova.
4. Em *Advanced Settings*, deixe *Graphics* em **Hardware** e a RAM em **4 GB**, se o PC tiver 16 GB.

**Rodar o app no emulador:**

1. Inicie o emulador, de preferência **sem a IDE aberta**, o que economiza de 1,5 GB a 3 GB de RAM. No PowerShell (terminal padrão do VS Code):
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -list-avds
   & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel_8
   ```
   Use o nome que o `-list-avds` mostrar. Se preferir iniciar pela IDE, desmarque
   *Settings → Tools → Emulator → Launch in the tool window*, para o emulador abrir em janela própria.
2. Com o emulador aberto, rode `npx expo start` e aperte **`a`**. O Expo instala o Expo Go no emulador
   e abre o app. O endereço da API é detectado sozinho, como no celular.

**Preparar para a gravação:**

1. **Mostrar os toques:** no emulador, ative *Configurações → Sobre o emulador → Número da versão*
   (toque 7 vezes) e depois *Opções do desenvolvedor → Mostrar toques*. Aparece um círculo onde você
   clica, o que ajuda quem assiste.
2. **OBS:** *Fontes → + → Captura de janela →* a janela "Android Emulator - Pixel_8…".
   Se a captura ficar **preta**, troque o *Método de captura* para **Windows 10 (1903 e superior)**:
   o emulador desenha pela GPU e o método antigo não enxerga.
3. Esconda a barra lateral de controles do emulador ou recorte-a no OBS (*Alt + arrastar a borda*).
4. Faça um "ensaio" antes: a primeira abertura do app no emulador é mais lenta (o Metro gera o bundle).
   Na segunda, abre rápido.

### 5.3 Se tiver um celular Android: scrcpy

O [scrcpy](https://github.com/Genymobile/scrcpy) mostra a tela do celular numa janela do PC, pelo cabo USB.
Ative a *Depuração USB* nas opções do desenvolvedor do celular e rode
`scrcpy --max-size 1080 --stay-awake --show-touches`. O OBS captura a janela do scrcpy.

---

## 6. Roteiro sugerido para o vídeo

| Usuário | Senha | Para mostrar |
|---|---|---|
| `consultor@ford.com.br` | `consultor123` | Fluxo principal (Ford Morumbi) |
| `gerente@ford.com.br` | `gerente123` | Contato completo: "Ligar" abre o discador |
| `analista@ford.com.br` | `analista123` | App recusa o perfil (usa o dashboard web) |
| `consultor.poa@ford.com.br` | `consultor123` | Outra unidade: fila própria, 403 nos leads de Morumbi |

Em modo desenvolvimento, a tela de login tem atalhos para esses usuários.

Momentos que valem a pena mostrar:

1. **Login com senha errada**: mensagem amigável e senha limpa. Depois, o login certo.
2. **Fila**: ordem por score, filtro "Risco alto", busca pela placa, aba "Retornos".
3. **Detalhe do Ricardo Tavares**: o bloco "Por que este cliente agora" é o trabalho de IA na tela.
   Mostre também a linha do tempo, a telemetria e a aderência à rede.
4. **Detalhe da Luciana Mendes**: 4 de 4 serviços em oficina independente e código de falha P0420.
5. **LGPD**: o lead da Camila Freitas (id 13) está suprimido e os botões de contato ficam bloqueados.
   A API esconde leads suprimidos da fila, então ele só abre por link direto. Com o app logado no
   emulador, rode no PowerShell do PC (o `adb` vem com o Android Studio):
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -a android.intent.action.VIEW -d "exp://<IP-do-PC>:8081/--/lead/13"
   ```
   O `<IP-do-PC>` é o que aparece no terminal do `npx expo start`, na linha "Metro waiting on exp://…".
6. **Gerente → Ricardo → Ligar**: abre o discador com o número completo. Como consultor, o mesmo botão
   explica que o número é protegido.
7. **Sem internet**: no emulador, arraste a barra de status para baixo e ligue o **modo avião** com a fila
   aberta. Troque de filtro ou abra um lead: o app mostra "Sem conexão" com "Tentar novamente" e não fecha.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Login dá "Não foi possível falar com o servidor" | API fora do ar ou firewall | Abra `http://<IP-do-PC>:8080/actuator/health` no Chrome **do emulador** (ou do celular); se não abrir, é rede ou firewall |
| Expo Go diz que o projeto é de outro SDK | Expo Go desatualizado | Atualize o Expo Go na Play Store |
| Mudei o `.env.local` e nada mudou | O Metro lê o `.env` só ao iniciar | Pare e rode `npx expo start --clear` |
| Emulador muito lento | Virtualização desligada ou pouca RAM | Ative VT-x/AMD-V na BIOS; feche o Android Studio e use o emulador pela linha de comando |
| API: `Public Key Retrieval is not allowed` | Autenticação do MySQL 8 | Veja o README da API, seção de credenciais |
