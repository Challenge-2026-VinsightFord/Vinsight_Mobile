import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { DetalheLead } from '@/api';
import { Cartao, ChipPerfil, ChipRisco, ChipStatusLead, MedidorScore, Texto } from '@/components';
import { perfilComportamental } from '@/dominio/apresentacao';
import { formatarDataHora, formatarPlaca } from '@/dominio/formatos';
import { cores, espaco, raio, tamanho } from '@/theme';

/** Topo do detalhe: quem é, qual carro, e o score com o motivo da priorização. */
export function ResumoLead({ lead }: { lead: DetalheLead }) {
  const perfil = lead.perfilComportamental ? perfilComportamental[lead.perfilComportamental] : null;
  const nomeVeiculo = [lead.veiculo.modelo, lead.veiculo.versao].filter(Boolean).join(' ');

  return (
    <>
      <Cartao style={estilos.identificacao}>
        <View style={estilos.flex}>
          <Texto variante="titulo2">{lead.cliente.nome}</Texto>
          <Texto variante="corpo" cor="textoSecundario">
            {nomeVeiculo} · {lead.veiculo.ano}
          </Texto>
          <View style={estilos.placa}>
            <Texto variante="legendaForte">{formatarPlaca(lead.placa)}</Texto>
          </View>
          <View style={estilos.chips}>
            <ChipRisco faixa={lead.faixaRisco} />
            {lead.perfilComportamental && <ChipPerfil perfil={lead.perfilComportamental} />}
            <ChipStatusLead status={lead.status} />
          </View>
        </View>
        <MedidorScore score={lead.score} faixa={lead.faixaRisco} tamanho="destaque" />
      </Cartao>

      {/* O destaque da demo: o score sai do modelo de IA e chega à tela com o porquê. */}
      <View style={estilos.motivo} accessibilityRole="summary">
        <View style={estilos.tituloMotivo}>
          <Ionicons name="sparkles" size={tamanho.icone.md} color={cores.sobrePrimaria} />
          <Texto variante="rotulo" cor="sobrePrimariaSuave">
            Por que este cliente agora
          </Texto>
        </View>
        <Texto variante="titulo3" cor="sobrePrimaria">
          {lead.motivoContato}
        </Texto>
        {perfil && (
          <Texto variante="legenda" cor="sobrePrimariaSuave">
            Perfil {perfil.rotulo.toLowerCase()}: {perfil.descricao?.toLowerCase()}.
          </Texto>
        )}
        {lead.acaoRecomendada && (
          <View style={estilos.acao}>
            <Ionicons name="bulb" size={tamanho.icone.md} color={cores.primaria} />
            <View style={estilos.flex}>
              <Texto variante="rotulo" cor="textoSuave">
                Ação recomendada
              </Texto>
              <Texto variante="corpoForte" cor="primaria">
                {lead.acaoRecomendada}
              </Texto>
            </View>
          </View>
        )}
        <Texto variante="legenda" cor="sobrePrimariaSuave">
          Score calculado em {formatarDataHora(lead.geradoEm)}
        </Texto>
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  identificacao: { flexDirection: 'row', gap: espaco.md, alignItems: 'center' },
  flex: { flex: 1, gap: espaco.xs },
  placa: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.sm,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.bordaForte,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs, marginTop: espaco.xs },
  motivo: {
    gap: espaco.sm,
    padding: espaco.lg,
    borderRadius: raio.lg,
    backgroundColor: cores.primaria,
  },
  tituloMotivo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  acao: {
    flexDirection: 'row',
    gap: espaco.sm,
    padding: espaco.md,
    marginVertical: espaco.xs,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
});
