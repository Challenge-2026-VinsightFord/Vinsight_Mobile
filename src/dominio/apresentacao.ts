import type { Ionicons } from '@expo/vector-icons';
import type {
  CanalContato,
  FaixaRisco,
  PerfilComportamental,
  SituacaoRevisao,
  StatusAgendamento,
  StatusGarantia,
  StatusLead,
  TipoServico,
} from '@/api';
import type { Tom } from '@/theme';

/**
 * Como cada valor do contrato aparece na tela: rótulo em português, tom de cor e ícone.
 * Os códigos da API (ALTO, ESQUECIDO, PROXIMA_DO_FIM...) nunca são exibidos crus.
 */
export type NomeIcone = keyof typeof Ionicons.glyphMap;

export interface Apresentacao {
  rotulo: string;
  tom: Tom;
  icone: NomeIcone;
  descricao?: string;
}

export const faixaRisco: Record<FaixaRisco, Apresentacao> = {
  ALTO: { rotulo: 'Risco alto', tom: 'perigo', icone: 'flame', descricao: 'Score de 70% ou mais' },
  MEDIO: { rotulo: 'Risco médio', tom: 'alerta', icone: 'alert-circle', descricao: 'Score entre 40% e 69%' },
  BAIXO: { rotulo: 'Risco baixo', tom: 'sucesso', icone: 'leaf', descricao: 'Score abaixo de 40%' },
};

export const statusLead: Record<StatusLead, Apresentacao> = {
  OPEN: { rotulo: 'Novo', tom: 'info', icone: 'sparkles' },
  CONTATADO: { rotulo: 'Contatado', tom: 'marca', icone: 'chatbubbles' },
  SEM_SUCESSO: { rotulo: 'Não atendeu', tom: 'alerta', icone: 'call' },
  AGENDADO: { rotulo: 'Agendado', tom: 'sucesso', icone: 'calendar' },
  RECUSADO: { rotulo: 'Sem interesse', tom: 'neutro', icone: 'close-circle' },
  NUMERO_INVALIDO: { rotulo: 'Número errado', tom: 'neutro', icone: 'call-outline' },
};

/** Texto dos botões de desfecho (tabela da seção 3.6 do INTEGRACAO_MOBILE.md). */
export const botaoDesfecho: Record<Exclude<StatusLead, 'OPEN'>, string> = {
  CONTATADO: 'Falei com o cliente',
  SEM_SUCESSO: 'Não atendeu',
  AGENDADO: 'Agendou',
  RECUSADO: 'Não tem interesse',
  NUMERO_INVALIDO: 'Número errado',
};

/** O que acontece com o lead depois de cada desfecho (regra da API). */
export const efeitoDesfecho: Record<Exclude<StatusLead, 'OPEN'>, { descricao: string; encerra: boolean }> = {
  CONTATADO: { descricao: 'O lead continua aberto, em "Retornos", para o retorno combinado.', encerra: false },
  SEM_SUCESSO: { descricao: 'O lead continua aberto, em "Não atenderam", para nova tentativa.', encerra: false },
  AGENDADO: { descricao: 'Encerra o lead como convertido: o cliente volta à rede.', encerra: true },
  RECUSADO: { descricao: 'Encerra o lead. O motivo ajuda o modelo a aprender.', encerra: true },
  NUMERO_INVALIDO: { descricao: 'Encerra o lead e sinaliza o cadastro para correção.', encerra: true },
};

export const perfilComportamental: Record<PerfilComportamental, Apresentacao> = {
  FIEL: { rotulo: 'Fiel', tom: 'sucesso', icone: 'heart', descricao: 'Faz a manutenção na rede com regularidade' },
  ABANDONO: {
    rotulo: 'Em abandono',
    tom: 'perigo',
    icone: 'exit',
    descricao: 'Migrou ou está migrando para oficinas independentes',
  },
  ESQUECIDO: {
    rotulo: 'Esquecido',
    tom: 'alerta',
    icone: 'time',
    descricao: 'Deixa as revisões passarem do prazo',
  },
  ECONOMICO: {
    rotulo: 'Econômico',
    tom: 'info',
    icone: 'pricetag',
    descricao: 'Sensível a preço; responde bem a ofertas',
  },
};

export const statusGarantia: Record<StatusGarantia, Apresentacao> = {
  ATIVA: { rotulo: 'Garantia ativa', tom: 'sucesso', icone: 'shield-checkmark' },
  PROXIMA_DO_FIM: { rotulo: 'Garantia no fim', tom: 'alerta', icone: 'shield-half' },
  ENCERRADA: { rotulo: 'Garantia encerrada', tom: 'neutro', icone: 'shield-outline' },
};

export const situacaoRevisao: Record<SituacaoRevisao, Apresentacao> = {
  EM_DIA: { rotulo: 'Revisão em dia', tom: 'sucesso', icone: 'checkmark-circle' },
  PROXIMA: { rotulo: 'Revisão próxima', tom: 'alerta', icone: 'time' },
  VENCIDA: { rotulo: 'Revisão vencida', tom: 'perigo', icone: 'warning' },
};

export const tipoServico: Record<TipoServico, { rotulo: string; icone: NomeIcone }> = {
  REVISAO_PROGRAMADA: { rotulo: 'Revisão programada', icone: 'construct' },
  TROCA_OLEO: { rotulo: 'Troca de óleo', icone: 'water' },
  REPARO: { rotulo: 'Reparo', icone: 'hammer' },
  GARANTIA: { rotulo: 'Garantia', icone: 'shield-checkmark' },
  RECALL: { rotulo: 'Recall', icone: 'megaphone' },
};

export const statusAgendamento: Record<StatusAgendamento, Apresentacao> = {
  AGENDADO: { rotulo: 'Agendado', tom: 'info', icone: 'calendar' },
  CONFIRMADO: { rotulo: 'Confirmado', tom: 'sucesso', icone: 'checkmark-circle' },
  REALIZADO: { rotulo: 'Realizado', tom: 'marca', icone: 'checkmark-done' },
  CANCELADO: { rotulo: 'Cancelado', tom: 'neutro', icone: 'close-circle' },
  NO_SHOW: { rotulo: 'Não compareceu', tom: 'perigo', icone: 'person-remove' },
};

export const canalContato: Record<CanalContato, { rotulo: string; icone: NomeIcone }> = {
  WHATSAPP: { rotulo: 'WhatsApp', icone: 'logo-whatsapp' },
  EMAIL: { rotulo: 'E-mail', icone: 'mail' },
  TELEFONE: { rotulo: 'Telefone', icone: 'call' },
};
