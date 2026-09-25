import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { comoErroApi, leadsApi, type CodigoErro, type Desfecho, type ErroApi, type RegistroDesfecho } from '@/api';
import { useSessao } from '@/sessao/ProvedorSessao';
import { contadoresSalvos, pendentesSalvos, type Contadores, type RegistroPendente } from './armazenamento';

/**
 * Registro de desfechos com envio resiliente (US-48).
 *
 * Todo registro entra primeiro numa fila local (SecureStore) com a sua Idempotency-Key e só sai
 * dela quando a API confirma. Sem rede, fica pendente e é reenviado — com a MESMA chave — quando
 * a conexão volta, quando o app volta ao primeiro plano ou quando o usuário pede. A API reconhece
 * a chave e não duplica o registro, mesmo que a primeira tentativa tenha chegado e só a resposta
 * tenha se perdido.
 */

/** Falhas passageiras: vale tentar de novo. As demais (409, 422, 403, 404) são definitivas. */
const TRANSITORIOS: CodigoErro[] = [
  'sem-conexao',
  'tempo-esgotado',
  'erro-interno',
  'limite-requisicoes',
  'sessao-expirada',
  'resposta-invalida',
  'desconhecido',
];
const ehTransitorio = (e: ErroApi) => TRANSITORIOS.includes(e.codigo);

export type ResultadoRegistro = 'enviado' | 'pendente';

export interface UltimoRegistro {
  clienteNome: string;
  desfecho: Desfecho;
  resultado: ResultadoRegistro;
  em: number;
}

interface ValorRegistros {
  /** Pendentes e falhas do usuário logado. */
  pendentes: RegistroPendente[];
  sincronizando: boolean;
  /** Desfecho registrado neste aparelho por lead (enviado ou pendente): a fila usa para tirar o lead da lista na hora. */
  statusLocal: Record<number, Desfecho>;
  /** Muda a cada registro confirmado: telas que listam leads recarregam ao ver a mudança. */
  versao: number;
  ultimoRegistro: UltimoRegistro | null;
  contadores: Contadores;
  registrar: (leadId: number, registro: RegistroDesfecho, clienteNome: string) => Promise<ResultadoRegistro>;
  sincronizar: () => Promise<void>;
  descartar: (chave: string) => Promise<void>;
  descartarTodos: () => Promise<void>;
  limparUltimoRegistro: () => void;
}

const Contexto = createContext<ValorRegistros | null>(null);

export function ProvedorRegistros({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const usuarioId = usuario?.id ?? null;

  const [todos, setTodos] = useState<RegistroPendente[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [statusLocal, setStatusLocal] = useState<Record<number, Desfecho>>({});
  const [versao, setVersao] = useState(0);
  const [ultimoRegistro, setUltimoRegistro] = useState<UltimoRegistro | null>(null);
  const [contadores, setContadores] = useState<Contadores>({});

  const todosRef = useRef(todos);
  todosRef.current = todos;
  const sincronizandoRef = useRef(false);
  // Chaves com requisição em andamento: a sincronização não reenvia o que o registro
  // acabou de mandar (seria uma segunda requisição, e uma segunda contagem, do mesmo desfecho).
  const emEnvio = useRef(new Set<string>());
  const sincronizarRef = useRef<() => Promise<void>>(async () => {});

  const pendentes = useMemo(() => todos.filter((p) => p.usuarioId === usuarioId), [todos, usuarioId]);

  // Carrega o que ficou pendente de sessões anteriores e os contadores de hoje.
  useEffect(() => {
    if (usuarioId == null) {
      setStatusLocal({});
      setContadores({});
      return;
    }
    let ativo = true;
    Promise.all([pendentesSalvos.listar(), contadoresSalvos.ler(usuarioId)]).then(([salvos, cont]) => {
      if (!ativo) return;
      todosRef.current = salvos;
      setTodos(salvos);
      setContadores(cont);
      setStatusLocal(
        Object.fromEntries(
          salvos.filter((p) => p.usuarioId === usuarioId && !p.falha).map((p) => [p.leadId, p.registro.desfecho]),
        ),
      );
      sincronizarRef.current(); // o que ficou pendente de uma sessão anterior sai já na entrada
    });
    return () => {
      ativo = false;
    };
  }, [usuarioId]);

  const remover = useCallback(async (chave: string) => {
    setTodos((t) => t.filter((p) => p.chave !== chave));
    await pendentesSalvos.remover(chave);
  }, []);

  const confirmar = useCallback(
    async (item: RegistroPendente) => {
      await remover(item.chave);
      setStatusLocal((s) => ({ ...s, [item.leadId]: item.registro.desfecho }));
      setVersao((v) => v + 1);
      setContadores(await contadoresSalvos.incrementar(item.usuarioId, item.registro.desfecho));
    },
    [remover],
  );

  /** Uma tentativa de envio. Devolve o erro, se houver, sem lançar. */
  const enviar = useCallback(async (item: RegistroPendente): Promise<ErroApi | null> => {
    emEnvio.current.add(item.chave);
    try {
      await leadsApi.registrarDesfecho(item.leadId, item.registro, item.chave);
      return null;
    } catch (e) {
      return comoErroApi(e);
    } finally {
      emEnvio.current.delete(item.chave);
    }
  }, []);

  const marcarFalha = useCallback(async (item: RegistroPendente, erro: ErroApi) => {
    const comFalha = { ...item, falha: { codigo: erro.codigo, mensagem: erro.message } };
    setTodos((t) => t.map((p) => (p.chave === item.chave ? comFalha : p)));
    setStatusLocal(({ [item.leadId]: _, ...resto }) => resto);
    await pendentesSalvos.salvar(comFalha);
  }, []);

  const registrar = useCallback<ValorRegistros['registrar']>(
    async (leadId, registro, clienteNome) => {
      if (usuarioId == null) throw new Error('Sem usuário logado');
      const item: RegistroPendente = {
        chave: Crypto.randomUUID(), // gerada no toque, não a cada tentativa
        leadId,
        usuarioId,
        registro,
        clienteNome,
        criadoEm: new Date().toISOString(),
        tentativas: 1,
      };
      await pendentesSalvos.salvar(item);
      setTodos((t) => [...t, item]);
      setStatusLocal((s) => ({ ...s, [leadId]: registro.desfecho }));

      const erro = await enviar(item);
      if (!erro) {
        await confirmar(item);
        setUltimoRegistro({ clienteNome, desfecho: registro.desfecho, resultado: 'enviado', em: Date.now() });
        return 'enviado';
      }
      if (ehTransitorio(erro)) {
        setUltimoRegistro({ clienteNome, desfecho: registro.desfecho, resultado: 'pendente', em: Date.now() });
        return 'pendente';
      }
      // Recusado pela API (lead encerrado, suprimido, dado inválido): não fica na fila.
      await remover(item.chave);
      setStatusLocal(({ [leadId]: _, ...resto }) => resto);
      throw erro;
    },
    [usuarioId, enviar, confirmar, remover],
  );

  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current || usuarioId == null) return;
    const fila = todosRef.current.filter(
      (p) => p.usuarioId === usuarioId && !p.falha && !emEnvio.current.has(p.chave),
    );
    if (!fila.length) return;

    sincronizandoRef.current = true;
    setSincronizando(true);
    try {
      for (const item of fila) {
        const tentativa = { ...item, tentativas: item.tentativas + 1 };
        const erro = await enviar(tentativa);
        if (!erro) {
          await confirmar(tentativa);
        } else if (ehTransitorio(erro)) {
          await pendentesSalvos.salvar(tentativa);
          setTodos((t) => t.map((p) => (p.chave === item.chave ? tentativa : p)));
          break; // continua sem rede: os próximos também falhariam
        } else {
          await marcarFalha(tentativa, erro);
        }
      }
    } finally {
      sincronizandoRef.current = false;
      setSincronizando(false);
    }
  }, [usuarioId, enviar, confirmar, marcarFalha]);

  // Gatilhos de reenvio: ao entrar (no carregamento acima), quando a rede volta e quando o app
  // volta ao primeiro plano.
  sincronizarRef.current = sincronizar;

  useEffect(() => {
    if (usuarioId == null) return;
    const disparar = () => {
      if (todosRef.current.some((p) => p.usuarioId === usuarioId && !p.falha)) sincronizarRef.current();
    };
    let estavaConectado: boolean | null = null;
    const pararRede = NetInfo.addEventListener((estado) => {
      const conectado = !!estado.isConnected && estado.isInternetReachable !== false;
      if (conectado && estavaConectado === false) disparar();
      estavaConectado = conectado;
    });
    const assinaturaApp = AppState.addEventListener('change', (s) => s === 'active' && disparar());
    return () => {
      pararRede();
      assinaturaApp.remove();
    };
  }, [usuarioId]);

  const descartar = useCallback(
    async (chave: string) => {
      const item = todosRef.current.find((p) => p.chave === chave);
      await remover(chave);
      if (item && !item.falha) setStatusLocal(({ [item.leadId]: _, ...resto }) => resto);
    },
    [remover],
  );

  const descartarTodos = useCallback(async () => {
    for (const p of todosRef.current.filter((p) => p.usuarioId === usuarioId)) await remover(p.chave);
    setStatusLocal({});
  }, [usuarioId, remover]);

  const valor = useMemo<ValorRegistros>(
    () => ({
      pendentes,
      sincronizando,
      statusLocal,
      versao,
      ultimoRegistro,
      contadores,
      registrar,
      sincronizar,
      descartar,
      descartarTodos,
      limparUltimoRegistro: () => setUltimoRegistro(null),
    }),
    [pendentes, sincronizando, statusLocal, versao, ultimoRegistro, contadores, registrar, sincronizar, descartar, descartarTodos],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRegistros() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useRegistros deve ser usado dentro de <ProvedorRegistros>');
  return contexto;
}
