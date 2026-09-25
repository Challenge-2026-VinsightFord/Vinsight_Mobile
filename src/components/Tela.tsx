import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cores, espaco } from '@/theme';

export interface TelaProps {
  children: ReactNode;
  /** Envolve o conteúdo em ScrollView (formulários e telas de detalhe). */
  rolavel?: boolean;
  /** Sem padding lateral (listas que controlam o próprio espaçamento). */
  semPadding?: boolean;
  /** Bordas protegidas. Telas com cabeçalho do navegador não precisam da borda de cima. */
  bordas?: Edge[];
  style?: StyleProp<ViewStyle>;
}

/** Contêiner padrão de tela: fundo do tema, área segura e padding. */
export function Tela({ children, rolavel = false, semPadding = false, bordas = ['bottom'], style }: TelaProps) {
  const conteudo = [!semPadding && estilos.padding, style];

  return (
    <SafeAreaView style={estilos.tela} edges={bordas}>
      {rolavel ? (
        <ScrollView contentContainerStyle={[estilos.rolavel, conteudo]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[estilos.tela, conteudo]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolavel: { flexGrow: 1 },
  padding: { padding: espaco.lg },
});
