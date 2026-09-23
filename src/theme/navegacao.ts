import { cores, tipografia } from './index';

/** Estilo do cabeçalho e da barra de abas, compartilhado por todos os navegadores. */
export const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.primaria },
  headerTintColor: cores.sobrePrimaria,
  headerTitleStyle: { ...tipografia.titulo3, color: cores.sobrePrimaria },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: cores.fundo },
} as const;

export const opcoesAbas = {
  ...opcoesCabecalho,
  tabBarActiveTintColor: cores.primaria,
  tabBarInactiveTintColor: cores.textoSuave,
  tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
  // Sem lineHeight: a barra de abas tem altura fixa e cortaria o rótulo.
  tabBarLabelStyle: {
    fontFamily: tipografia.legendaForte.fontFamily,
    fontSize: tipografia.rotulo.fontSize + 1,
    fontWeight: tipografia.legendaForte.fontWeight,
  },
  sceneStyle: { backgroundColor: cores.fundo },
} as const;
