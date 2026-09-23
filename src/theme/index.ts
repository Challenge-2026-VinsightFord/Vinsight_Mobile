import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { cores, tons } from './cores';

export { cores, tons };
export type { Tom } from './cores';

/** Escala de espaçamento (múltiplos de 4). */
export const espaco = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const raio = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pilula: 999,
} as const;

export const tamanho = {
  /** Área mínima de toque recomendada pelo Material (48dp). */
  alvoToque: 48,
  /** Botões e chips compactos, usados em linhas de filtro. */
  alvoCompacto: 36,
  icone: { sm: 16, md: 20, lg: 24, xl: 40, destaque: 56 },
  medidorScore: { compacto: 64, destaque: 112 },
  larguraMaximaConteudo: 560,
} as const;

// Fonte do sistema (Roboto no Android, SF no iOS): legível e sem custo de carregamento.
// Para trocar a família em todo o app, basta definir `familia` aqui.
const familia = Platform.select({ web: 'system-ui, sans-serif', default: undefined });

const estiloTexto = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'],
  extra: TextStyle = {},
) => ({ ...extra, fontFamily: familia, fontSize, lineHeight, fontWeight });

export const tipografia = {
  display: estiloTexto(32, 38, '700', { letterSpacing: -0.5 }),
  titulo1: estiloTexto(24, 30, '700', { letterSpacing: -0.3 }),
  titulo2: estiloTexto(20, 26, '700'),
  titulo3: estiloTexto(17, 22, '600'),
  corpo: estiloTexto(15, 22, '400'),
  corpoForte: estiloTexto(15, 22, '600'),
  legenda: estiloTexto(13, 18, '400'),
  legendaForte: estiloTexto(13, 18, '600'),
  rotulo: estiloTexto(11, 14, '700', { letterSpacing: 0.6, textTransform: 'uppercase' }),
  botao: estiloTexto(16, 20, '600'),
} as const;

export type VarianteTexto = keyof typeof tipografia;

// boxShadow (RN 0.76+) funciona igual no Android, no iOS e na web; os props shadow* estão obsoletos.
export const sombra = {
  cartao: { boxShadow: `0 2px 8px ${cores.sombraSuave}` },
  flutuante: { boxShadow: `0 6px 16px ${cores.sombraForte}` },
} satisfies Record<string, ViewStyle>;

export const opacidade = {
  pressionado: 0.75,
  desabilitado: 0.45,
} as const;

export const tema = { cores, tons, espaco, raio, tamanho, tipografia, sombra, opacidade } as const;
export type Tema = typeof tema;
