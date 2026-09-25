/**
 * Tipos do contrato da vinsight-api v1 (ver INTEGRACAO_MOBILE.md e /api-docs).
 * Datas chegam como string ISO-8601; a conversão para Date fica na camada de apresentação.
 */

// ---------- Envelope e erros ----------

export interface Pagina<T> {
  content: T[];
  page: number; // base 0
  size: number;
  totalElements: number;
  totalPages: number;
}

export const temProxima = (p: Pagina<unknown>) => p.page + 1 < p.totalPages;

export interface Violacao {
  campo: string;
  mensagem: string;
}

/** RFC 7807 — formato de toda resposta de erro da API. */
export interface Problema {
  type: string; // https://vinsight.ford/errors/<codigo>
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  correlationId: string;
  violacoes?: Violacao[];
}

// ---------- Autenticação ----------

export type Perfil = 'CONSULTOR' | 'GERENTE' | 'ANALISTA_FORD' | 'ADMIN';

export interface ConcessionariaResumo {
  id: number;
  nome: string;
  codigo: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  /** `null` para ANALISTA_FORD e ADMIN. */
  concessionaria: ConcessionariaResumo | null;
}

export interface Credenciais {
  email: string;
  senha: string;
}

export interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
  usuario: Usuario;
}

// ---------- Leads ----------

export type StatusLead = 'OPEN' | 'CONTATADO' | 'AGENDADO' | 'SEM_SUCESSO' | 'RECUSADO' | 'NUMERO_INVALIDO';
export type Desfecho = Exclude<StatusLead, 'OPEN'>;
export type FaixaRisco = 'ALTO' | 'MEDIO' | 'BAIXO';
export type PerfilComportamental = 'FIEL' | 'ABANDONO' | 'ESQUECIDO' | 'ECONOMICO';

/** Status que ainda aceitam novo desfecho. AGENDADO, RECUSADO e NUMERO_INVALIDO encerram o lead. */
export const STATUS_ABERTOS: readonly StatusLead[] = ['OPEN', 'CONTATADO', 'SEM_SUCESSO'];

export interface ItemFila {
  id: number;
  vin: string;
  placa: string;
  status: StatusLead;
  score: number; // 0 a 1
  faixaRisco: FaixaRisco;
  motivoContato: string;
  acaoRecomendada: string | null;
  perfilComportamental: PerfilComportamental | null;
  geradoEm: string;
  cliente: { id: number; nome: string; telefoneMascarado: string };
  veiculo: { modelo: string; versao: string | null; ano: number };
}

export interface RegistroHistoricoDesfecho {
  desfecho: Desfecho;
  observacao: string | null;
  proximoContato: string | null;
  registradoPor: string;
  registradoEm: string;
}

export interface DetalheLead extends ItemFila {
  ultimoContatoEm: string | null;
  supressao: { motivo: 'LGPD_OPT_OUT'; em: string } | null;
  desfechos: RegistroHistoricoDesfecho[];
}

export interface RegistroDesfecho {
  desfecho: Desfecho;
  observacao?: string;
  proximoContato?: string; // yyyy-MM-dd
}

export interface FiltroLeads {
  status?: StatusLead;
  risco?: FaixaRisco;
  clienteId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

// ---------- Clientes ----------

export type CanalContato = 'WHATSAPP' | 'EMAIL' | 'TELEFONE';

export interface Visao360Cliente {
  id: number;
  nome: string;
  documentoMascarado: string;
  telefoneMascarado: string;
  emailMascarado: string;
  canalPreferido: CanalContato | null;
  consentimento: { ativo: boolean; canais: CanalContato[]; atualizadoEm: string | null };
  ultimoNps: number | null;
  veiculos: { vin: string; modelo: string; ano: number; placa: string }[];
  resumoHistorico: { totalOrdens: number; ticketMedio: number | null; ultimaVisita: string | null };
}

export interface ResumoCliente {
  id: number;
  nome: string;
  documentoMascarado: string;
  telefoneMascarado: string;
  cidade: string;
  uf: string;
}

// ---------- Veículos ----------

export type StatusGarantia = 'ATIVA' | 'PROXIMA_DO_FIM' | 'ENCERRADA';
export type SituacaoRevisao = 'EM_DIA' | 'PROXIMA' | 'VENCIDA';
export type TipoServico = 'REVISAO_PROGRAMADA' | 'TROCA_OLEO' | 'REPARO' | 'GARANTIA' | 'RECALL';

export interface ItemHistoricoServico {
  id: number;
  data: string;
  tipoServico: TipoServico;
  descricao: string;
  valor: number;
  /** `null` com `naRede: false` = oficina independente. */
  concessionaria: string | null;
  naRede: boolean;
}

export interface PassaporteVeiculo {
  id: number;
  vin: string;
  placa: string;
  modelo: string;
  versao: string | null;
  ano: number;
  cor: string | null;
  quilometragemEstimada: number | null;
  garantia: { status: StatusGarantia; dataLimite: string; mesesRestantes: number } | null;
  proximaRevisaoPrevista: { km: number | null; dataEstimada: string | null; situacao: SituacaoRevisao } | null;
  aderenciaRede: number | null; // 0 a 1
  ultimaTelemetria: { recebidaEm: string; codigosFalha: string[] } | null;
  historico: ItemHistoricoServico[]; // mais recente primeiro
}

// ---------- Agendamentos (/api/v1/agendamentos até a Sprint 4) ----------

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | 'NO_SHOW';

export interface DetalheAgendamento {
  id: number;
  veiculo: { id: number; vin: string; placa: string; modelo: string };
  concessionaria: { id: number; nomeFantasia: string };
  dataHora: string; // LocalDateTime, sem fuso
  tipoServico: TipoServico;
  status: StatusAgendamento;
  observacoes: string | null;
  valorEstimado: number | null;
  dataCriacao: string;
}

export interface ItemAgendamento {
  id: number;
  dataHora: string;
  tipoServico: TipoServico;
  status: StatusAgendamento;
  veiculoId: number;
  veiculoPlaca: string;
  concessionariaId: number;
  concessionariaNomeFantasia: string;
}

export interface NovoAgendamento {
  veiculoId: number;
  concessionariaId: number;
  dataHora: string; // yyyy-MM-ddTHH:mm:ss, no futuro
  tipoServico: TipoServico;
  observacoes?: string;
  valorEstimado?: number;
}

export interface FiltroAgendamentos {
  dataInicio?: string;
  dataFim?: string;
  status?: StatusAgendamento;
  page?: number;
  size?: number;
}
