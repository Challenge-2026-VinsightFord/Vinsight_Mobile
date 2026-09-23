import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { FaixaRisco, ItemFila, StatusLead } from '@/api';
import {
  Aviso,
  Botao,
  CampoBusca,
  CartaoLead,
  CartaoLeadEsqueleto,
  Chip,
  EstadoErro,
  EstadoVazio,
  SeletorSegmentado,
  Texto,
  type OpcaoSegmento,
} from '@/components';
import { faixaRisco } from '@/dominio/apresentacao';
import { primeiroNome } from '@/dominio/formatos';
import { useDebounce } from '@/hooks/useDebounce';
import { useFilaLeads } from '@/hooks/useFilaLeads';
import { useUsuario } from '@/sessao/ProvedorSessao';
import { cores, espaco, tamanho } from '@/theme';

// Os três status que ainda aceitam contato. "?status=OPEN" sozinho esconderia os leads já
// trabalhados que continuam abertos (CONTATADO e SEM_SUCESSO).
type StatusFila = Extract<StatusLead, 'OPEN' | 'CONTATADO' | 'SEM_SUCESSO'>;

const OPCOES_STATUS: OpcaoSegmento<StatusFila>[] = [
  { valor: 'OPEN', rotulo: 'A contatar' },
  { valor: 'CONTATADO', rotulo: 'Retornos' },
  { valor: 'SEM_SUCESSO', rotulo: 'Não atenderam' },
];

const RISCOS: FaixaRisco[] = ['ALTO', 'MEDIO', 'BAIXO'];

const DESCRICAO_TOTAL: Record<StatusFila, [string, string]> = {
  OPEN: ['lead para contatar', 'leads para contatar'],
  CONTATADO: ['retorno pendente', 'retornos pendentes'],
  SEM_SUCESSO: ['cliente sem resposta', 'clientes sem resposta'],
};

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Busca por nome do cliente, placa (com ou sem hífen), modelo ou VIN. */
function corresponde(lead: ItemFila, termo: string) {
  const t = normalizar(termo).replace(/-/g, '');
  return [lead.cliente.nome, lead.placa, lead.veiculo.modelo, lead.vin].some((campo) =>
    normalizar(campo).replace(/-/g, '').includes(t),
  );
}

function saudacao() {
  const hora = new Date().getHours();
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Fila() {
  const usuario = useUsuario();
  const [status, setStatus] = useState<StatusFila>('OPEN');
  const [risco, setRisco] = useState<FaixaRisco | null>(null);
  const [busca, setBusca] = useState('');
  const termo = useDebounce(busca.trim(), 250);

  const fila = useFilaLeads({ status, risco });

  // A API não busca texto na fila: com busca ativa, trazemos as páginas restantes e filtramos aqui.
  const { temMais, carregandoMais, erroMais, carregarMais } = fila;
  useEffect(() => {
    if (termo && temMais && !carregandoMais && !erroMais) carregarMais();
  }, [termo, temMais, carregandoMais, erroMais, carregarMais]);

  const visiveis = useMemo(
    () => (termo ? fila.itens.filter((l) => corresponde(l, termo)) : fila.itens),
    [fila.itens, termo],
  );

  const abrirLead = useCallback((lead: ItemFila) => {
    router.push({ pathname: '/lead/[id]', params: { id: String(lead.id) } });
  }, []);

  const [singular, plural] = DESCRICAO_TOTAL[status];

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <Texto variante="titulo2">
        {saudacao()}, {primeiroNome(usuario.nome)}
      </Texto>
      {fila.fase === 'pronto' && (
        <Texto variante="corpo" cor="textoSecundario">
          {usuario.concessionaria ? `${usuario.concessionaria.nome} · ` : ''}
          <Texto variante="corpoForte" cor="primaria">
            {fila.total}
          </Texto>{' '}
          {fila.total === 1 ? singular : plural}
          {risco ? ` (${faixaRisco[risco].rotulo.toLowerCase()})` : ''}
        </Texto>
      )}
      <View style={estilos.ordenacao}>
        <Ionicons name="sparkles" size={tamanho.icone.sm} color={cores.destaque} />
        <Texto variante="legenda" cor="textoSuave">
          Ordenada pelo score de evasão da IA
        </Texto>
      </View>
      {fila.erroAtualizacao != null && (
        <Aviso tom="alerta" mensagem="Não foi possível atualizar a fila. Mostrando a última versão carregada." />
      )}
    </View>
  );

  function renderizarVazio() {
    if (fila.fase === 'carregando') {
      return (
        <View style={estilos.lista}>
          {[0, 1, 2].map((i) => (
            <CartaoLeadEsqueleto key={i} />
          ))}
        </View>
      );
    }
    if (fila.fase === 'erro') return <EstadoErro erro={fila.erro} onTentarNovamente={fila.tentarNovamente} />;
    if (termo && fila.temMais) return <Carregando mensagem="Buscando em toda a fila…" />;
    if (termo) {
      return (
        <EstadoVazio
          icone="search"
          titulo="Nenhum lead encontrado"
          mensagem={`Nada corresponde a "${termo}". A busca procura por nome, placa, modelo e VIN.`}
          acao={{ titulo: 'Limpar busca', onPress: () => setBusca('') }}
        />
      );
    }
    if (risco) {
      return (
        <EstadoVazio
          icone="funnel-outline"
          titulo="Nenhum lead com esse filtro"
          mensagem={`Não há leads de ${faixaRisco[risco].rotulo.toLowerCase()} nesta lista.`}
          acao={{ titulo: 'Ver todos os riscos', onPress: () => setRisco(null) }}
        />
      );
    }
    return (
      <EstadoVazio
        icone="checkmark-done-circle"
        titulo={status === 'OPEN' ? 'Fila zerada!' : 'Nada por aqui'}
        mensagem={
          status === 'OPEN'
            ? 'Todos os leads do dia já foram trabalhados. Puxe para baixo para verificar novos.'
            : 'Nenhum lead neste status agora.'
        }
      />
    );
  }

  function renderizarRodape() {
    if (fila.carregandoMais) return <Carregando mensagem="Carregando mais leads…" />;
    if (fila.erroMais != null) {
      return (
        <View style={estilos.rodape}>
          <Aviso tom="alerta" mensagem="Não foi possível carregar mais leads." />
          <Botao titulo="Tentar de novo" icone="refresh" variante="fantasma" compacto onPress={fila.carregarMais} />
        </View>
      );
    }
    if (fila.fase === 'pronto' && !fila.temMais && visiveis.length > 0) {
      return (
        <Texto variante="legenda" cor="textoSuave" alinhamento="center" style={estilos.fim}>
          {termo ? `${visiveis.length} de ${fila.total} leads` : 'Fim da fila'}
        </Texto>
      );
    }
    return null;
  }

  return (
    <View style={estilos.tela}>
      <View style={estilos.controles}>
        <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por cliente, placa ou modelo" />
        <SeletorSegmentado
          opcoes={OPCOES_STATUS}
          valor={status}
          onChange={setStatus}
          rotuloAcessivel="Status dos leads"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
          <Chip rotulo="Todos os riscos" selecionado={risco === null} onPress={() => setRisco(null)} />
          {RISCOS.map((r) => (
            <Chip
              key={r}
              rotulo={faixaRisco[r].rotulo}
              icone={faixaRisco[r].icone}
              selecionado={risco === r}
              onPress={() => setRisco(risco === r ? null : r)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        // Remonta a lista a cada filtro: volta ao topo e zera o controle interno do onEndReached,
        // que só dispara uma vez por altura de conteúdo (sem isso a paginação trava ao voltar
        // para um filtro com a mesma quantidade de itens).
        key={`${status}-${risco ?? 'todos'}`}
        data={fila.fase === 'pronto' ? visiveis : []}
        keyExtractor={(l) => String(l.id)}
        renderItem={({ item }) => <CartaoLead lead={item} onPress={abrirLead} />}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={renderizarVazio()}
        ListFooterComponent={renderizarRodape()}
        ItemSeparatorComponent={Separador}
        contentContainerStyle={estilos.conteudo}
        onEndReached={fila.carregarMais}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={fila.atualizando}
            onRefresh={fila.atualizar}
            colors={[cores.primaria]}
            tintColor={cores.primaria}
          />
        }
      />
    </View>
  );
}

function Separador() {
  return <View style={estilos.separador} />;
}

function Carregando({ mensagem }: { mensagem: string }) {
  return (
    <View style={estilos.carregando} accessibilityLabel={mensagem}>
      <ActivityIndicator color={cores.primaria} />
      <Texto variante="legenda" cor="textoSuave">
        {mensagem}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  controles: {
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
    paddingTop: espaco.md,
    paddingBottom: espaco.sm,
    backgroundColor: cores.fundo,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  chips: { gap: espaco.sm, paddingVertical: espaco.xxs },
  conteudo: { flexGrow: 1, padding: espaco.lg },
  cabecalho: { gap: espaco.xs, marginBottom: espaco.lg },
  ordenacao: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, marginTop: espaco.xxs },
  lista: { gap: espaco.md },
  separador: { height: espaco.md },
  rodape: { gap: espaco.sm, marginTop: espaco.lg },
  fim: { marginTop: espaco.xl },
  carregando: { alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.xl },
});
