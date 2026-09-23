import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ProvedorSessao, useSessao } from '@/sessao/ProvedorSessao';
import { opcoesCabecalho } from '@/theme/navegacao';

// Mantém a splash até sabermos se há sessão salva, para o login não "piscar" antes da fila.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function LayoutRaiz() {
  return (
    <ProvedorSessao>
      <StatusBar style="light" />
      <Navegacao />
    </ProvedorSessao>
  );
}

function Navegacao() {
  const { estado } = useSessao();
  const autenticado = estado.status === 'autenticado';

  useEffect(() => {
    if (estado.status !== 'carregando') SplashScreen.hideAsync().catch(() => {});
  }, [estado.status]);

  // Rotas protegidas: sem sessão, só o login existe; com sessão, o login deixa de existir.
  // Quando `autenticado` muda (login, logout ou sessão expirada), o router redireciona sozinho.
  return (
    <Stack screenOptions={opcoesCabecalho}>
      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="catalogo" options={{ title: 'Design system' }} />
      </Stack.Protected>
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
