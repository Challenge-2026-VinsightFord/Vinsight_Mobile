import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Configuração da camada de dados — único lugar do app que sabe onde a API está.
 *
 * Variáveis (arquivo `.env`, ou `.env.local` para sobrescrever na sua máquina):
 *   EXPO_PUBLIC_USE_MOCK=true    usa os JSONs de src/api/mock em vez da rede
 *   EXPO_PUBLIC_API_URL=http://192.168.0.10:8080   força a base URL (obrigatória no APK)
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const API_URL = resolverApiUrl();
export const PREFIXO_API = '/api/v1';

export const TIMEOUT_MS = 15_000;
export const TAMANHO_PAGINA = 20;
/** Atraso artificial do mock, para os estados de carregamento aparecerem na demo. */
export const LATENCIA_MOCK_MS = 450;

function resolverApiUrl(): string {
  const explicita = process.env.EXPO_PUBLIC_API_URL;
  if (explicita) return explicita.replace(/\/+$/, '');

  if (Platform.OS === 'web') return 'http://localhost:8080';

  // Em desenvolvimento a API roda no mesmo PC que o Metro. O Expo Go já sabe o IP desse PC
  // (foi de lá que baixou o bundle), então reaproveitamos: funciona em casa e na faculdade
  // sem editar nada.
  const hostMetro = Constants.expoConfig?.hostUri?.split(':')[0];
  if (hostMetro) return `http://${hostMetro}:8080`;

  // Fallback: emulador Android enxerga o PC em 10.0.2.2.
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}
