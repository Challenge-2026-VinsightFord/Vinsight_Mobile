import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { API_URL, USE_MOCK } from '@/api';
import { Botao, Cartao, Tela, Texto } from '@/components';
import { espaco } from '@/theme';

// Placeholder da US-44: contadores do consultor e logout entram com a US-45/US-48.
export default function Resumo() {
  return (
    <Tela rolavel>
      <Cartao style={estilos.cartao}>
        <Texto variante="rotulo" cor="textoSuave">
          Ambiente
        </Texto>
        <Texto variante="corpoForte">{USE_MOCK ? 'Dados de demonstração (mock)' : 'API VINSight'}</Texto>
        {!USE_MOCK && (
          <Texto variante="legenda" cor="textoSecundario" selectable>
            {API_URL}
          </Texto>
        )}
      </Cartao>
      <Botao titulo="Ver design system" icone="color-palette" variante="secundario" onPress={() => router.push('/catalogo')} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.xs, marginBottom: espaco.lg },
});
