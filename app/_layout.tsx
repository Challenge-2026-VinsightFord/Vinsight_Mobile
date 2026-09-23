import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { opcoesCabecalho } from '@/theme/navegacao';

export default function LayoutRaiz() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={opcoesCabecalho}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="catalogo" options={{ title: 'Design system' }} />
      </Stack>
    </>
  );
}
