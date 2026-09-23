import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import type { NomeIcone } from '@/dominio/apresentacao';
import { cores, espaco, raio, tamanho, tipografia } from '@/theme';
import { Texto } from './Texto';

export interface CampoTextoProps extends Omit<TextInputProps, 'style'> {
  rotulo?: string;
  erro?: string;
  dica?: string;
  icone?: NomeIcone;
  /** Mostra o botão de exibir/ocultar senha. */
  senha?: boolean;
}

export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
  { rotulo, erro, dica, icone, senha = false, editable = true, onFocus, onBlur, ...props },
  ref,
) {
  const [focado, setFocado] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const corBorda = erro ? cores.perigo : focado ? cores.destaque : cores.borda;

  return (
    <View style={estilos.envoltorio}>
      {rotulo && (
        <Texto variante="legendaForte" cor="textoSecundario" style={estilos.rotulo}>
          {rotulo}
        </Texto>
      )}
      <View
        style={[
          estilos.caixa,
          { borderColor: corBorda },
          focado && estilos.caixaFocada,
          !editable && estilos.caixaInativa,
        ]}
      >
        {icone && <Ionicons name={icone} size={tamanho.icone.md} color={focado ? cores.destaque : cores.textoSuave} />}
        <TextInput
          ref={ref}
          style={estilos.input}
          placeholderTextColor={cores.textoDesabilitado}
          selectionColor={cores.destaque}
          secureTextEntry={senha && !senhaVisivel}
          editable={editable}
          accessibilityLabel={rotulo}
          accessibilityHint={erro}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {senha && (
          <Pressable
            onPress={() => setSenhaVisivel((v) => !v)}
            hitSlop={espaco.md}
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Ionicons name={senhaVisivel ? 'eye-off' : 'eye'} size={tamanho.icone.md} color={cores.textoSuave} />
          </Pressable>
        )}
      </View>
      {erro ? (
        <View style={estilos.linhaErro} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={tamanho.icone.sm} color={cores.perigo} />
          <Texto variante="legenda" cor="perigo" style={estilos.flex}>
            {erro}
          </Texto>
        </View>
      ) : dica ? (
        <Texto variante="legenda" cor="textoSuave" style={estilos.dica}>
          {dica}
        </Texto>
      ) : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  envoltorio: { marginBottom: espaco.lg },
  rotulo: { marginBottom: espaco.xs },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: tamanho.alvoToque + 4,
    paddingHorizontal: espaco.md,
    borderWidth: 1,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
  caixaFocada: { borderWidth: 2, paddingHorizontal: espaco.md - 1 },
  caixaInativa: { backgroundColor: cores.superficieAlternativa },
  input: {
    flex: 1,
    ...tipografia.corpo,
    color: cores.texto,
    paddingVertical: espaco.md,
    // Na web o navegador desenha o próprio contorno de foco; a borda da caixa já indica o foco.
    ...(Platform.OS === 'web' && { outlineWidth: 0 }),
  },
  linhaErro: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, marginTop: espaco.xs },
  dica: { marginTop: espaco.xs },
  flex: { flex: 1 },
});
