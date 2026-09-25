import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { ItemHistoricoServico } from '@/api';
import { tipoServico } from '@/dominio/apresentacao';
import { formatarData, formatarMoeda } from '@/dominio/formatos';
import { cores, espaco, raio, tamanho } from '@/theme';
import { Chip } from './Chip';
import { Texto } from './Texto';

export interface LinhaDoTempoProps {
  itens: ItemHistoricoServico[]; // mais recente primeiro, como vem da API
}

/**
 * Histórico de ordens de serviço em linha do tempo. Serviço feito fora da rede Ford aparece
 * em destaque: é exatamente a receita que a concessionária quer recuperar.
 */
export function LinhaDoTempo({ itens }: LinhaDoTempoProps) {
  return (
    <View>
      {itens.map((item, i) => {
        const ultimo = i === itens.length - 1;
        const corMarco = item.naRede ? cores.primaria : cores.alerta;
        const servico = tipoServico[item.tipoServico] ?? { rotulo: item.tipoServico, icone: 'construct' as const };
        return (
          <View key={item.id} style={estilos.item}>
            <View style={estilos.trilha}>
              <View style={[estilos.marco, { backgroundColor: corMarco }]}>
                <Ionicons name={servico.icone} size={tamanho.icone.sm - 2} color={cores.sobrePrimaria} />
              </View>
              {!ultimo && <View style={estilos.fio} />}
            </View>
            <View style={[estilos.conteudo, !ultimo && estilos.espacoAbaixo]}>
              <View style={estilos.cabecalho}>
                <Texto variante="legendaForte" cor="textoSecundario">
                  {formatarData(item.data)}
                </Texto>
                <Texto variante="legendaForte" cor="textoSecundario">
                  {formatarMoeda(item.valor)}
                </Texto>
              </View>
              <Texto variante="corpoForte">{item.descricao}</Texto>
              <Texto variante="legenda" cor="textoSuave">
                {servico.rotulo}
                {item.naRede && item.concessionaria ? ` · ${item.concessionaria}` : ''}
              </Texto>
              {!item.naRede && <Chip rotulo="Oficina independente" tom="alerta" icone="exit" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const MARCO = tamanho.icone.lg;

const estilos = StyleSheet.create({
  item: { flexDirection: 'row', gap: espaco.md },
  trilha: { alignItems: 'center', width: MARCO },
  marco: {
    width: MARCO,
    height: MARCO,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fio: { flex: 1, width: 2, backgroundColor: cores.borda, marginVertical: espaco.xxs },
  conteudo: { flex: 1, gap: espaco.xxs },
  espacoAbaixo: { paddingBottom: espaco.lg },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between' },
});
