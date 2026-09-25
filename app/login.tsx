import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, ATALHOS_DEMO, comoErroApi, USE_MOCK } from '@/api';
import { Aviso, Botao, CampoTexto, Cartao, Chip, Texto } from '@/components';
import { validarEmail, validarSenha } from '@/dominio/validacao';
import { useSessao } from '@/sessao/ProvedorSessao';
import { cores, espaco, raio, tamanho } from '@/theme';

/** Usuários do seed do perfil dev, para agilizar testes e a demonstração (ver ATALHOS_DEMO). */
const USUARIOS_DEMO = [
  { rotulo: 'Consultor Morumbi', email: 'consultor@ford.com.br', senha: 'consultor123' },
  { rotulo: 'Consultor POA', email: 'consultor.poa@ford.com.br', senha: 'consultor123' },
  { rotulo: 'Gerente', email: 'gerente@ford.com.br', senha: 'gerente123' },
  { rotulo: 'Analista', email: 'analista@ford.com.br', senha: 'analista123' },
];

interface ErrosCampos {
  email?: string;
  senha?: string;
}

export default function Login() {
  const { estado, entrar } = useSessao();
  const topo = useSafeAreaInsets().top;
  const refSenha = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ErrosCampos>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tentou, setTentou] = useState(false);

  const sessaoExpirada = estado.status === 'anonimo' && estado.motivo === 'expirada' && !tentou;

  async function enviar() {
    setTentou(true);
    const novosErros = { email: validarEmail(email), senha: validarSenha(senha) };
    setErros(novosErros);
    setErroGeral(null);
    if (novosErros.email || novosErros.senha) return;

    setEnviando(true);
    try {
      await entrar({ email, senha });
      // Sucesso: a rota protegida troca o login pela fila sozinha (app/_layout.tsx).
    } catch (e) {
      const erro = comoErroApi(e);
      switch (erro.codigo) {
        case 'credenciais-invalidas':
          setSenha('');
          setErroGeral('E-mail ou senha inválidos. Confira e tente novamente.');
          refSenha.current?.focus();
          break;
        case 'validacao':
          setErros({ email: erro.violacaoDo('email'), senha: erro.violacaoDo('senha') });
          break;
        case 'sem-conexao':
        case 'tempo-esgotado':
          setErroGeral(
            `Não foi possível falar com o servidor.${__DEV__ && !USE_MOCK ? ` Verifique se a API está no ar em ${API_URL}.` : ' Verifique a internet.'}`,
          );
          break;
        case 'perfil-sem-permissao':
        case 'limite-requisicoes':
          setErroGeral(erro.message);
          break;
        default:
          setErroGeral(
            `Não foi possível entrar agora. Tente novamente.${erro.correlationId ? ` (código ${erro.correlationId})` : ''}`,
          );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <ScrollView contentContainerStyle={estilos.rolagem} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={[estilos.marca, { paddingTop: topo + espaco.xxxl }]}>
          <View style={estilos.selo}>
            <Ionicons name="analytics" size={tamanho.icone.xl} color={cores.sobrePrimaria} />
          </View>
          <Texto variante="display" cor="sobrePrimaria">
            VINSight
          </Texto>
          <Texto variante="corpo" cor="sobrePrimariaSuave" alinhamento="center">
            Pós-venda inteligente para a rede Ford
          </Texto>
        </View>

        <Cartao style={estilos.formulario}>
          <Texto variante="titulo2">Entrar</Texto>
          <Texto variante="legenda" cor="textoSecundario" style={estilos.subtitulo}>
            Use o e-mail corporativo da sua concessionária.
          </Texto>

          {sessaoExpirada && (
            <Aviso
              tom="alerta"
              icone="time"
              titulo="Sessão encerrada"
              mensagem="Por segurança, entre novamente para continuar."
              style={estilos.aviso}
            />
          )}
          {erroGeral && <Aviso tom="perigo" mensagem={erroGeral} style={estilos.aviso} />}

          <CampoTexto
            rotulo="E-mail"
            icone="mail"
            placeholder="nome@ford.com.br"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (erros.email) setErros((e) => ({ ...e, email: undefined }));
            }}
            erro={erros.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => refSenha.current?.focus()}
            editable={!enviando}
          />
          <CampoTexto
            ref={refSenha}
            rotulo="Senha"
            icone="lock-closed"
            senha
            value={senha}
            onChangeText={(v) => {
              setSenha(v);
              if (erros.senha) setErros((e) => ({ ...e, senha: undefined }));
            }}
            erro={erros.senha}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={enviar}
            editable={!enviando}
          />

          <Botao titulo="Entrar" icone="log-in" onPress={enviar} carregando={enviando} larguraTotal />
        </Cartao>

        {ATALHOS_DEMO && (
          <View style={estilos.demo}>
            <Texto variante="rotulo" cor="textoSuave">
              Usuários de demonstração {USE_MOCK ? '· mock' : '· API'}
            </Texto>
            <View style={estilos.chips}>
              {USUARIOS_DEMO.map((u) => (
                <Chip
                  key={u.email}
                  rotulo={u.rotulo}
                  selecionado={email === u.email}
                  onPress={() => {
                    setEmail(u.email);
                    setSenha(u.senha);
                    setErros({});
                    setErroGeral(null);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={estilos.rodape}>
          <Ionicons name="shield-checkmark" size={tamanho.icone.sm} color={cores.textoSuave} />
          <Texto variante="legenda" cor="textoSuave" alinhamento="center">
            Acesso restrito às equipes das concessionárias · v{Constants.expoConfig?.version}
          </Texto>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1, paddingBottom: espaco.xl },
  marca: {
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.xl,
    paddingBottom: espaco.xxxl + espaco.xxl,
    backgroundColor: cores.primaria,
    borderBottomLeftRadius: raio.xl,
    borderBottomRightRadius: raio.xl,
  },
  selo: {
    width: tamanho.icone.destaque + espaco.lg,
    height: tamanho.icone.destaque + espaco.lg,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.sm,
    backgroundColor: cores.realceSobrePrimaria,
  },
  formulario: {
    marginTop: -espaco.xxxl,
    marginHorizontal: espaco.lg,
    padding: espaco.xl,
    width: 'auto',
    maxWidth: tamanho.larguraMaximaConteudo,
    alignSelf: Platform.OS === 'web' ? 'center' : 'auto',
  },
  subtitulo: { marginTop: espaco.xxs, marginBottom: espaco.lg },
  aviso: { marginBottom: espaco.lg },
  demo: { marginTop: espaco.xl, marginHorizontal: espaco.lg, gap: espaco.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
    marginTop: espaco.xl,
    paddingHorizontal: espaco.lg,
  },
});
