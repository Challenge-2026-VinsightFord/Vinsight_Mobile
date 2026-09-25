import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { cores, espaco, raio, tamanho, tipografia } from '@/theme';

export interface CampoBuscaProps {
  valor: string;
  onChange: (texto: string) => void;
  placeholder?: string;
}

/** Campo de busca compacto, com botão de limpar. */
export function CampoBusca({ valor, onChange, placeholder = 'Buscar' }: CampoBuscaProps) {
  return (
    <View style={estilos.caixa}>
      <Ionicons name="search" size={tamanho.icone.md} color={cores.textoSuave} />
      <TextInput
        style={estilos.input}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={cores.textoDesabilitado}
        selectionColor={cores.destaque}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        clearButtonMode="never"
      />
      {valor.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={espaco.md}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Ionicons name="close-circle" size={tamanho.icone.md} color={cores.textoSuave} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: tamanho.alvoToque - 4,
    paddingHorizontal: espaco.md,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  input: {
    flex: 1,
    ...tipografia.corpo,
    color: cores.texto,
    paddingVertical: espaco.sm,
    ...(Platform.OS === 'web' && { outlineWidth: 0 }),
  },
});
