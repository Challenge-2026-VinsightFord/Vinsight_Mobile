import { armazenamentoSeguro as seguro } from './armazenamentoSeguro';
import type { RespostaLogin, Usuario } from './tipos';

/**
 * Sessão persistida no SecureStore. Requisito de Cybersecurity (OWASP Mobile Top 10 —
 * armazenamento inseguro): tokens NUNCA vão para AsyncStorage.
 */
const CHAVES = {
  access: 'vinsight.accessToken',
  refresh: 'vinsight.refreshToken',
  usuario: 'vinsight.usuario',
} as const;

// Cache em memória para não ir ao Keystore a cada requisição.
let accessEmMemoria: string | null | undefined;

export const sessao = {
  async salvar({ accessToken, refreshToken, usuario }: RespostaLogin) {
    accessEmMemoria = accessToken;
    await Promise.all([
      seguro.gravar(CHAVES.access, accessToken),
      seguro.gravar(CHAVES.refresh, refreshToken),
      seguro.gravarJson(CHAVES.usuario, usuario),
    ]);
  },

  async accessToken() {
    if (accessEmMemoria === undefined) accessEmMemoria = await seguro.ler(CHAVES.access);
    return accessEmMemoria;
  },

  refreshToken: () => seguro.ler(CHAVES.refresh),

  usuario: () => seguro.lerJson<Usuario>(CHAVES.usuario),

  async limpar() {
    accessEmMemoria = null;
    await Promise.all(Object.values(CHAVES).map(seguro.apagar));
  },
};

// ---------- Aviso de sessão encerrada ----------
// A camada HTTP detecta a sessão perdida (refresh recusado); quem cuida da navegação
// (o provedor de autenticação) se inscreve aqui para levar o usuário ao login.

type OuvinteSessao = () => void;
const ouvintes = new Set<OuvinteSessao>();

export function aoEncerrarSessao(ouvinte: OuvinteSessao) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function notificarSessaoEncerrada() {
  ouvintes.forEach((o) => o());
}
