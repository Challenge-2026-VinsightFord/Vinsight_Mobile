import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Chave-valor criptografado: Keystore no Android, Keychain no iOS (Expo SecureStore).
 * Guarda tudo o que é sensível: tokens e registros pendentes (que têm observações sobre o cliente).
 *
 * No navegador (`expo start --web`) o SecureStore não existe: lá os valores ficam só em memória
 * e somem ao recarregar a página, o que é aceitável para desenvolvimento.
 */
const suportado = Platform.OS !== 'web';
const memoria = new Map<string, string>();

export const armazenamentoSeguro = {
  ler: (chave: string) => (suportado ? SecureStore.getItemAsync(chave) : Promise.resolve(memoria.get(chave) ?? null)),

  async gravar(chave: string, valor: string) {
    if (suportado) await SecureStore.setItemAsync(chave, valor);
    else memoria.set(chave, valor);
  },

  async apagar(chave: string) {
    if (suportado) await SecureStore.deleteItemAsync(chave);
    else memoria.delete(chave);
  },

  async lerJson<T>(chave: string): Promise<T | null> {
    const bruto = await this.ler(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  },

  gravarJson: (chave: string, valor: unknown) => armazenamentoSeguro.gravar(chave, JSON.stringify(valor)),
};
