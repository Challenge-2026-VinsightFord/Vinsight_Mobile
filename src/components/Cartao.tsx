import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cores, espaco, opacidade, raio, sombra } from '@/theme';

export interface CartaoProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Superfície branca com borda e sombra leve. Com `onPress`, vira um item tocável. */
export function Cartao({ children, onPress, style, accessibilityLabel }: CartaoProps) {
  if (!onPress) return <View style={[estilos.cartao, style]}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [estilos.cartao, pressed && { opacity: opacidade.pressionado }, style]}
    >
      {children}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.lg,
    ...sombra.cartao,
  },
});
