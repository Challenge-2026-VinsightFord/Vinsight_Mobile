import { Redirect } from 'expo-router';

// A decisão entre login e fila (sessão salva no SecureStore) entra na US-45.
export default function Inicio() {
  return <Redirect href="/(tabs)" />;
}
