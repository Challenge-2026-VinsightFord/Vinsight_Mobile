import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { NomeIcone } from '@/dominio/apresentacao';
import { cores, espaco, opacidade, raio, tamanho, tipografia } from '@/theme';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

export interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  carregando?: boolean;
  desabilitado?: boolean;
  compacto?: boolean;
  larguraTotal?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const estilosVariante: Record<Variante, { fundo: string; texto: string; borda: string }> = {
  primario: { fundo: cores.primaria, texto: cores.sobrePrimaria, borda: cores.primaria },
  secundario: { fundo: cores.superficie, texto: cores.primaria, borda: cores.primaria },
  fantasma: { fundo: 'transparent', texto: cores.primaria, borda: 'transparent' },
  perigo: { fundo: cores.perigo, texto: cores.sobrePrimaria, borda: cores.perigo },
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
  compacto = false,
  larguraTotal = false,
  style,
  accessibilityHint,
}: BotaoProps) {
  const v = estilosVariante[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        estilos.base,
        compacto && estilos.compacto,
        larguraTotal && estilos.larguraTotal,
        { backgroundColor: v.fundo, borderColor: v.borda },
        desabilitado && { opacity: opacidade.desabilitado },
        pressed && { opacity: opacidade.pressionado },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={estilos.conteudo}>
          {icone && <Ionicons name={icone} size={tamanho.icone.md} color={v.texto} />}
          <Texto variante={compacto ? 'legendaForte' : 'botao'} style={{ color: v.texto }} numberOfLines={1}>
            {titulo}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: tamanho.alvoToque,
    paddingHorizontal: espaco.xl,
    borderRadius: raio.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compacto: {
    minHeight: tamanho.alvoCompacto,
    paddingHorizontal: espaco.md,
  },
  larguraTotal: { alignSelf: 'stretch' },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: tipografia.botao.lineHeight,
  },
});
