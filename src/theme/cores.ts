/**
 * Paleta do VINSight. Só este arquivo conhece valores hexadecimais: telas e componentes usam
 * os nomes semânticos de `cores` (via `tema`), nunca a `paleta` crua.
 */
const paleta = {
  azulFord: '#00095B', // azul institucional da marca
  azulOval: '#003478', // azul do oval, para superfícies escuras
  azulDestaque: '#066FEF', // links, foco e realces
  azulGelo: '#E8EFFB',
  azulNevoa: '#C3C8EB', // texto secundário sobre o azul Ford

  branco: '#FFFFFF',
  cinza50: '#F5F7FA',
  cinza100: '#EDF0F5',
  cinza200: '#DDE2EA',
  cinza400: '#A3ACB9',
  cinza500: '#6B7585',
  cinza700: '#3D4553',
  cinza900: '#1A1F29',

  vermelho: '#C8102E',
  vermelhoSuave: '#FDECEE',
  ambar: '#9A4D00',
  ambarSuave: '#FFF3E0',
  verde: '#00754A',
  verdeSuave: '#E3F4EC',
  azulInfo: '#0B5CD5',
  azulInfoSuave: '#E6F0FD',
} as const;

export const cores = {
  primaria: paleta.azulFord,
  primariaEscura: paleta.azulOval,
  primariaSuave: paleta.azulGelo,
  destaque: paleta.azulDestaque,
  sobrePrimaria: paleta.branco,
  sobrePrimariaSuave: paleta.azulNevoa,
  /** Véu translúcido sobre o azul Ford (ícones e selos na área de marca). */
  realceSobrePrimaria: 'rgba(255, 255, 255, 0.12)',

  fundo: paleta.cinza50,
  superficie: paleta.branco,
  superficieAlternativa: paleta.cinza100,
  borda: paleta.cinza200,
  bordaForte: paleta.cinza400,

  texto: paleta.cinza900,
  textoSecundario: paleta.cinza700,
  textoSuave: paleta.cinza500,
  textoDesabilitado: paleta.cinza400,

  perigo: paleta.vermelho,
  perigoSuave: paleta.vermelhoSuave,
  alerta: paleta.ambar,
  alertaSuave: paleta.ambarSuave,
  sucesso: paleta.verde,
  sucessoSuave: paleta.verdeSuave,
  info: paleta.azulInfo,
  infoSuave: paleta.azulInfoSuave,

  /** Trilho de barras de progresso desenhadas sobre fundos de tom (ex.: medidor de score). */
  trilhoSobreTom: 'rgba(255, 255, 255, 0.7)',

  sombraSuave: 'rgba(0, 9, 91, 0.06)',
  sombraForte: 'rgba(0, 9, 91, 0.14)',
  sobreposicao: 'rgba(0, 9, 91, 0.45)',
} as const;

/** Tons usados por chips, faixas e badges: cada um tem fundo, texto e borda coerentes. */
export type Tom = 'marca' | 'perigo' | 'alerta' | 'sucesso' | 'info' | 'neutro';

export const tons: Record<Tom, { fundo: string; texto: string; borda: string }> = {
  marca: { fundo: cores.primariaSuave, texto: cores.primaria, borda: cores.primariaSuave },
  perigo: { fundo: cores.perigoSuave, texto: cores.perigo, borda: cores.perigoSuave },
  alerta: { fundo: cores.alertaSuave, texto: cores.alerta, borda: cores.alertaSuave },
  sucesso: { fundo: cores.sucessoSuave, texto: cores.sucesso, borda: cores.sucessoSuave },
  info: { fundo: cores.infoSuave, texto: cores.info, borda: cores.infoSuave },
  neutro: { fundo: cores.superficieAlternativa, texto: cores.textoSecundario, borda: cores.borda },
};
