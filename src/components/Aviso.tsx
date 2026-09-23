import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { NomeIcone } from '@/dominio/apresentacao';
import { espaco, raio, tamanho, tons, type Tom } from '@/theme';
import { Texto } from './Texto';

export interface AvisoProps {
  mensagem: string;
  titulo?: string;
  tom?: Tom;
  icone?: NomeIcone;
  style?: StyleProp<ViewStyle>;
}

const iconePorTom: Record<Tom, NomeIcone> = {
  perigo: 'alert-circle',
  alerta: 'warning',
  sucesso: 'checkmark-circle',
  info: 'information-circle',
  marca: 'information-circle',
  neutro: 'information-circle',
};

/** Faixa de mensagem dentro da tela (erro de login, sessão encerrada, restrição LGPD...). */
export function Aviso({ mensagem, titulo, tom = 'info', icone, style }: AvisoProps) {
  const t = tons[tom];
  return (
    <View
      style={[estilos.aviso, { backgroundColor: t.fundo, borderColor: t.texto }, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons name={icone ?? iconePorTom[tom]} size={tamanho.icone.md} color={t.texto} />
      <View style={estilos.textos}>
        {titulo && (
          <Texto variante="corpoForte" style={{ color: t.texto }}>
            {titulo}
          </Texto>
        )}
        <Texto variante="legenda" style={{ color: t.texto }}>
          {mensagem}
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.md,
    borderLeftWidth: espaco.xs,
  },
  textos: { flex: 1, gap: espaco.xxs },
});
