import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { clientesApi, leadsApi, veiculosApi } from '@/api';
import { ErroEmLinha, EstadoErro, Esqueleto, Secao, Tela, CartaoLeadEsqueleto } from '@/components';
import type { NomeIcone } from '@/dominio/apresentacao';
import { useRecurso } from '@/hooks/useRecurso';
import { ResumoLead } from '@/telas/detalheLead/ResumoLead';
import { SecaoCliente, SecaoContatosAnteriores } from '@/telas/detalheLead/SecaoCliente';
import { SecaoContato } from '@/telas/detalheLead/SecaoContato';
import { SecaoHistorico, SecaoVeiculo } from '@/telas/detalheLead/SecaoVeiculo';
import { cores, espaco } from '@/theme';

/**
 * Detalhe do lead com a visão 360°: lead (score e motivo), cliente (consentimento, relacionamento)
 * e veículo (garantia, revisão, histórico). As três chamadas são independentes: a fila já manda
 * clienteId e vin, então saem em paralelo, e a falha de uma não derruba as outras.
 */
export default function DetalheLeadTela() {
  const params = useLocalSearchParams<{ id: string; clienteId?: string; vin?: string }>();
  const id = Number(params.id);

  const lead = useRecurso(Number.isFinite(id) ? id : null, () => leadsApi.detalhar(id));
  // Aberto por link direto (sem os params da fila), esperamos o lead para saber cliente e veículo.
  const clienteId = Number(params.clienteId) || lead.dados?.cliente.id;
  const vin = params.vin || lead.dados?.vin;
  const cliente = useRecurso(clienteId, () => clientesApi.visao360(clienteId!));
  const veiculo = useRecurso(vin, () => veiculosApi.passaporte(vin!));

  const [atualizando, setAtualizando] = useState(false);
  async function atualizar() {
    setAtualizando(true);
    await Promise.all([lead.recarregar(), cliente.recarregar(), veiculo.recarregar()]);
    setAtualizando(false);
  }

  const titulo = <Stack.Screen options={{ title: lead.dados?.cliente.nome ?? 'Detalhe do lead' }} />;

  if (!lead.dados) {
    return (
      <Tela>
        {titulo}
        {lead.erro ? (
          <EstadoErro erro={lead.erro} onTentarNovamente={lead.recarregar} />
        ) : (
          <View style={estilos.pilha}>
            <CartaoLeadEsqueleto />
            <SecaoCarregando titulo="Contato" icone="chatbubbles" />
          </View>
        )}
      </Tela>
    );
  }

  return (
    <Tela semPadding>
      {titulo}
      <ScrollView
        contentContainerStyle={[estilos.conteudo, estilos.pilha]}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[cores.primaria]} tintColor={cores.primaria} />
        }
      >
        <ResumoLead lead={lead.dados} />
        <SecaoContato lead={lead.dados} cliente={cliente.dados} carregandoCliente={cliente.carregando} />

        {veiculo.dados ? (
          <>
            <SecaoVeiculo veiculo={veiculo.dados} />
            <SecaoHistorico veiculo={veiculo.dados} />
          </>
        ) : veiculo.erro ? (
          <Secao titulo="Veículo" icone="car-sport">
            <ErroEmLinha erro={veiculo.erro} onTentarNovamente={veiculo.recarregar} />
          </Secao>
        ) : (
          <SecaoCarregando titulo="Veículo" icone="car-sport" />
        )}

        {cliente.dados ? (
          <SecaoCliente cliente={cliente.dados} vinAtual={lead.dados.vin} />
        ) : cliente.erro ? (
          <Secao titulo="Cliente" icone="person">
            <ErroEmLinha erro={cliente.erro} onTentarNovamente={cliente.recarregar} />
          </Secao>
        ) : (
          <SecaoCarregando titulo="Cliente" icone="person" />
        )}

        <SecaoContatosAnteriores lead={lead.dados} />
      </ScrollView>
    </Tela>
  );
}

function SecaoCarregando({ titulo, icone }: { titulo: string; icone: NomeIcone }) {
  return (
    <Secao titulo={titulo} icone={icone}>
      <Esqueleto largura="50%" />
      <Esqueleto />
      <Esqueleto largura="70%" />
    </Secao>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: espaco.lg, paddingBottom: espaco.xxxl },
  pilha: { gap: espaco.lg },
});
