import * as Crypto from 'expo-crypto';
import { API_URL, PREFIXO_API, TIMEOUT_MS, USE_MOCK } from './config';
import { ErroApi, codigoDoType, type CodigoErro } from './erros';
import { transporteMock } from './mock/servidorMock';
import { notificarSessaoEncerrada, sessao } from './sessao';
import type { Problema, RespostaLogin } from './tipos';

/**
 * Cliente HTTP único do app. Nenhuma tela chama `fetch`: tudo passa por `requisitar`.
 *
 * O envio em si é feito por um "transporte" trocável: `fetch` contra a API real ou o
 * servidor em memória de src/api/mock. Como token, refresh e tratamento de erro ficam
 * acima do transporte, o app se comporta igual nos dois modos.
 */

export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ValorQuery = string | number | boolean | null | undefined;

export interface RequisicaoTransporte {
  metodo: Metodo;
  caminho: string; // com prefixo /api/v1 e query string
  headers: Record<string, string>;
  corpo?: unknown;
}

export interface RespostaTransporte {
  status: number;
  headers: Record<string, string>; // chaves em minúsculas
  corpo: unknown;
}

export type Transporte = (req: RequisicaoTransporte) => Promise<RespostaTransporte>;

export interface OpcoesRequisicao {
  query?: Record<string, ValorQuery | ValorQuery[]>;
  corpo?: unknown;
  headers?: Record<string, string>;
  /** Rotas públicas (login, refresh): vão sem token e nunca disparam refresh. */
  publica?: boolean;
}

// ---------- Transporte real ----------

const transporteFetch: Transporte = async ({ metodo, caminho, headers, corpo }) => {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(API_URL + caminho, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controle.signal,
    });
    const texto = await resp.text();
    const cabecalhos: Record<string, string> = {};
    resp.headers.forEach((valor, chave) => {
      cabecalhos[chave.toLowerCase()] = valor;
    });
    return { status: resp.status, headers: cabecalhos, corpo: lerJson(texto) };
  } catch {
    throw controle.signal.aborted
      ? ErroApi.local('tempo-esgotado', 'O servidor demorou para responder. Tente novamente.')
      : ErroApi.local('sem-conexao', 'Sem conexão com o servidor. Verifique a internet e tente novamente.');
  } finally {
    clearTimeout(timer);
  }
};

function lerJson(texto: string): unknown {
  if (!texto) return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return texto; // corpo não-JSON (ex.: página de erro de um proxy)
  }
}

const transporte: Transporte = USE_MOCK ? transporteMock : transporteFetch;

// ---------- Montagem da requisição ----------

function montarQuery(query: OpcoesRequisicao['query']) {
  const partes: string[] = [];
  for (const [chave, valor] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(valor) ? valor : [valor]) {
      if (item === undefined || item === null || item === '') continue;
      partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(item))}`);
    }
  }
  return partes.length ? `?${partes.join('&')}` : '';
}

async function enviar(metodo: Metodo, caminho: string, opcoes: OpcoesRequisicao) {
  const token = opcoes.publica ? null : await sessao.accessToken();
  return transporte({
    metodo,
    caminho: PREFIXO_API + caminho + montarQuery(opcoes.query),
    headers: {
      Accept: 'application/json',
      // Liga um erro na tela à linha de log do servidor.
      'X-Correlation-Id': Crypto.randomUUID(),
      ...(opcoes.corpo !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opcoes.headers,
    },
    corpo: opcoes.corpo,
  });
}

// ---------- Erros ----------

function codigoPorStatus(status: number): CodigoErro {
  if (status === 401) return 'nao-autenticado';
  if (status === 403) return 'perfil-sem-permissao';
  if (status === 404) return 'nao-encontrado';
  if (status === 409) return 'conflito';
  if (status === 422) return 'validacao';
  if (status === 429) return 'limite-requisicoes';
  if (status >= 500) return 'erro-interno';
  return 'requisicao-invalida';
}

function ehProblema(corpo: unknown): corpo is Problema {
  return typeof corpo === 'object' && corpo !== null && typeof (corpo as Problema).type === 'string';
}

function paraErro(resp: RespostaTransporte) {
  const correlationId = resp.headers['x-correlation-id'];
  if (ehProblema(resp.corpo)) return ErroApi.deProblema(resp.corpo, correlationId);
  return new ErroApi({
    status: resp.status,
    codigo: codigoPorStatus(resp.status),
    mensagem: 'O servidor respondeu de forma inesperada. Tente novamente.',
    correlationId,
  });
}

const codigoDaResposta = (resp: RespostaTransporte) =>
  ehProblema(resp.corpo) ? codigoDoType(resp.corpo.type) : null;

// ---------- Sessão: refresh único e encerramento ----------

const erroSessaoEncerrada = () =>
  new ErroApi({ status: 401, codigo: 'sessao-expirada', mensagem: 'Sua sessão foi encerrada. Entre novamente.' });

async function encerrarSessao() {
  await sessao.limpar();
  notificarSessaoEncerrada();
}

let renovacaoEmAndamento: Promise<void> | null = null;

/**
 * Troca o par de tokens usando o refresh token. Várias telas podem receber `token-expirado`
 * ao mesmo tempo; todas aguardam a MESMA renovação em vez de disparar uma cada.
 */
function renovarSessao() {
  renovacaoEmAndamento ??= (async () => {
    try {
      const refreshToken = await sessao.refreshToken();
      if (!refreshToken) throw erroSessaoEncerrada();

      const resp = await enviar('POST', '/auth/refresh', { corpo: { refreshToken }, publica: true });
      if (resp.status !== 200) throw erroSessaoEncerrada();

      await sessao.salvar(resp.corpo as RespostaLogin);
    } catch (e) {
      // Falha de rede no refresh não derruba a sessão: o usuário pode tentar de novo.
      if (e instanceof ErroApi && e.ehFalhaDeRede) throw e;
      await encerrarSessao();
      throw erroSessaoEncerrada();
    } finally {
      renovacaoEmAndamento = null;
    }
  })();
  return renovacaoEmAndamento;
}

// ---------- API pública ----------

export async function requisitarCompleto(
  metodo: Metodo,
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<RespostaTransporte> {
  let resp = await enviar(metodo, caminho, opcoes);

  if (resp.status === 401 && !opcoes.publica && codigoDaResposta(resp) === 'token-expirado') {
    await renovarSessao();
    resp = await enviar(metodo, caminho, opcoes);
  }

  if (resp.status >= 200 && resp.status < 300) return resp;

  if (resp.status === 401 && !opcoes.publica) {
    // Sem token, token adulterado ou expirado mesmo após o refresh: volta ao login.
    await encerrarSessao();
    throw erroSessaoEncerrada();
  }
  throw paraErro(resp);
}

export async function requisitar<T>(metodo: Metodo, caminho: string, opcoes?: OpcoesRequisicao): Promise<T> {
  return (await requisitarCompleto(metodo, caminho, opcoes)).corpo as T;
}

export const http = {
  get: <T>(caminho: string, opcoes?: Omit<OpcoesRequisicao, 'corpo'>) => requisitar<T>('GET', caminho, opcoes),
  post: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>('POST', caminho, { ...opcoes, corpo }),
  put: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>('PUT', caminho, { ...opcoes, corpo }),
  patch: <T>(caminho: string, corpo?: unknown, opcoes?: OpcoesRequisicao) =>
    requisitar<T>('PATCH', caminho, { ...opcoes, corpo }),
  delete: <T = void>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('DELETE', caminho, opcoes),
};
