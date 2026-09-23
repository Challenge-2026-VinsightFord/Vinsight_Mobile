import { LATENCIA_MOCK_MS, MOCK_ACCESS_TTL_S, MOCK_REFRESH_TTL_S, PREFIXO_API } from '../config';
import type { RequisicaoTransporte, RespostaTransporte, Transporte } from '../http';
import type {
  DetalheAgendamento,
  DetalheLead,
  Desfecho,
  ItemAgendamento,
  ItemFila,
  Pagina,
  PassaporteVeiculo,
  RespostaLogin,
  ResumoCliente,
  Usuario,
  Violacao,
  Visao360Cliente,
} from '../tipos';
import agendamentosJson from './dados/agendamentos.json';
import clientesResumoJson from './dados/clientes-resumo.json';
import clientesJson from './dados/clientes.json';
import leadsJson from './dados/leads.json';
import usuariosJson from './dados/usuarios.json';
import veiculosJson from './dados/veiculos.json';

/**
 * Servidor em memória que imita a vinsight-api. Os JSONs em ./dados são respostas reais da API
 * (visão do consultor da Ford Morumbi), gerados por `npm run gerar-mocks`.
 *
 * Reproduz as regras que o app precisa exercitar: expiração e refresh de token, fila filtrada
 * e paginada, desfecho com Idempotency-Key, 409 em lead encerrado, 422 com violações e erros
 * no formato RFC 7807. As alterações valem até recarregar o app.
 */

const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor));

type UsuarioMock = Usuario & { senha: string };

const estado = {
  usuarios: usuariosJson as unknown as UsuarioMock[],
  leads: clonar(leadsJson) as unknown as DetalheLead[],
  clientesResumo: clientesResumoJson as unknown as ResumoCliente[],
  clientes: clientesJson as unknown as Record<string, Visao360Cliente>,
  veiculos: veiculosJson as unknown as Record<string, PassaporteVeiculo>,
  agendamentos: clonar(agendamentosJson) as unknown as DetalheAgendamento[],
  idempotencia: new Map<string, { corpo: string; resposta: RespostaTransporte }>(),
};

const DESFECHOS: Desfecho[] = ['CONTATADO', 'AGENDADO', 'SEM_SUCESSO', 'RECUSADO', 'NUMERO_INVALIDO'];
const ENCERRADOS = ['AGENDADO', 'RECUSADO', 'NUMERO_INVALIDO'];
const VIN_VALIDO = /^[A-HJ-NPR-Z0-9]{17}$/;

// ---------- Respostas ----------

const TITULOS: Record<string, string> = {
  validacao: 'Erro de validação',
  'nao-autenticado': 'Não autenticado',
  'token-expirado': 'Token expirado',
  'token-invalido': 'Token inválido',
  'credenciais-invalidas': 'Credenciais inválidas',
  'perfil-sem-permissao': 'Acesso negado',
  'outra-concessionaria': 'Acesso negado',
  'nao-encontrado': 'Recurso não encontrado',
  conflito: 'Conflito',
};

class FalhaMock extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    readonly detalhe: string,
    readonly violacoes?: Violacao[],
  ) {
    super(detalhe);
  }
}

const invalido = (violacoes: Violacao[]) =>
  new FalhaMock(422, 'validacao', 'Um ou mais campos estão inválidos.', violacoes);

const ok = (corpo: unknown, status = 200, headers: Record<string, string> = {}): RespostaTransporte => ({
  status,
  headers,
  corpo: clonar(corpo),
});

function paginar<T>(itens: T[], query: Query): Pagina<T> {
  const page = Math.max(0, Number(query.page?.[0] ?? 0));
  const size = Math.min(100, Math.max(1, Number(query.size?.[0] ?? 20)));
  return {
    content: itens.slice(page * size, page * size + size),
    page,
    size,
    totalElements: itens.length,
    totalPages: Math.ceil(itens.length / size),
  };
}

// ---------- Tokens falsos: mock.<tipo>.<idUsuario>.<expiraEmMs> ----------

function emitirTokens(usuario: UsuarioMock): RespostaLogin {
  const agora = Date.now();
  const { senha: _senha, ...publico } = usuario;
  return {
    accessToken: `mock.access.${usuario.id}.${agora + MOCK_ACCESS_TTL_S * 1000}`,
    refreshToken: `mock.refresh.${usuario.id}.${agora + MOCK_REFRESH_TTL_S * 1000}`,
    expiresIn: MOCK_ACCESS_TTL_S,
    usuario: publico,
  };
}

function lerToken(token: string | undefined, tipoEsperado: 'access' | 'refresh') {
  const [prefixo, tipo, id, expira] = (token ?? '').split('.');
  const usuario = estado.usuarios.find((u) => String(u.id) === id);
  if (prefixo !== 'mock' || tipo !== tipoEsperado || !usuario) {
    throw new FalhaMock(401, 'token-invalido', 'Token inválido.');
  }
  if (Number(expira) < Date.now()) throw new FalhaMock(401, 'token-expirado', 'Token expirado.');
  return usuario;
}

function autenticar(headers: Record<string, string>) {
  const auth = headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw new FalhaMock(401, 'nao-autenticado', 'É necessário estar autenticado para acessar este recurso.');
  }
  const usuario = lerToken(auth.slice(7), 'access');
  if (usuario.perfil === 'ANALISTA_FORD') {
    throw new FalhaMock(403, 'perfil-sem-permissao', 'O perfil ANALISTA_FORD não tem acesso a este recurso.');
  }
  return usuario;
}

// ---------- Rotas ----------

type Query = Record<string, string[]>;

interface Contexto {
  params: string[];
  query: Query;
  corpo: any;
  headers: Record<string, string>;
  instance: string;
}

type Handler = (ctx: Contexto) => RespostaTransporte;

const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const paraItemFila = ({ ultimoContatoEm: _u, supressao: _s, desfechos: _d, ...item }: DetalheLead): ItemFila => item;

function buscarLead(id: string) {
  const lead = estado.leads.find((l) => String(l.id) === id);
  if (!lead) throw new FalhaMock(404, 'nao-encontrado', `Lead com id ${id} não encontrado.`);
  return lead;
}

function ordenarLeads(leads: DetalheLead[], sort: string[] | undefined) {
  const [campo, direcao] = (sort?.[0] ?? 'score,desc').split(',');
  const fator = direcao === 'asc' ? 1 : -1;
  const chave = (l: DetalheLead) => (campo === 'geradoEm' ? l.geradoEm : campo === 'id' ? l.id : l.score);
  return [...leads].sort((a, b) => (chave(a) > chave(b) ? fator : chave(a) < chave(b) ? -fator : 0));
}

const rotas: [string, RegExp, Handler][] = [
  [
    'POST',
    /^\/auth\/login$/,
    ({ corpo }) => {
      const violacoes: Violacao[] = [];
      if (!corpo?.email) violacoes.push({ campo: 'email', mensagem: 'não deve estar em branco' });
      if (!corpo?.senha) violacoes.push({ campo: 'senha', mensagem: 'não deve estar em branco' });
      if (violacoes.length) throw invalido(violacoes);

      const usuario = estado.usuarios.find(
        (u) => u.email === String(corpo.email).trim().toLowerCase() && u.senha === corpo.senha,
      );
      if (!usuario) throw new FalhaMock(401, 'credenciais-invalidas', 'E-mail ou senha inválidos.');
      return ok(emitirTokens(usuario));
    },
  ],
  [
    'POST',
    /^\/auth\/refresh$/,
    ({ corpo }) => {
      const usuario = lerToken(corpo?.refreshToken, 'refresh');
      return ok(emitirTokens(usuario));
    },
  ],
  [
    'GET',
    /^\/leads$/,
    ({ headers, query }) => {
      autenticar(headers);
      const [status] = query.status ?? [];
      const [risco] = query.risco ?? [];
      const [clienteId] = query.clienteId ?? [];
      // Leads suprimidos (LGPD_OPT_OUT) nunca aparecem na listagem.
      const filtrados = estado.leads.filter(
        (l) =>
          !l.supressao &&
          (!status || l.status === status) &&
          (!risco || l.faixaRisco === risco) &&
          (!clienteId || String(l.cliente.id) === clienteId),
      );
      return ok(paginar(ordenarLeads(filtrados, query.sort).map(paraItemFila), query));
    },
  ],
  [
    'GET',
    /^\/leads\/(\d+)$/,
    ({ headers, params }) => {
      autenticar(headers);
      return ok(buscarLead(params[0]));
    },
  ],
  [
    'PATCH',
    /^\/leads\/(\d+)$/,
    ({ headers, params, corpo, instance }) => {
      const usuario = autenticar(headers);
      const lead = buscarLead(params[0]);

      const chave = headers['idempotency-key'];
      const corpoSerializado = JSON.stringify(corpo ?? {});
      const anterior = chave ? estado.idempotencia.get(`${instance}|${chave}`) : undefined;
      if (anterior) {
        if (anterior.corpo !== corpoSerializado) {
          throw invalido([
            { campo: 'Idempotency-Key', mensagem: 'chave já usada com outro corpo de requisição' },
          ]);
        }
        return { ...anterior.resposta, headers: { ...anterior.resposta.headers, 'idempotent-replayed': 'true' } };
      }

      const violacoes: Violacao[] = [];
      if (!DESFECHOS.includes(corpo?.desfecho)) {
        violacoes.push({ campo: 'desfecho', mensagem: `valor não permitido. Aceitos: ${DESFECHOS.join(', ')}` });
      }
      if (corpo?.proximoContato && corpo.proximoContato < new Date().toISOString().slice(0, 10)) {
        violacoes.push({ campo: 'proximoContato', mensagem: 'deve ser uma data presente ou futura' });
      }
      if (violacoes.length) throw invalido(violacoes);

      if (lead.supressao) {
        throw new FalhaMock(409, 'conflito', 'Lead suprimido (LGPD_OPT_OUT): o cliente não pode ser contatado.');
      }
      if (ENCERRADOS.includes(lead.status)) {
        throw new FalhaMock(409, 'conflito', `Lead já encerrado com desfecho ${lead.status}; não aceita novo desfecho.`);
      }

      const agora = new Date().toISOString();
      lead.status = corpo.desfecho;
      lead.ultimoContatoEm = agora;
      lead.desfechos.unshift({
        desfecho: corpo.desfecho,
        observacao: corpo.observacao ?? null,
        proximoContato: corpo.proximoContato ?? null,
        registradoPor: usuario.nome,
        registradoEm: agora,
      });

      const resposta = ok(lead);
      if (chave) estado.idempotencia.set(`${instance}|${chave}`, { corpo: corpoSerializado, resposta });
      return resposta;
    },
  ],
  [
    'GET',
    /^\/customers$/,
    ({ headers, query }) => {
      autenticar(headers);
      const termo = semAcento(query.q?.[0] ?? '').trim();
      const digitos = termo.replace(/\D/g, '');
      const encontrados = estado.clientesResumo.filter(
        (c) =>
          !termo ||
          semAcento(c.nome).includes(termo) ||
          (digitos.length >= 3 &&
            (c.documentoMascarado.replace(/\D/g, '').includes(digitos) ||
              c.telefoneMascarado.replace(/\D/g, '').includes(digitos))),
      );
      return ok(paginar(encontrados, query));
    },
  ],
  [
    'GET',
    /^\/customers\/(\d+)\/overview$/,
    ({ headers, params }) => {
      autenticar(headers);
      const cliente = estado.clientes[params[0]];
      if (!cliente) throw new FalhaMock(404, 'nao-encontrado', `Cliente com id ${params[0]} não encontrado.`);
      return ok(cliente);
    },
  ],
  [
    'GET',
    /^\/vehicles\/([^/]+)$/,
    ({ headers, params }) => {
      autenticar(headers);
      const vin = decodeURIComponent(params[0]);
      if (!VIN_VALIDO.test(vin)) {
        throw invalido([{ campo: 'vin', mensagem: 'VIN deve ter 17 caracteres (letras maiúsculas e números, sem I, O e Q)' }]);
      }
      const veiculo = estado.veiculos[vin];
      if (!veiculo) throw new FalhaMock(404, 'nao-encontrado', `Veículo com VIN ${vin} não encontrado.`);
      return ok(veiculo);
    },
  ],
  [
    'GET',
    /^\/agendamentos$/,
    ({ headers, query }) => {
      autenticar(headers);
      const [status] = query.status ?? [];
      const [inicio] = query.dataInicio ?? [];
      const [fim] = query.dataFim ?? [];
      const itens: ItemAgendamento[] = estado.agendamentos
        .filter(
          (a) => (!status || a.status === status) && (!inicio || a.dataHora >= inicio) && (!fim || a.dataHora <= fim),
        )
        .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
        .map((a) => ({
          id: a.id,
          dataHora: a.dataHora,
          tipoServico: a.tipoServico,
          status: a.status,
          veiculoId: a.veiculo.id,
          veiculoPlaca: a.veiculo.placa,
          concessionariaId: a.concessionaria.id,
          concessionariaNomeFantasia: a.concessionaria.nomeFantasia,
        }));
      return ok(paginar(itens, query));
    },
  ],
  [
    'GET',
    /^\/agendamentos\/(\d+)$/,
    ({ headers, params }) => {
      autenticar(headers);
      const agendamento = estado.agendamentos.find((a) => String(a.id) === params[0]);
      if (!agendamento) throw new FalhaMock(404, 'nao-encontrado', `Agendamento com id ${params[0]} não encontrado.`);
      return ok(agendamento);
    },
  ],
  [
    'POST',
    /^\/agendamentos$/,
    ({ headers, corpo }) => {
      const usuario = autenticar(headers);
      const violacoes: Violacao[] = [];
      for (const campo of ['veiculoId', 'concessionariaId', 'dataHora', 'tipoServico']) {
        if (corpo?.[campo] == null) violacoes.push({ campo, mensagem: 'não deve ser nulo' });
      }
      if (corpo?.dataHora && new Date(corpo.dataHora) <= new Date()) {
        violacoes.push({ campo: 'dataHora', mensagem: 'deve ser uma data futura' });
      }
      if (violacoes.length) throw invalido(violacoes);

      const unidade = usuario.concessionaria;
      if (!unidade || corpo.concessionariaId !== unidade.id) {
        throw new FalhaMock(403, 'outra-concessionaria', 'Agendamento só pode ser criado na sua concessionária.');
      }
      const veiculo = Object.values(estado.veiculos).find((v) => v.id === corpo.veiculoId);
      if (!veiculo) throw new FalhaMock(404, 'nao-encontrado', `Veículo com id ${corpo.veiculoId} não encontrado.`);

      const ocupado = estado.agendamentos.some(
        (a) => a.concessionaria.id === corpo.concessionariaId && a.dataHora === corpo.dataHora && a.status !== 'CANCELADO',
      );
      if (ocupado) throw new FalhaMock(409, 'conflito', 'Horário indisponível. Escolha outro horário.');

      const novo: DetalheAgendamento = {
        id: Math.max(0, ...estado.agendamentos.map((a) => a.id)) + 1,
        veiculo: { id: veiculo.id, vin: veiculo.vin, placa: veiculo.placa, modelo: veiculo.modelo },
        concessionaria: { id: unidade.id, nomeFantasia: unidade.nome },
        dataHora: corpo.dataHora,
        tipoServico: corpo.tipoServico,
        status: 'AGENDADO',
        observacoes: corpo.observacoes ?? null,
        valorEstimado: corpo.valorEstimado ?? null,
        dataCriacao: new Date().toISOString().slice(0, 19),
      };
      estado.agendamentos.push(novo);
      return ok(novo, 201, { location: `${PREFIXO_API}/agendamentos/${novo.id}` });
    },
  ],
];

// ---------- Transporte ----------

function lerQuery(texto: string): Query {
  const query: Query = {};
  for (const par of texto.split('&').filter(Boolean)) {
    const [chave, valor = ''] = par.split('=').map(decodeURIComponent);
    (query[chave] ??= []).push(valor);
  }
  return query;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

export const transporteMock: Transporte = async (req: RequisicaoTransporte): Promise<RespostaTransporte> => {
  await esperar(LATENCIA_MOCK_MS * (0.6 + Math.random() * 0.8));

  const [caminhoCompleto, textoQuery = ''] = req.caminho.split('?');
  const caminho = caminhoCompleto.replace(PREFIXO_API, '');
  const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v]));
  const correlationId = headers['x-correlation-id'] ?? 'mock';

  try {
    for (const [metodo, padrao, handler] of rotas) {
      const achou = metodo === req.metodo ? padrao.exec(caminho) : null;
      if (achou) {
        const resposta = handler({
          params: achou.slice(1),
          query: lerQuery(textoQuery),
          corpo: req.corpo,
          headers,
          instance: caminhoCompleto,
        });
        return { ...resposta, headers: { ...resposta.headers, 'x-correlation-id': correlationId } };
      }
    }
    throw new FalhaMock(404, 'nao-encontrado', `Rota ${req.metodo} ${caminhoCompleto} não existe no mock.`);
  } catch (e) {
    const falha = e instanceof FalhaMock ? e : new FalhaMock(500, 'erro-interno', 'Erro inesperado no mock.');
    return {
      status: falha.status,
      headers: { 'content-type': 'application/problem+json', 'x-correlation-id': correlationId },
      corpo: {
        type: `https://vinsight.ford/errors/${falha.codigo}`,
        title: TITULOS[falha.codigo] ?? 'Erro',
        status: falha.status,
        detail: falha.detalhe,
        instance: caminhoCompleto,
        timestamp: new Date().toISOString(),
        correlationId,
        ...(falha.violacoes && { violacoes: falha.violacoes }),
      },
    };
  }
};
