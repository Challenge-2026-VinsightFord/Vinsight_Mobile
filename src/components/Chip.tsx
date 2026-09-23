import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { FaixaRisco, PerfilComportamental, StatusLead } from '@/api';
import * as apresentacao from '@/dominio/apresentacao';
import type { NomeIcone } from '@/dominio/apresentacao';
import { cores, espaco, opacidade, raio, tamanho, tons, type Tom } from '@/theme';
import { Texto } from './Texto';

export interface ChipProps {
  rotulo: string;
  tom?: Tom;
  icone?: NomeIcone;
  /** Chip de filtro: tocável, com estado selecionado. */
  onPress?: () => void;
  selecionado?: boolean;
}

export function Chip({ rotulo, tom = 'neutro', icone, onPress, selecionado }: ChipProps) {
  const t = tons[tom];

  if (onPress) {
    const corTexto = selecionado ? cores.sobrePrimaria : cores.textoSecundario;
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selecionado }}
        accessibilityLabel={rotulo}
        hitSlop={espaco.xs}
        style={({ pressed }) => [
          estilos.chip,
          estilos.filtro,
          selecionado
            ? { backgroundColor: cores.primaria, borderColor: cores.primaria }
            : { backgroundColor: cores.superficie, borderColor: cores.borda },
          pressed && { opacity: opacidade.pressionado },
        ]}
      >
        {icone && <Ionicons name={icone} size={tamanho.icone.sm} color={corTexto} />}
        <Texto variante="legendaForte" style={{ color: corTexto }}>
          {rotulo}
        </Texto>
      </Pressable>
    );
  }

  return (
    <View style={[estilos.chip, { backgroundColor: t.fundo, borderColor: t.borda }]} accessibilityLabel={rotulo}>
      {icone && <Ionicons name={icone} size={tamanho.icone.sm - 2} color={t.texto} />}
      <Texto variante="legendaForte" style={{ color: t.texto }}>
        {rotulo}
      </Texto>
    </View>
  );
}

// Atalhos para os enums do contrato: a tela passa o código da API e o chip resolve o resto.

export const ChipRisco = ({ faixa }: { faixa: FaixaRisco }) => <Chip {...apresentacao.faixaRisco[faixa]} />;

export const ChipStatusLead = ({ status }: { status: StatusLead }) => <Chip {...apresentacao.statusLead[status]} />;

export const ChipPerfil = ({ perfil }: { perfil: PerfilComportamental }) => (
  <Chip {...apresentacao.perfilComportamental[perfil]} />
);

const estilos = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaco.xs,
    paddingHorizontal: espaco.sm + 2,
    paddingVertical: espaco.xs,
    borderRadius: raio.pilula,
    borderWidth: 1,
  },
  filtro: {
    minHeight: tamanho.alvoCompacto,
    paddingHorizontal: espaco.md,
  },
});
