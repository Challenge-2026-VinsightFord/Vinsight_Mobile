import AsyncStorage from '@react-native-async-storage/async-storage';
import { armazenamentoSeguro as seguro } from '@/api/armazenamentoSeguro';
import type { CodigoErro, Desfecho, RegistroDesfecho } from '@/api';

/** Desfecho registrado pelo consultor que ainda não foi confirmado pela API. */
export interface RegistroPendente {
  /** Idempotency-Key: gerada no toque em "Registrar" e reaproveitada em todo reenvio. */
  chave: string;
  leadId: number;
  usuarioId: number;
  registro: RegistroDesfecho;
  clienteNome: string;
  criadoEm: string;
  tentativas: number;
  /** Erro definitivo (ex.: lead encerrado por outro consultor): não é mais reenviado. */
  falha?: { codigo: CodigoErro; mensagem: string };
}

// Cada pendente fica numa chave própria do SecureStore (o Keychain do iOS limita o tamanho
// de cada valor), e um índice guarda a lista de chaves.
const INDICE = 'vinsight.pendentes';
const chaveItem = (chave: string) => `vinsight.pendente.${chave}`;

// Escritas em fila: salvar e remover leem e regravam o índice, e duas ao mesmo tempo
// (registro novo durante uma sincronização) poderiam apagar a alteração uma da outra.
let fila: Promise<unknown> = Promise.resolve();
function emSerie<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = fila.then(tarefa, tarefa);
  fila = resultado.catch(() => {});
  return resultado;
}

export const pendentesSalvos = {
  async listar(): Promise<RegistroPendente[]> {
    const chaves = (await seguro.lerJson<string[]>(INDICE)) ?? [];
    const itens = await Promise.all(chaves.map((c) => seguro.lerJson<RegistroPendente>(chaveItem(c))));
    return itens.filter((i): i is RegistroPendente => i !== null);
  },

  salvar: (item: RegistroPendente) =>
    emSerie(async () => {
      await seguro.gravarJson(chaveItem(item.chave), item);
      const chaves = (await seguro.lerJson<string[]>(INDICE)) ?? [];
      if (!chaves.includes(item.chave)) await seguro.gravarJson(INDICE, [...chaves, item.chave]);
    }),

  remover: (chave: string) =>
    emSerie(async () => {
      await seguro.apagar(chaveItem(chave));
      const chaves = (await seguro.lerJson<string[]>(INDICE)) ?? [];
      await seguro.gravarJson(
        INDICE,
        chaves.filter((c) => c !== chave),
      );
    }),
};

// ---------- Contadores do dia (só números, sem dado pessoal: AsyncStorage basta) ----------

export type Contadores = Partial<Record<Desfecho, number>>;

/** "2026-09-23" no fuso do aparelho. */
export function hojeLocal(deslocamentoDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + deslocamentoDias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const chaveContadores = (usuarioId: number) => `vinsight.contadores.${usuarioId}`;

export const contadoresSalvos = {
  async ler(usuarioId: number): Promise<Contadores> {
    try {
      const bruto = await AsyncStorage.getItem(chaveContadores(usuarioId));
      const salvo = bruto ? (JSON.parse(bruto) as { data: string; porDesfecho: Contadores }) : null;
      return salvo?.data === hojeLocal() ? salvo.porDesfecho : {};
    } catch {
      return {};
    }
  },

  async incrementar(usuarioId: number, desfecho: Desfecho): Promise<Contadores> {
    const atuais = await this.ler(usuarioId);
    const novos = { ...atuais, [desfecho]: (atuais[desfecho] ?? 0) + 1 };
    try {
      await AsyncStorage.setItem(chaveContadores(usuarioId), JSON.stringify({ data: hojeLocal(), porDesfecho: novos }));
    } catch {
      // contador é conveniência: falhar em gravar não pode travar o registro
    }
    return novos;
  },
};
