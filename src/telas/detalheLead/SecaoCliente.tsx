import { StyleSheet, View } from 'react-native';
import type { DetalheLead, Visao360Cliente } from '@/api';
import { ChipStatusLead, LinhaInfo, Secao, Texto } from '@/components';
import { formatarData, formatarDataHora, formatarMoeda, formatarPlaca } from '@/dominio/formatos';
import { cores, espaco } from '@/theme';

/** Visão 360° do cliente: documento, relacionamento e outros veículos. */
export function SecaoCliente({ cliente, vinAtual }: { cliente: Visao360Cliente; vinAtual: string }) {
  const outros = cliente.veiculos.filter((v) => v.vin !== vinAtual);
  const { resumoHistorico: r } = cliente;

  return (
    <Secao titulo="Cliente" icone="person">
      <View style={estilos.grade}>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="CPF" valor={cliente.documentoMascarado} />
        </View>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="Último NPS" valor={cliente.ultimoNps != null ? `${cliente.ultimoNps} / 10` : null} />
        </View>
      </View>
      <View style={estilos.grade}>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="Ordens de serviço" valor={String(r.totalOrdens)} />
        </View>
        <View style={estilos.celula}>
          <LinhaInfo rotulo="Ticket médio" valor={formatarMoeda(r.ticketMedio)} />
        </View>
      </View>
      <LinhaInfo rotulo="Última visita" valor={r.ultimaVisita ? formatarData(r.ultimaVisita) : null} />
      {outros.length > 0 && (
        <LinhaInfo rotulo="Outros veículos">
          {outros.map((v) => (
            <Texto key={v.vin} variante="corpoForte">
              {v.modelo} {v.ano} · {formatarPlaca(v.placa)}
            </Texto>
          ))}
        </LinhaInfo>
      )}
    </Secao>
  );
}

/** Registros anteriores deste lead (quem falou, quando e o que ficou combinado). */
export function SecaoContatosAnteriores({ lead }: { lead: DetalheLead }) {
  if (!lead.desfechos.length) return null;
  return (
    <Secao titulo="Contatos anteriores" icone="chatbox-ellipses">
      {lead.desfechos.map((d, i) => (
        <View key={`${d.registradoEm}-${i}`} style={[estilos.desfecho, i > 0 && estilos.divisor]}>
          <View style={estilos.cabecalhoDesfecho}>
            <ChipStatusLead status={d.desfecho} />
            <Texto variante="legenda" cor="textoSuave">
              {formatarDataHora(d.registradoEm)}
            </Texto>
          </View>
          {d.observacao && <Texto variante="corpo">{d.observacao}</Texto>}
          <Texto variante="legenda" cor="textoSecundario">
            por {d.registradoPor}
            {d.proximoContato ? ` · retornar em ${formatarData(d.proximoContato)}` : ''}
          </Texto>
        </View>
      ))}
    </Secao>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: 'row', gap: espaco.md },
  celula: { flex: 1 },
  desfecho: { gap: espaco.xs },
  divisor: { borderTopWidth: 1, borderTopColor: cores.borda, paddingTop: espaco.md },
  cabecalhoDesfecho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
