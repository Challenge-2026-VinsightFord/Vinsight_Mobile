import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { API_URL, USE_MOCK, type Perfil } from '@/api';
import { Botao, Cartao, Chip, Tela, Texto } from '@/components';
import { useSessao, useUsuario } from '@/sessao/ProvedorSessao';
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

// Contadores do dia (contatos, agendamentos) entram com o registro de desfecho (US-48).
export default function Resumo() {
  const usuario = useUsuario();
  const { sair } = useSessao();
  const [saindo, setSaindo] = useState(false);

  async function encerrarSessao() {
    const ok = await confirmar('Sair do VINSight', 'Você precisará entrar novamente com e-mail e senha.', 'Sair');
    if (!ok) return;
    setSaindo(true);
    await sair(); // limpa o SecureStore; a rota protegida leva ao login
  }

  return (
    <Tela rolavel>
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

const estilos = StyleSheet.create({
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
