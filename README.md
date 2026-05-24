# Ford Care+ — Desafio 2 (Fidelização Pós-Venda)

## Grupo 02

- Glauco Heitor Gonçalves — RM 555978
- Pedro Henrique Junqueira — RM 556278

App mobile **React Native + Expo** (Expo Go) para retenção e fidelização de clientes Ford no pós-venda.

## Como rodar

```bash
cd SPRINT-FORD
npm install
npx expo start --clear
```

Escaneie o QR Code com o **Expo Go** no celular (mesma rede Wi‑Fi), ou acesse `localhost:8081` no browser.

> **Requisitos:** Node.js 20.12+ e os pacotes `react-native-web` e `react-dom` são necessários para rodar no browser (já incluídos nas dependências).

## Funcionalidades

| Requisito | Implementação |
|-----------|----------------|
| Login / Registro | `app/(auth)/` + AsyncStorage |
| Base Ford (Excel) | `src/data/vin_database.json` (extraído do `vin_share_Desafio_02.xlsx`) |
| Expo Router | Navegação em `app/` |
| API externa | NHTSA (recalls) + ViaCEP (endereço concessionária) |
| Armazenamento local | Usuários, sessão e agendamentos |
| Desafio 2 | Histórico de serviços, pontos, benefícios, agendamento |

## Base de dados (Excel)

O arquivo do professor tem **~602 mil** registros. Para o app, use o script:

```bash
node scripts/extract-vin-data.js "caminho/vin_share_Desafio_02.xlsx" 500
```

Isso gera `src/data/vin_database.json` com amostra + metadados.

**Colunas:** Country, VIN_Hash, ModelYear, ModelName, ServiceDate, ServiceType, DealerCode, KM, etc.

No cadastro, informe um **VIN_Hash** existente na base para ver histórico e pontos.

## Apresentação (narrativa)

O **Ford Care+** centraliza o relacionamento pós-venda: o cliente vê revisões passadas (dataset Ford), acumula pontos por manutenção, resgata benefícios e agenda novas visitas — aumentando retenção na rede de concessionárias.

## Estrutura

```
app/           # Telas (Expo Router)
src/
  components/
  constants/
  context/     # Auth
  data/        # vin_database.json
  services/    # API, storage, VIN
scripts/       # extract-vin-data.js
```
