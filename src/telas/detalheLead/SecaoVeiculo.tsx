import { StyleSheet, View } from 'react-native';
import type { PassaporteVeiculo } from '@/api';
import { BarraProgresso, Chip, LinhaDoTempo, LinhaInfo, Secao, Texto } from '@/components';
import { situacaoRevisao, statusGarantia } from '@/dominio/apresentacao';
import { formatarData, formatarDataHora, formatarKm, formatarPercentual } from '@/dominio/formatos';
import { cores, espaco, raio, tons } from '@/theme';

/** Passaporte do veículo: garantia, revisão, aderência à rede e telemetria. */
export function SecaoVeiculo({ veiculo }: { veiculo: PassaporteVeiculo }) {
  const { garantia, proximaRevisaoPrevista: revisao, ultimaTelemetria: telemetria, aderenciaRede } = veiculo;
  const corAderencia =
    aderenciaRede == null ? cores.textoSuave : aderenciaRede >= 0.7 ? cores.sucesso : aderenciaRede >= 0.4 ? cores.alerta : cores.perigo;

  return (
    <Secao titulo="Veículo" icone="car-sport">
      <View style={estilos.grade}>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="Quilometragem estimada" valor={formatarKm(veiculo.quilometragemEstimada)} />
        </View>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="Cor" valor={veiculo.cor} />
        </View>
      </View>
      <LinhaInfo rotulo="VIN" valor={veiculo.vin} selecionavel />

      <LinhaInfo rotulo="Garantia">
        {garantia ? (
          <View style={estilos.linhaChip}>
            <Chip {...statusGarantia[garantia.status]} />
            <Texto variante="legenda" cor="textoSecundario">
              {garantia.status === 'ENCERRADA'
                ? `encerrou em ${formatarData(garantia.dataLimite)}`
                : `até ${formatarData(garantia.dataLimite)} · ${garantia.mesesRestantes} ${garantia.mesesRestantes === 1 ? 'mês' : 'meses'}`}
            </Texto>
          </View>
        ) : (
          <Texto variante="corpoForte">—</Texto>
        )}
      </LinhaInfo>

      <LinhaInfo rotulo="Próxima revisão">
        {revisao ? (
          <View style={estilos.linhaChip}>
            <Chip {...situacaoRevisao[revisao.situacao]} />
            <Texto variante="legenda" cor="textoSecundario">
              {[revisao.km != null && formatarKm(revisao.km), revisao.dataEstimada && formatarData(revisao.dataEstimada)]
                .filter(Boolean)
                .join(' · ')}
            </Texto>
          </View>
        ) : (
          <Texto variante="corpoForte">—</Texto>
        )}
      </LinhaInfo>

      <LinhaInfo rotulo="Aderência à rede Ford">
        {aderenciaRede != null ? (
          <View style={estilos.aderencia}>
            <View style={estilos.flex}>
              <BarraProgresso
                valor={aderenciaRede}
                cor={corAderencia}
                rotuloAcessivel={`${formatarPercentual(aderenciaRede)} dos serviços feitos na rede Ford`}
              />
            </View>
            <Texto variante="corpoForte" style={{ color: corAderencia }}>
              {formatarPercentual(aderenciaRede)}
            </Texto>
          </View>
        ) : (
          <Texto variante="corpoForte">—</Texto>
        )}
        <Texto variante="legenda" cor="textoSuave">
          Parte dos serviços feita em concessionárias Ford
        </Texto>
      </LinhaInfo>

      <LinhaInfo rotulo="Telemetria (FordPass Connect)">
        {telemetria ? (
          <View style={estilos.telemetria}>
            <Texto variante="legenda" cor="textoSecundario">
              Última leitura em {formatarDataHora(telemetria.recebidaEm)}
            </Texto>
            {telemetria.codigosFalha.length ? (
              <View style={estilos.linhaChip}>
                {telemetria.codigosFalha.map((c) => (
                  <Chip key={c} rotulo={c} tom="perigo" icone="warning" />
                ))}
              </View>
            ) : (
              <Chip rotulo="Sem códigos de falha" tom="sucesso" icone="checkmark-circle" />
            )}
          </View>
        ) : (
          <Texto variante="corpoForte">Sem dados de telemetria</Texto>
        )}
      </LinhaInfo>
    </Secao>
  );
}

/** Histórico de ordens de serviço, com resumo de quanto foi feito fora da rede. */
export function SecaoHistorico({ veiculo }: { veiculo: PassaporteVeiculo }) {
  const fora = veiculo.historico.filter((h) => !h.naRede).length;
  return (
    <Secao
      titulo="Histórico de serviços"
      icone="time"
      extra={
        <Texto variante="legendaForte" cor="textoSuave">
          {veiculo.historico.length} {veiculo.historico.length === 1 ? 'ordem' : 'ordens'}
        </Texto>
      }
    >
      {fora > 0 && (
        <View style={[estilos.resumoFora, { backgroundColor: tons.alerta.fundo }]}>
          <Texto variante="legendaForte" cor="alerta">
            {fora} de {veiculo.historico.length} serviços feitos fora da rede Ford
          </Texto>
        </View>
      )}
      {veiculo.historico.length ? (
        <LinhaDoTempo itens={veiculo.historico} />
      ) : (
        <Texto variante="corpo" cor="textoSuave">
          Nenhuma ordem de serviço registrada.
        </Texto>
      )}
    </Secao>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: 'row', gap: espaco.md },
  celula: { flex: 1 },
  linhaChip: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espaco.sm },
  aderencia: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  telemetria: { gap: espaco.sm },
  resumoFora: { padding: espaco.sm, borderRadius: raio.md },
  flex: { flex: 1 },
});
