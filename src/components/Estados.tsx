import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { comoErroApi, type ErroApi } from '@/api';
import type { NomeIcone } from '@/dominio/apresentacao';
import { cores, espaco, raio, tamanho, tons, type Tom } from '@/theme';
import { Botao } from './Botao';
import { Texto } from './Texto';

/**
 * Estados de tela: carregando, vazio e erro. Toda tela que busca dados usa os três,
 * para o usuário nunca ficar diante de uma tela em branco.
 */

interface EstadoBaseProps {
  icone: NomeIcone;
  tom?: Tom;
  titulo: string;
  mensagem?: string;
  acao?: { titulo: string; onPress: () => void; icone?: NomeIcone };
  rodape?: string;
}

function EstadoBase({ icone, tom = 'marca', titulo, mensagem, acao, rodape }: EstadoBaseProps) {
  const t = tons[tom];
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <View style={[estilos.circulo, { backgroundColor: t.fundo }]}>
        <Ionicons name={icone} size={tamanho.icone.xl} color={t.texto} />
      </View>
      <Texto variante="titulo3" alinhamento="center">
        {titulo}
      </Texto>
      {mensagem && (
        <Texto variante="corpo" cor="textoSecundario" alinhamento="center" style={estilos.mensagem}>
          {mensagem}
        </Texto>
      )}
      {acao && (
        <Botao titulo={acao.titulo} icone={acao.icone} variante="secundario" onPress={acao.onPress} style={estilos.acao} />
      )}
      {rodape && (
        <Texto variante="legenda" cor="textoSuave" alinhamento="center" selectable style={estilos.rodape}>
          {rodape}
        </Texto>
      )}
    </View>
  );
}

export function EstadoCarregando({ mensagem = 'Carregando…' }: { mensagem?: string }) {
  return (
    <View style={estilos.centro} accessibilityRole="progressbar" accessibilityLabel={mensagem}>
      <ActivityIndicator size="large" color={cores.primaria} />
      <Texto variante="corpo" cor="textoSecundario" style={estilos.mensagem}>
        {mensagem}
      </Texto>
    </View>
  );
}

export interface EstadoVazioProps {
  titulo: string;
  mensagem?: string;
  icone?: NomeIcone;
  acao?: EstadoBaseProps['acao'];
}

export function EstadoVazio({ titulo, mensagem, icone = 'file-tray-outline', acao }: EstadoVazioProps) {
  return <EstadoBase icone={icone} tom="neutro" titulo={titulo} mensagem={mensagem} acao={acao} />;
}

/** Título, texto e ícone para cada família de erro. A decisão é pelo `codigo`, nunca pela mensagem. */
function descreverErro(erro: ErroApi): Omit<EstadoBaseProps, 'acao'> & { podeRepetir: boolean } {
  switch (erro.codigo) {
    case 'sem-conexao':
    case 'tempo-esgotado':
      return {
        icone: 'cloud-offline',
        tom: 'alerta',
        titulo: 'Sem conexão',
        mensagem: 'Não foi possível falar com o servidor. Verifique a internet e tente novamente.',
        podeRepetir: true,
      };
    case 'perfil-sem-permissao':
      return {
        icone: 'lock-closed',
        tom: 'neutro',
        titulo: 'Acesso restrito',
        mensagem: 'Seu perfil não tem permissão para ver esta informação.',
        podeRepetir: false,
      };
    case 'outra-concessionaria':
      return {
        icone: 'business',
        tom: 'neutro',
        titulo: 'Registro de outra concessionária',
        mensagem: 'Este registro não pertence à carteira da sua unidade.',
        podeRepetir: false,
      };
    case 'nao-encontrado':
      return {
        icone: 'search',
        tom: 'neutro',
        titulo: 'Não encontrado',
        mensagem: erro.message,
        podeRepetir: false,
      };
    case 'limite-requisicoes':
      return {
        icone: 'hourglass',
        tom: 'alerta',
        titulo: 'Muitas requisições',
        mensagem: 'Aguarde alguns segundos e tente novamente.',
        podeRepetir: true,
      };
    default:
      return {
        icone: 'warning',
        tom: 'perigo',
        titulo: 'Algo deu errado',
        mensagem: 'Não conseguimos carregar as informações agora.',
        podeRepetir: true,
      };
  }
}

export interface EstadoErroProps {
  erro: unknown;
  onTentarNovamente?: () => void;
}

export function EstadoErro({ erro, onTentarNovamente }: EstadoErroProps) {
  const e = comoErroApi(erro);
  const { podeRepetir, ...descricao } = descreverErro(e);
  return (
    <EstadoBase
      {...descricao}
      acao={
        podeRepetir && onTentarNovamente
          ? { titulo: 'Tentar novamente', icone: 'refresh', onPress: onTentarNovamente }
          : undefined
      }
      // O código de correlação liga o erro na tela ao log do servidor (útil para o suporte).
      rodape={e.correlationId ? `Código do erro: ${e.correlationId}` : undefined}
    />
  );
}

const estilos = StyleSheet.create({
  centro: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.xxl,
    gap: espaco.sm,
  },
  circulo: {
    width: tamanho.icone.xl * 2,
    height: tamanho.icone.xl * 2,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.sm,
  },
  mensagem: { maxWidth: tamanho.larguraMaximaConteudo * 0.7 },
  acao: { marginTop: espaco.md },
  rodape: { marginTop: espaco.lg },
});
