import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Aviso, Botao } from '@/components';
import { botaoDesfecho } from '@/dominio/apresentacao';
import { espaco } from '@/theme';
import { useRegistros } from './ProvedorRegistros';

const DURACAO_CONFIRMACAO_MS = 6000;

/**
 * Faixa de avisos sobre os registros de desfecho: confirmação do último registro, envios pendentes
 * (com "Enviar agora") e registros recusados pela API. Não renderiza nada quando não há o que dizer.
 */
export function AvisosRegistro() {
  const { ultimoRegistro, limparUltimoRegistro, pendentes, sincronizando, sincronizar, descartar } = useRegistros();

  useEffect(() => {
    if (!ultimoRegistro) return;
    const restante = DURACAO_CONFIRMACAO_MS - (Date.now() - ultimoRegistro.em);
    const timer = setTimeout(limparUltimoRegistro, Math.max(0, restante));
    return () => clearTimeout(timer);
  }, [ultimoRegistro, limparUltimoRegistro]);

  const aguardando = pendentes.filter((p) => !p.falha);
  const falhas = pendentes.filter((p) => p.falha);
  const confirmacao = ultimoRegistro?.resultado === 'enviado' ? ultimoRegistro : null;

  if (!confirmacao && !aguardando.length && !falhas.length) return null;

  return (
    <View style={estilos.pilha}>
      {confirmacao && (
        <Aviso
          tom="sucesso"
          titulo="Contato registrado"
          mensagem={`${botaoDesfecho[confirmacao.desfecho]} · ${confirmacao.clienteNome}`}
        />
      )}

      {aguardando.length > 0 && (
        <View style={estilos.bloco}>
          <Aviso
            tom="alerta"
            icone="cloud-upload"
            titulo={
              aguardando.length === 1 ? '1 registro aguardando envio' : `${aguardando.length} registros aguardando envio`
            }
            mensagem={`${aguardando.map((p) => p.clienteNome).join(', ')}. O envio é automático quando a conexão voltar.`}
          />
          <Botao
            titulo="Enviar agora"
            icone="refresh"
            variante="fantasma"
            compacto
            carregando={sincronizando}
            onPress={sincronizar}
            style={estilos.botao}
          />
        </View>
      )}

      {falhas.map((p) => (
        <View key={p.chave} style={estilos.bloco}>
          <Aviso
            tom="perigo"
            titulo={`Registro não aceito: ${p.clienteNome}`}
            mensagem={`${p.falha!.mensagem} O desfecho "${botaoDesfecho[p.registro.desfecho]}" não foi gravado.`}
          />
          <Botao titulo="Dispensar" variante="fantasma" compacto onPress={() => descartar(p.chave)} style={estilos.botao} />
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  pilha: { gap: espaco.sm },
  bloco: { gap: espaco.xxs },
  botao: { alignSelf: 'flex-start' },
});
