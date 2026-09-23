import { StyleSheet, View } from 'react-native';
import type { CanalContato, DetalheLead, Visao360Cliente } from '@/api';
import { Aviso, Botao, Chip, LinhaInfo, Secao } from '@/components';
import { canalContato } from '@/dominio/apresentacao';
import { formatarData, formatarTelefone } from '@/dominio/formatos';
import { espaco } from '@/theme';
import { iniciarContato } from '@/utils/contato';

const CANAIS: CanalContato[] = ['TELEFONE', 'WHATSAPP', 'EMAIL'];

interface Props {
  lead: DetalheLead;
  /** `undefined` enquanto carrega ou se a visão 360° falhou. */
  cliente: Visao360Cliente | undefined;
  carregandoCliente: boolean;
}

/**
 * Canais de contato respeitando o consentimento (LGPD):
 * - sem consentimento ativo ou lead suprimido: todos os botões desabilitados, com aviso;
 * - canal fora da lista de consentidos: aquele botão desabilitado;
 * - canal preferido: botão principal, destacado.
 * Sem a visão 360° não dá para verificar o consentimento, então também não se oferece contato.
 */
export function SecaoContato({ lead, cliente, carregandoCliente }: Props) {
  const consentimento = cliente?.consentimento;
  const bloqueado = !!lead.supressao || !consentimento?.ativo;
  const preferido = cliente?.canalPreferido ?? null;

  const valorDo = (canal: CanalContato) =>
    canal === 'EMAIL' ? (cliente?.emailMascarado ?? '') : (cliente?.telefoneMascarado ?? lead.cliente.telefoneMascarado);

  return (
    <Secao
      titulo="Contato"
      icone="chatbubbles"
      extra={preferido && <Chip rotulo={`Prefere ${canalContato[preferido].rotulo}`} tom="marca" icone={canalContato[preferido].icone} />}
    >
      {lead.supressao ? (
        <Aviso
          tom="perigo"
          icone="hand-left"
          titulo="Contato bloqueado pela LGPD"
          mensagem={`O cliente revogou o consentimento em ${formatarData(lead.supressao.em)}. Este lead não deve ser contatado.`}
        />
      ) : cliente && !consentimento?.ativo ? (
        <Aviso
          tom="perigo"
          icone="hand-left"
          titulo="Sem consentimento de contato"
          mensagem="O cliente não autorizou contato. Os botões ficam bloqueados conforme a LGPD."
        />
      ) : !cliente && !carregandoCliente ? (
        <Aviso
          tom="alerta"
          mensagem="Não foi possível verificar o consentimento do cliente. O contato fica bloqueado até a verificação."
        />
      ) : null}

      <View style={estilos.dados}>
        <LinhaInfo rotulo="Telefone" valor={formatarTelefone(cliente?.telefoneMascarado ?? lead.cliente.telefoneMascarado)} />
        <LinhaInfo rotulo="E-mail" valor={cliente?.emailMascarado} />
        {consentimento?.ativo && (
          <LinhaInfo
            rotulo="Consentimento"
            valor={`Ativo para ${consentimento.canais.map((c) => canalContato[c].rotulo).join(', ')}${
              consentimento.atualizadoEm ? ` · desde ${formatarData(consentimento.atualizadoEm)}` : ''
            }`}
          />
        )}
      </View>

      <View style={estilos.botoes}>
        {CANAIS.map((canal) => {
          const permitido = !bloqueado && !!consentimento?.canais.includes(canal);
          const { rotulo, icone } = canalContato[canal];
          return (
            <Botao
              key={canal}
              titulo={canal === 'TELEFONE' ? 'Ligar' : rotulo}
              icone={icone}
              variante={canal === preferido && permitido ? 'primario' : 'secundario'}
              desabilitado={!permitido}
              carregando={carregandoCliente && !cliente}
              compacto
              style={estilos.botao}
              accessibilityHint={permitido ? undefined : 'Canal sem consentimento do cliente'}
              onPress={() => iniciarContato(canal, valorDo(canal), lead.cliente.nome)}
            />
          );
        })}
      </View>
    </Secao>
  );
}

const estilos = StyleSheet.create({
  dados: { gap: espaco.md },
  botoes: { flexDirection: 'row', gap: espaco.sm },
  botao: { flex: 1, paddingHorizontal: espaco.sm },
});
