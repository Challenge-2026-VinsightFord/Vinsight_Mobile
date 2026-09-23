import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ItemFila } from '@/api';
import { faixaRisco } from '@/dominio/apresentacao';
import { formatarPlaca } from '@/dominio/formatos';
import { cores, espaco, raio, tamanho } from '@/theme';
import { Cartao } from './Cartao';
import { ChipPerfil, ChipRisco, ChipStatusLead } from './Chip';
import { MedidorScore } from './MedidorScore';
import { Texto } from './Texto';

export interface CartaoLeadProps {
  lead: ItemFila;
  onPress?: (lead: ItemFila) => void;
}

/** Item da fila de leads: veículo, cliente, risco, motivo do contato e ação recomendada. */
export const CartaoLead = memo(function CartaoLead({ lead, onPress }: CartaoLeadProps) {
  const { veiculo, cliente } = lead;
  const nomeVeiculo = [veiculo.modelo, veiculo.versao].filter(Boolean).join(' ');

  return (
    <Cartao
      onPress={onPress && (() => onPress(lead))}
      accessibilityLabel={`${cliente.nome}, ${nomeVeiculo} ${veiculo.ano}, ${faixaRisco[lead.faixaRisco].rotulo}. ${lead.motivoContato}`}
    >
      <View style={estilos.topo}>
        <View style={estilos.identificacao}>
          <Texto variante="titulo3" numberOfLines={1}>
            {cliente.nome}
          </Texto>
          <View style={estilos.linhaVeiculo}>
            <Ionicons name="car-sport" size={tamanho.icone.sm} color={cores.textoSuave} />
            <Texto variante="legenda" cor="textoSecundario" numberOfLines={1} style={estilos.flex}>
              {nomeVeiculo} · {veiculo.ano} · {formatarPlaca(lead.placa)}
            </Texto>
          </View>
          <View style={estilos.chips}>
            <ChipRisco faixa={lead.faixaRisco} />
            {lead.perfilComportamental && <ChipPerfil perfil={lead.perfilComportamental} />}
            {lead.status !== 'OPEN' && <ChipStatusLead status={lead.status} />}
          </View>
        </View>
        <MedidorScore score={lead.score} faixa={lead.faixaRisco} />
      </View>

      <View style={estilos.divisor} />

      <View style={estilos.bloco}>
        <Texto variante="rotulo" cor="textoSuave">
          Por que contatar
        </Texto>
        <Texto variante="corpo" numberOfLines={3}>
          {lead.motivoContato}
        </Texto>
      </View>

      {lead.acaoRecomendada && (
        <View style={estilos.acao}>
          <Ionicons name="bulb" size={tamanho.icone.md} color={cores.primaria} />
          <Texto variante="legendaForte" cor="primaria" style={estilos.flex} numberOfLines={2}>
            {lead.acaoRecomendada}
          </Texto>
        </View>
      )}
    </Cartao>
  );
});

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
  identificacao: { flex: 1, gap: espaco.xs },
  linhaVeiculo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs, marginTop: espaco.xs },
  divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espaco.md },
  bloco: { gap: espaco.xxs },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginTop: espaco.md,
    padding: espaco.md,
    borderRadius: raio.md,
    backgroundColor: cores.primariaSuave,
  },
  flex: { flex: 1 },
});
