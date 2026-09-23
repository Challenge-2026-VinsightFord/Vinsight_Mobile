import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type DimensionValue } from 'react-native';
import { cores, espaco, raio, tamanho } from '@/theme';
import { Cartao } from './Cartao';

// Na web não há driver nativo de animação; lá a animação roda em JS.
const NATIVO = Platform.OS !== 'web';

/**
 * Blocos cinza pulsando no lugar do conteúdo que está chegando. Dão ao usuário a forma da tela
 * antes dos dados, o que parece mais rápido que um spinner no meio do nada.
 */
export function Esqueleto({ largura = '100%', altura = espaco.lg }: { largura?: DimensionValue; altura?: number }) {
  const opacidade = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: NATIVO }),
        Animated.timing(opacidade, { toValue: 0.5, duration: 700, useNativeDriver: NATIVO }),
      ]),
    );
    pulso.start();
    return () => pulso.stop();
  }, [opacidade]);

  return <Animated.View style={[estilos.bloco, { width: largura, height: altura, opacity: opacidade }]} />;
}

/** Esqueleto com o mesmo desenho do CartaoLead. */
export function CartaoLeadEsqueleto() {
  return (
    <Cartao accessibilityLabel="Carregando lead">
      <View style={estilos.topo}>
        <View style={estilos.coluna}>
          <Esqueleto largura="60%" altura={espaco.xl} />
          <Esqueleto largura="85%" altura={espaco.md} />
          <View style={estilos.linha}>
            <Esqueleto largura="28%" altura={espaco.xl} />
            <Esqueleto largura="32%" altura={espaco.xl} />
          </View>
        </View>
        <Esqueleto largura={tamanho.medidorScore.compacto} altura={tamanho.medidorScore.compacto} />
      </View>
      <View style={estilos.divisor} />
      <View style={estilos.coluna}>
        <Esqueleto largura="35%" altura={espaco.md} />
        <Esqueleto altura={espaco.lg} />
        <Esqueleto largura="70%" altura={espaco.lg} />
      </View>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  bloco: { borderRadius: raio.sm, backgroundColor: cores.superficieAlternativa },
  topo: { flexDirection: 'row', gap: espaco.md },
  coluna: { flex: 1, gap: espaco.sm },
  linha: { flexDirection: 'row', gap: espaco.xs },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espaco.md },
});
