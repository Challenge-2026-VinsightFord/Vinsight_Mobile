import { TAMANHO_PAGINA } from './config';
import { http, requisitarCompleto } from './http';
import { sessao } from './sessao';
import type {
  Credenciais,
  DetalheAgendamento,
  DetalheLead,
  FiltroAgendamentos,
  FiltroLeads,
  ItemAgendamento,
  ItemFila,
  NovoAgendamento,
  Pagina,
  PassaporteVeiculo,
  RegistroDesfecho,
  RespostaLogin,
  ResumoCliente,
  Usuario,
  Visao360Cliente,
} from './tipos';

/**
 * Serviços por domínio: é por aqui (e só por aqui) que as telas falam com a API.
 * Trocar mock por API real não muda nada neste arquivo — ver src/api/config.ts.
 */

export const authApi = {
  /** Autentica e grava os tokens no SecureStore. */
  async entrar(credenciais: Credenciais): Promise<Usuario> {
    const resposta = await http.post<RespostaLogin>(
      '/auth/login',
      { email: credenciais.email.trim().toLowerCase(), senha: credenciais.senha },
      { publica: true },
    );
    await sessao.salvar(resposta);
    return resposta.usuario;
  },

  /** Usuário da sessão salva, ou `null` se não houver sessão. */
  usuarioSalvo: () => sessao.usuario(),

  sair: () => sessao.limpar(),
};

export const leadsApi = {
  /** Fila de trabalho. Por padrão: leads OPEN da unidade, do maior score para o menor. */
  listar: ({ status = 'OPEN', page = 0, size = TAMANHO_PAGINA, ...filtro }: FiltroLeads = {}) =>
    http.get<Pagina<ItemFila>>('/leads', { query: { status, page, size, ...filtro } }),

  detalhar: (id: number) => http.get<DetalheLead>(`/leads/${id}`),

  /**
   * Registra o desfecho de um contato. A `chaveIdempotencia` deve ser gerada quando o usuário
   * toca no botão (não a cada tentativa): reenviar com a mesma chave não duplica o registro.
   */
  async registrarDesfecho(id: number, registro: RegistroDesfecho, chaveIdempotencia: string) {
    const resposta = await requisitarCompleto('PATCH', `/leads/${id}`, {
      corpo: registro,
      headers: { 'Idempotency-Key': chaveIdempotencia },
    });
    return {
      lead: resposta.corpo as DetalheLead,
      /** true quando a API reconheceu um reenvio e devolveu a resposta original. */
      reenvio: resposta.headers['idempotent-replayed'] === 'true',
    };
  },
};

export const clientesApi = {
  buscar: (q: string, page = 0, size = TAMANHO_PAGINA) =>
    http.get<Pagina<ResumoCliente>>('/customers', { query: { q, page, size } }),

  visao360: (id: number) => http.get<Visao360Cliente>(`/customers/${id}/overview`),
};

export const veiculosApi = {
  /** VIN em maiúsculas, como a API exige. */
  passaporte: (vin: string) => http.get<PassaporteVeiculo>(`/vehicles/${encodeURIComponent(vin.trim().toUpperCase())}`),
};

export const agendamentosApi = {
  listar: ({ page = 0, size = TAMANHO_PAGINA, ...filtro }: FiltroAgendamentos = {}) =>
    http.get<Pagina<ItemAgendamento>>('/agendamentos', { query: { page, size, ...filtro } }),

  detalhar: (id: number) => http.get<DetalheAgendamento>(`/agendamentos/${id}`),

  criar: (dados: NovoAgendamento) => http.post<DetalheAgendamento>('/agendamentos', dados),
};
