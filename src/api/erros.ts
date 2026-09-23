import type { Problema, Violacao } from './tipos';

/**
 * Códigos de erro. Os da API vêm do sufixo do `type` do Problem Details; os locais
 * (sem-conexao, tempo-esgotado, resposta-invalida, sessao-expirada) são gerados pelo app.
 */
export type CodigoErro =
  | 'validacao'
  | 'requisicao-invalida'
  | 'nao-autenticado'
  | 'token-expirado'
  | 'token-invalido'
  | 'credenciais-invalidas'
  | 'perfil-sem-permissao'
  | 'outra-concessionaria'
  | 'nao-encontrado'
  | 'metodo-nao-permitido'
  | 'conflito'
  | 'limite-requisicoes'
  | 'erro-interno'
  | 'sem-conexao'
  | 'tempo-esgotado'
  | 'resposta-invalida'
  | 'sessao-expirada'
  | 'desconhecido';

export const codigoDoType = (type: string) => type.substring(type.lastIndexOf('/') + 1);

/**
 * Erro único que qualquer tela recebe da camada de dados.
 * A tela decide pelo `codigo`, nunca pelo texto (regra do contrato).
 */
export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: CodigoErro;
  readonly problema?: Problema;
  readonly correlationId?: string;

  constructor(opcoes: {
    status: number;
    codigo: CodigoErro;
    mensagem: string;
    problema?: Problema;
    correlationId?: string;
  }) {
    super(opcoes.mensagem);
    this.name = 'ErroApi';
    this.status = opcoes.status;
    this.codigo = opcoes.codigo;
    this.problema = opcoes.problema;
    this.correlationId = opcoes.correlationId ?? opcoes.problema?.correlationId;
  }

  static deProblema(problema: Problema, correlationId?: string) {
    return new ErroApi({
      status: problema.status,
      codigo: codigoDoType(problema.type) as CodigoErro,
      mensagem: problema.detail || problema.title,
      problema,
      correlationId,
    });
  }

  static local(codigo: CodigoErro, mensagem: string) {
    return new ErroApi({ status: 0, codigo, mensagem });
  }

  get violacoes(): Violacao[] {
    return this.problema?.violacoes ?? [];
  }

  /** Mensagem de violação de um campo específico (para exibir sob o input). */
  violacaoDo(campo: string): string | undefined {
    return this.violacoes.find((v) => v.campo === campo)?.mensagem;
  }

  /** Falhas de rede: a ação pode ser repetida sem mudar nada. */
  get ehFalhaDeRede() {
    return this.codigo === 'sem-conexao' || this.codigo === 'tempo-esgotado';
  }
}

export const comoErroApi = (e: unknown): ErroApi =>
  e instanceof ErroApi
    ? e
    : ErroApi.local('desconhecido', e instanceof Error ? e.message : 'Erro inesperado.');
