import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { API_URL, USE_MOCK, type Perfil } from '@/api';
import { Botao, Cartao, Chip, Tela, Texto } from '@/components';
import { useSessao, useUsuario } from '@/sessao/ProvedorSessao';
import type { NomeIcone } from '@/dominio/apresentacao';
import { useRegistros } from '@/sincronizacao/ProvedorRegistros';
import { cores, espaco, raio, tamanho } from '@/theme';
import { confirmar } from '@/utils/confirmar';

const rotuloPerfil: Record<Perfil, string> = {
  CONSULTOR: 'Consultor de serviço',
  GERENTE: 'Gerente de pós-venda',
  ANALISTA_FORD: 'Analista Ford',
  ADMIN: 'Administrador',
};

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Resumo() {
  const usuario = useUsuario();
  const { sair } = useSessao();
  const { contadores, pendentes, descartarTodos } = useRegistros();
  const [saindo, setSaindo] = useState(false);

  const aguardando = pendentes.filter((p) => !p.falha).length;
  const registrados = Object.values(contadores).reduce((soma, n) => soma + (n ?? 0), 0);

  async function encerrarSessao() {
    const mensagem = aguardando
      ? `Há ${aguardando} ${aguardando === 1 ? 'registro' : 'registros'} de contato ainda não ${aguardando === 1 ? 'enviado' : 'enviados'}. Ao sair, ${aguardando === 1 ? 'ele será descartado' : 'eles serão descartados'} deste aparelho.`
      : 'Você precisará entrar novamente com e-mail e senha.';
    const ok = await confirmar('Sair do VINSight', mensagem, aguardando ? 'Sair e descartar' : 'Sair');
    if (!ok) return;
    setSaindo(true);
    await descartarTodos(); // registros pendentes têm dados de clientes: não ficam no aparelho após o logout
    await sair(); // limpa o SecureStore; a rota protegida leva ao login
  }

  return (
    <Tela rolavel>
      <Texto variante="rotulo" cor="textoSuave" style={estilos.tituloGrupo}>
        Hoje, neste aparelho
      </Texto>
      <View style={estilos.contadores}>
        <Contador icone="chatbubbles" valor={registrados} rotulo="Contatos registrados" />
        <Contador icone="calendar" valor={contadores.AGENDADO ?? 0} rotulo="Agendamentos" />
        <Contador icone="call" valor={contadores.SEM_SUCESSO ?? 0} rotulo="Não atenderam" />
        <Contador icone="cloud-upload" valor={aguardando} rotulo="Aguardando envio" destaque={aguardando > 0} />
      </View>

      <Cartao style={estilos.perfil}>
        <View style={estilos.avatar} accessibilityElementsHidden importantForAccessibility="no">
          <Texto variante="titulo2" cor="sobrePrimaria">
            {iniciais(usuario.nome)}
          </Texto>
        </View>
        <View style={estilos.dados}>
          <Texto variante="titulo3">{usuario.nome}</Texto>
          <Texto variante="legenda" cor="textoSecundario">
            {usuario.email}
          </Texto>
          <Chip rotulo={rotuloPerfil[usuario.perfil]} tom="marca" icone="id-card" />
        </View>
      </Cartao>

      <Cartao style={estilos.linhaInfo}>
        <Ionicons name="business" size={tamanho.icone.lg} color={cores.primaria} />
        <View style={estilos.dados}>
          <Texto variante="rotulo" cor="textoSuave">
            Concessionária
          </Texto>
          {usuario.concessionaria ? (
            <Texto variante="corpoForte">
              {usuario.concessionaria.nome} · {usuario.concessionaria.codigo}
            </Texto>
          ) : (
            <Texto variante="corpoForte">Toda a rede Ford</Texto>
          )}
        </View>
      </Cartao>

      <Cartao style={estilos.linhaInfo}>
        <Ionicons name={USE_MOCK ? 'flask' : 'cloud-done'} size={tamanho.icone.lg} color={cores.primaria} />
        <View style={estilos.dados}>
          <Texto variante="rotulo" cor="textoSuave">
            Fonte dos dados
          </Texto>
          <Texto variante="corpoForte">{USE_MOCK ? 'Demonstração (dados locais)' : 'API VINSight'}</Texto>
          {!USE_MOCK && (
            <Texto variante="legenda" cor="textoSecundario" selectable>
              {API_URL}
            </Texto>
          )}
        </View>
      </Cartao>

      <View style={estilos.acoes}>
        {__DEV__ && (
          <Botao
            titulo="Ver design system"
            icone="color-palette"
            variante="fantasma"
            onPress={() => router.push('/catalogo')}
          />
        )}
        <Botao titulo="Sair" icone="log-out" variante="perigo" onPress={encerrarSessao} carregando={saindo} larguraTotal />
      </View>
    </Tela>
  );
}

function Contador({ icone, valor, rotulo, destaque }: { icone: NomeIcone; valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <Cartao style={estilos.contador} accessibilityLabel={`${rotulo}: ${valor}`}>
      <Ionicons name={icone} size={tamanho.icone.md} color={destaque ? cores.alerta : cores.primaria} />
      <Texto variante="titulo1" cor={destaque ? 'alerta' : 'texto'}>
        {valor}
      </Texto>
      <Texto variante="legenda" cor="textoSecundario">
        {rotulo}
      </Texto>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  tituloGrupo: { marginBottom: espaco.sm },
  contadores: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.md, marginBottom: espaco.xl },
  contador: { flexBasis: '47%', flexGrow: 1, gap: espaco.xs, padding: espaco.md },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, marginBottom: espaco.md },
  avatar: {
    width: tamanho.icone.destaque,
    height: tamanho.icone.destaque,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primaria,
  },
  dados: { flex: 1, gap: espaco.xs },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, marginBottom: espaco.md },
  acoes: { marginTop: espaco.lg, gap: espaco.sm },
});
