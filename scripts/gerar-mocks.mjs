/**
 * Gera os JSONs de mock (src/api/mock/dados) a partir da vinsight-api rodando localmente.
 * Só faz leituras (GET), então pode rodar contra o banco de desenvolvimento sem risco.
 *
 * Uso:  npm run gerar-mocks
 *       API_URL=http://10.0.0.5:8080 npm run gerar-mocks
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL ?? 'http://localhost:8080';
const DESTINO = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'api', 'mock', 'dados');

// Usuários do seed do perfil dev (documentados no INTEGRACAO_MOBILE.md).
const USUARIOS = [
  { email: 'consultor@ford.com.br', senha: 'consultor123' },
  { email: 'consultor.campinas@ford.com.br', senha: 'consultor123' },
  { email: 'consultor.poa@ford.com.br', senha: 'consultor123' },
  { email: 'gerente@ford.com.br', senha: 'gerente123' },
];
// O mock serve a visão deste usuário (mascaramento e carteira de consultor).
const USUARIO_BASE = USUARIOS[0];

async function chamar(caminho, { token, metodo = 'GET', corpo } = {}) {
  const resp = await fetch(API + caminho, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(corpo && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: corpo && JSON.stringify(corpo),
  });
  if (!resp.ok) throw new Error(`${metodo} ${caminho} -> ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function todasAsPaginas(caminho, token) {
  const sep = caminho.includes('?') ? '&' : '?';
  const itens = [];
  for (let page = 0; ; page++) {
    const p = await chamar(`${caminho}${sep}page=${page}&size=100`, { token });
    itens.push(...p.content);
    if (p.page + 1 >= p.totalPages) return itens;
  }
}

async function salvar(nome, dados) {
  await writeFile(join(DESTINO, nome), JSON.stringify(dados, null, 2) + '\n', 'utf8');
  console.log(`  ${nome}`);
}

async function main() {
  console.log(`Lendo ${API} ...`);
  await mkdir(DESTINO, { recursive: true });

  const usuarios = [];
  for (const u of USUARIOS) {
    const { usuario } = await chamar('/api/v1/auth/login', { metodo: 'POST', corpo: u });
    usuarios.push({ ...usuario, senha: u.senha });
  }

  const { accessToken: token } = await chamar('/api/v1/auth/login', { metodo: 'POST', corpo: USUARIO_BASE });

  const fila = await todasAsPaginas('/api/v1/leads?sort=score,desc', token);
  const leads = [];
  for (const item of fila) leads.push(await chamar(`/api/v1/leads/${item.id}`, { token }));

  // Leads suprimidos (LGPD) não vêm na listagem, mas o detalhe abre: são o caso de teste dos
  // botões de contato bloqueados. Sondamos os ids que faltam na sequência.
  const ids = new Set(fila.map((l) => l.id));
  for (let id = 1; id <= Math.max(...ids) + 10; id++) {
    if (ids.has(id)) continue;
    try {
      const lead = await chamar(`/api/v1/leads/${id}`, { token });
      if (lead.supressao) leads.push(lead);
    } catch {
      // 404 (não existe) ou 403 (outra concessionária): fora do mock
    }
  }

  const clientesResumo = await todasAsPaginas('/api/v1/customers', token);
  const clientes = {};
  for (const c of clientesResumo) clientes[c.id] = await chamar(`/api/v1/customers/${c.id}/overview`, { token });

  const vins = new Set([
    ...leads.map((l) => l.vin),
    ...Object.values(clientes).flatMap((c) => c.veiculos.map((v) => v.vin)),
  ]);
  const veiculos = {};
  for (const vin of vins) veiculos[vin] = await chamar(`/api/v1/vehicles/${vin}`, { token });

  const agendamentos = [];
  for (const a of await todasAsPaginas('/api/v1/agendamentos', token)) {
    agendamentos.push(await chamar(`/api/v1/agendamentos/${a.id}`, { token }));
  }

  console.log('Gravando em src/api/mock/dados:');
  await salvar('usuarios.json', usuarios);
  await salvar('leads.json', leads);
  await salvar('clientes-resumo.json', clientesResumo);
  await salvar('clientes.json', clientes);
  await salvar('veiculos.json', veiculos);
  await salvar('agendamentos.json', agendamentos);
  console.log(
    `OK: ${leads.length} leads, ${clientesResumo.length} clientes, ${vins.size} veículos, ${agendamentos.length} agendamentos.`,
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
