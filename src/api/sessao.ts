import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { RespostaLogin, Usuario } from './tipos';

/**
 * Sessão persistida no Expo SecureStore (Keystore no Android, Keychain no iOS).
 * Requisito de Cybersecurity (OWASP Mobile Top 10 — armazenamento inseguro):
 * tokens NUNCA vão para AsyncStorage.
 *
 * No navegador (`expo start --web`) o SecureStore não existe; lá a sessão fica só em memória
 * e some ao recarregar a página, o que é aceitável para desenvolvimento.
 */
const CHAVES = {
  access: 'vinsight.accessToken',
  refresh: 'vinsight.refreshToken',
  usuario: 'vinsight.usuario',
} as const;

const suportaSecureStore = Platform.OS !== 'web';
const memoria = new Map<string, string>();

async function ler(chave: string) {
  return suportaSecureStore ? SecureStore.getItemAsync(chave) : (memoria.get(chave) ?? null);
}

async function gravar(chave: string, valor: string) {
  if (suportaSecureStore) await SecureStore.setItemAsync(chave, valor);
  else memoria.set(chave, valor);
}

async function apagar(chave: string) {
  if (suportaSecureStore) await SecureStore.deleteItemAsync(chave);
  else memoria.delete(chave);
}

// Cache em memória para não ir ao Keystore a cada requisição.
let accessEmMemoria: string | null | undefined;

export const sessao = {
  async salvar({ accessToken, refreshToken, usuario }: RespostaLogin) {
    accessEmMemoria = accessToken;
    await Promise.all([
      gravar(CHAVES.access, accessToken),
      gravar(CHAVES.refresh, refreshToken),
      gravar(CHAVES.usuario, JSON.stringify(usuario)),
    ]);
  },

  async accessToken() {
    if (accessEmMemoria === undefined) accessEmMemoria = await ler(CHAVES.access);
    return accessEmMemoria;
  },

  refreshToken: () => ler(CHAVES.refresh),

  async usuario(): Promise<Usuario | null> {
    const bruto = await ler(CHAVES.usuario);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  },

  async limpar() {
    accessEmMemoria = null;
    await Promise.all(Object.values(CHAVES).map(apagar));
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
