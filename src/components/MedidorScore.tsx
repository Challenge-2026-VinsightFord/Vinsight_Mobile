import { StyleSheet, View } from 'react-native';
import type { FaixaRisco } from '@/api';
import { faixaRisco } from '@/dominio/apresentacao';
import { cores, espaco, raio, tamanho as tamanhos, tons } from '@/theme';
import { Texto } from './Texto';

export interface MedidorScoreProps {
  score: number; // 0 a 1
  faixa: FaixaRisco;
  /** `destaque` é a versão grande, para o detalhe do lead. */
  tamanho?: 'compacto' | 'destaque';
}

/**
 * Score de propensão ao churn, vindo do modelo de IA. É o número que decide a ordem da fila,
 * então aparece com a cor da faixa de risco e uma barra de preenchimento.
 */
export function MedidorScore({ score, faixa, tamanho = 'compacto' }: MedidorScoreProps) {
  const t = tons[faixaRisco[faixa].tom];
  const percentual = Math.round(score * 100);
  const destaque = tamanho === 'destaque';

  return (
    <View
      style={[estilos.caixa, destaque && estilos.caixaDestaque, { backgroundColor: t.fundo }]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Score de risco ${percentual} por cento, ${faixaRisco[faixa].rotulo}`}
      accessibilityValue={{ min: 0, max: 100, now: percentual }}
    >
      <Texto variante={destaque ? 'display' : 'titulo2'} style={{ color: t.texto }}>
        {percentual}
        <Texto variante={destaque ? 'titulo3' : 'legendaForte'} style={{ color: t.texto }}>
          %
        </Texto>
      </Texto>
      <View style={estilos.trilho}>
        <View style={[estilos.preenchimento, { width: `${percentual}%`, backgroundColor: t.texto }]} />
      </View>
      <Texto variante="rotulo" style={{ color: t.texto }}>
        score
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    alignItems: 'center',
    gap: espaco.xs,
    minWidth: tamanhos.medidorScore.compacto,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.sm,
    borderRadius: raio.md,
  },
  caixaDestaque: {
    minWidth: tamanhos.medidorScore.destaque,
    paddingVertical: espaco.lg,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.lg,
  },
  trilho: {
    alignSelf: 'stretch',
    height: espaco.xs,
    borderRadius: raio.pilula,
    backgroundColor: cores.trilhoSobreTom,
    overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: raio.pilula },
});
