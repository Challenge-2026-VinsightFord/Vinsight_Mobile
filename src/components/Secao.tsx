import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { NomeIcone } from '@/dominio/apresentacao';
import { cores, espaco, tamanho } from '@/theme';
import { Cartao } from './Cartao';
import { Texto } from './Texto';

export interface SecaoProps {
  titulo: string;
  icone: NomeIcone;
  /** Complemento à direita do título (ex.: contador, chip). */
  extra?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Cartão com título e ícone, para agrupar blocos de informação numa tela de detalhe. */
export function Secao({ titulo, icone, extra, children, style }: SecaoProps) {
  return (
    <Cartao style={[estilos.cartao, style]}>
      <View style={estilos.titulo} accessibilityRole="header">
        <Ionicons name={icone} size={tamanho.icone.md} color={cores.primaria} />
        <Texto variante="titulo3" style={estilos.flex}>
          {titulo}
        </Texto>
        {extra}
      </View>
      {children}
    </Cartao>
  );
}

export interface LinhaInfoProps {
  rotulo: string;
  valor?: string | null;
  /** Conteúdo livre no lugar do texto (chips, barras...). */
  children?: ReactNode;
  selecionavel?: boolean;
}

/** Par rótulo/valor dentro de uma Secao. Valores nulos aparecem como "—". */
export function LinhaInfo({ rotulo, valor, children, selecionavel }: LinhaInfoProps) {
  return (
    <View style={estilos.linha}>
      <Texto variante="legenda" cor="textoSuave">
        {rotulo}
      </Texto>
      {children ?? (
        <Texto variante="corpoForte" selectable={selecionavel}>
          {valor ?? '—'}
        </Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  flex: { flex: 1 },
  linha: { gap: espaco.xxs },
});
