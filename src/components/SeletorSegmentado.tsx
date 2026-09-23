import { Pressable, StyleSheet, View } from 'react-native';
import { cores, espaco, opacidade, raio, sombra, tamanho } from '@/theme';
import { Texto } from './Texto';

export interface OpcaoSegmento<T extends string> {
  valor: T;
  rotulo: string;
}

export interface SeletorSegmentadoProps<T extends string> {
  opcoes: OpcaoSegmento<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotuloAcessivel: string;
}

/** Escolha exclusiva entre poucas opções (ex.: status da fila). */
export function SeletorSegmentado<T extends string>({ opcoes, valor, onChange, rotuloAcessivel }: SeletorSegmentadoProps<T>) {
  return (
    <View style={estilos.trilho} accessibilityRole="tablist" accessibilityLabel={rotuloAcessivel}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={o.rotulo}
            style={({ pressed }) => [estilos.segmento, ativo && estilos.ativo, pressed && { opacity: opacidade.pressionado }]}
          >
            <Texto variante="legendaForte" cor={ativo ? 'primaria' : 'textoSecundario'} numberOfLines={1}>
              {o.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    flexDirection: 'row',
    padding: espaco.xxs + 1,
    borderRadius: raio.md,
    backgroundColor: cores.superficieAlternativa,
  },
  segmento: {
    flex: 1,
    minHeight: tamanho.alvoCompacto,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.sm,
    borderRadius: raio.md - 2,
  },
  ativo: {
    backgroundColor: cores.superficie,
    ...sombra.sutil,
  },
});
