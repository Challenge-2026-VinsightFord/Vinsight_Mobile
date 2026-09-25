import { StyleSheet, View } from 'react-native';
import { cores, espaco, raio } from '@/theme';

export interface BarraProgressoProps {
  /** Fração de 0 a 1. */
  valor: number;
  cor?: string;
  rotuloAcessivel: string;
}

export function BarraProgresso({ valor, cor = cores.primaria, rotuloAcessivel }: BarraProgressoProps) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100);
  return (
    <View
      style={estilos.trilho}
      accessibilityRole="progressbar"
      accessibilityLabel={rotuloAcessivel}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={[estilos.preenchimento, { width: `${pct}%`, backgroundColor: cor }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    height: espaco.sm,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficieAlternativa,
    overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: raio.pilula },
});
