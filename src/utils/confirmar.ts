import { Alert, Platform } from 'react-native';

/** Mensagem com um único botão "Entendi", no celular e no navegador. */
export function informar(titulo: string, mensagem: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return Promise.resolve();
  }
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [{ text: 'Entendi', onPress: () => resolver() }], {
      cancelable: true,
      onDismiss: () => resolver(),
    });
  });
}

/**
 * Diálogo de confirmação que funciona no celular e no navegador
 * (no react-native-web o Alert.alert com botões não faz nada).
 */
export function confirmar(titulo: string, mensagem: string, textoConfirmar = 'Confirmar'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: textoConfirmar, style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}
