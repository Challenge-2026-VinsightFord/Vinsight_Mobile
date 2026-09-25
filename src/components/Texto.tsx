import { Text, type TextProps } from 'react-native';
import { cores, tipografia, type VarianteTexto } from '@/theme';

type CorTexto =
  | 'texto'
  | 'textoSecundario'
  | 'textoSuave'
  | 'primaria'
  | 'destaque'
  | 'perigo'
  | 'sucesso'
  | 'alerta'
  | 'sobrePrimaria'
  | 'sobrePrimariaSuave';

export interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: CorTexto;
  alinhamento?: 'left' | 'center' | 'right';
}

/** Todo texto do app passa por aqui, para fonte, tamanho e cor virem sempre do tema. */
export function Texto({ variante = 'corpo', cor = 'texto', alinhamento, style, ...props }: TextoProps) {
  return <Text style={[tipografia[variante], { color: cores[cor], textAlign: alinhamento }, style]} {...props} />;
}
