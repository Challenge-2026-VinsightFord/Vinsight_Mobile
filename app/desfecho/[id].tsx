import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { comoErroApi, type Desfecho, type RegistroDesfecho } from '@/api';
import { Aviso, Botao, CampoTexto, Chip, Texto } from '@/components';
import { botaoDesfecho, efeitoDesfecho, statusLead } from '@/dominio/apresentacao';
import { formatarData } from '@/dominio/formatos';
import { hojeLocal } from '@/sincronizacao/armazenamento';
import { useRegistros } from '@/sincronizacao/ProvedorRegistros';
import { cores, espaco, opacidade, raio, tamanho, tons } from '@/theme';
import { confirmar } from '@/utils/confirmar';

const OPCOES: Desfecho[] = ['CONTATADO', 'SEM_SUCESSO', 'AGENDADO', 'RECUSADO', 'NUMERO_INVALIDO'];

const RETORNOS = [
  { rotulo: 'Amanhã', dias: 1 },
  { rotulo: 'Em 3 dias', dias: 3 },
  { rotulo: 'Em 1 semana', dias: 7 },
  { rotulo: 'Em 15 dias', dias: 15 },
];

const LIMITE_OBSERVACAO = 500;

/**
 * Registro do desfecho de um contato (US-48). Não depende de rede para abrir: os dados de
 * exibição vêm por parâmetro, e o envio passa pela fila local, que guarda o registro se a
 * conexão falhar.
 */
export default function RegistrarDesfecho() {
  const { id, cliente, veiculo } = useLocalSearchParams<{ id: string; cliente?: string; veiculo?: string }>();
  const leadId = Number(id);
  const nomeCliente = cliente ?? `Lead #${id}`;
  const { registrar } = useRegistros();

  const [desfecho, setDesfecho] = useState<Desfecho | null>(null);
  const [retornoDias, setRetornoDias] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<{ observacao?: string; proximoContato?: string }>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  const mantemAberto = desfecho != null && !efeitoDesfecho[desfecho].encerra;

  async function enviar() {
    if (!desfecho) return;
    if (efeitoDesfecho[desfecho].encerra) {
      const ok = await confirmar(
        'Encerrar o lead?',
        `"${botaoDesfecho[desfecho]}" encerra o lead de ${nomeCliente}. Depois não é possível registrar outro desfecho.`,
        'Encerrar',
      );
      if (!ok) return;
    }

    const registro: RegistroDesfecho = {
      desfecho,
      ...(observacao.trim() && { observacao: observacao.trim() }),
      ...(mantemAberto && retornoDias != null && { proximoContato: hojeLocal(retornoDias) }),
    };

    setEnviando(true);
    setErros({});
    setErroGeral(null);
    try {
      await registrar(leadId, registro, nomeCliente);
      // Enviado ou guardado para reenvio: nos dois casos o trabalho do consultor terminou aqui.
      // A fila mostra a confirmação (ou o aviso de pendência) e já não traz este lead.
      router.dismissTo('/');
    } catch (e) {
      const erro = comoErroApi(e);
      if (erro.codigo === 'validacao') {
        const porCampo = { observacao: erro.violacaoDo('observacao'), proximoContato: erro.violacaoDo('proximoContato') };
        setErros(porCampo);
        if (!porCampo.observacao && !porCampo.proximoContato) setErroGeral(erro.message);
      } else if (erro.codigo === 'conflito' || erro.codigo === 'nao-encontrado' || erro.codigo === 'outra-concessionaria') {
        // O lead mudou desde que foi aberto (encerrado por outro consultor, cliente revogou o consentimento...).
        setErroGeral(erro.message);
        setBloqueado(true);
      } else {
        setErroGeral(erro.message);
      }
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <View>
          <Texto variante="titulo2">{nomeCliente}</Texto>
          {veiculo && (
            <Texto variante="corpo" cor="textoSecundario">
              {veiculo}
            </Texto>
          )}
        </View>

        {erroGeral && (
          <Aviso tom="perigo" titulo={bloqueado ? 'Este lead não aceita mais registros' : 'Não foi possível registrar'} mensagem={erroGeral} />
        )}

        <View style={estilos.grupo} accessibilityRole="radiogroup" accessibilityLabel="Como foi o contato">
          <Texto variante="rotulo" cor="textoSuave">
            Como foi o contato?
          </Texto>
          {OPCOES.map((d) => (
            <OpcaoDesfecho key={d} desfecho={d} selecionado={desfecho === d} onPress={() => setDesfecho(d)} />
          ))}
        </View>

        {mantemAberto && (
          <View style={estilos.grupo}>
            <Texto variante="rotulo" cor="textoSuave">
              Próximo contato
            </Texto>
            <View style={estilos.chips}>
              <Chip rotulo="Sem data" selecionado={retornoDias === null} onPress={() => setRetornoDias(null)} />
              {RETORNOS.map((r) => (
                <Chip key={r.dias} rotulo={r.rotulo} selecionado={retornoDias === r.dias} onPress={() => setRetornoDias(r.dias)} />
              ))}
            </View>
            {retornoDias != null && (
              <Texto variante="legenda" cor="textoSecundario">
                Retornar em {formatarData(hojeLocal(retornoDias))}
              </Texto>
            )}
            {erros.proximoContato && (
              <Texto variante="legenda" cor="perigo">
                {erros.proximoContato}
              </Texto>
            )}
          </View>
        )}

        <CampoTexto
          rotulo="Observação (opcional)"
          placeholder="Ex.: cliente pediu orçamento da revisão de 40 mil"
          value={observacao}
          onChangeText={setObservacao}
          multiline
          maxLength={LIMITE_OBSERVACAO}
          autoCapitalize="sentences"
          erro={erros.observacao}
          dica={`${observacao.length}/${LIMITE_OBSERVACAO} · aparece no histórico do lead`}
        />
      </ScrollView>

      <View style={estilos.rodape}>
        <Botao
          titulo={bloqueado ? 'Voltar para a fila' : 'Registrar'}
          icone={bloqueado ? 'arrow-back' : 'checkmark'}
          larguraTotal
          desabilitado={!bloqueado && !desfecho}
          carregando={enviando}
          onPress={bloqueado ? () => router.dismissTo('/') : enviar}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function OpcaoDesfecho({ desfecho, selecionado, onPress }: { desfecho: Desfecho; selecionado: boolean; onPress: () => void }) {
  const { icone, tom } = statusLead[desfecho];
  const t = tons[tom];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionado }}
      accessibilityLabel={`${botaoDesfecho[desfecho]}. ${efeitoDesfecho[desfecho].descricao}`}
      style={({ pressed }) => [
        estilos.opcao,
        selecionado && { borderColor: cores.primaria, backgroundColor: cores.primariaSuave },
        pressed && { opacity: opacidade.pressionado },
      ]}
    >
      <View style={[estilos.iconeOpcao, { backgroundColor: t.fundo }]}>
        <Ionicons name={icone} size={tamanho.icone.md} color={t.texto} />
      </View>
      <View style={estilos.textoOpcao}>
        <Texto variante="corpoForte">{botaoDesfecho[desfecho]}</Texto>
        <Texto variante="legenda" cor="textoSecundario">
          {efeitoDesfecho[desfecho].descricao}
        </Texto>
      </View>
      <Ionicons
        name={selecionado ? 'radio-button-on' : 'radio-button-off'}
        size={tamanho.icone.lg}
        color={selecionado ? cores.primaria : cores.bordaForte}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.xl },
  grupo: { gap: espaco.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  iconeOpcao: {
    width: tamanho.alvoCompacto,
    height: tamanho.alvoCompacto,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoOpcao: { flex: 1, gap: espaco.xxs },
  rodape: {
    padding: espaco.lg,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    backgroundColor: cores.superficie,
  },
});
