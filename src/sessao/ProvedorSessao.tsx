import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { aoEncerrarSessao, authApi, ErroApi, type Credenciais, type Perfil, type Usuario } from '@/api';

/**
 * Estado de autenticação do app. A navegação (app/_layout.tsx) só olha para `status`:
 * `autenticado` libera as abas, `anonimo` mostra o login.
 */
export type EstadoSessao =
  | { status: 'carregando' }
  | { status: 'anonimo'; motivo: 'expirada' | null }
  | { status: 'autenticado'; usuario: Usuario };

interface ValorSessao {
  estado: EstadoSessao;
  /** Atalho: o usuário logado, ou `null`. */
  usuario: Usuario | null;
  entrar: (credenciais: Credenciais) => Promise<Usuario>;
  sair: () => Promise<void>;
}

/** Perfis atendidos pelo app. ANALISTA_FORD usa o dashboard web (a API nega fila e clientes a ele). */
const PERFIS_DO_APP: Perfil[] = ['CONSULTOR', 'GERENTE', 'ADMIN'];

const ContextoSessao = createContext<ValorSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>({ status: 'carregando' });

  // Ao abrir o app: sessão salva no SecureStore vai direto para a fila. Se o access token
  // tiver vencido, a primeira requisição renova sozinha (src/api/http.ts).
  useEffect(() => {
    let ativo = true;
    authApi
      .usuarioSalvo()
      .catch(() => null)
      .then((usuario) => {
        if (ativo) setEstado(usuario ? { status: 'autenticado', usuario } : { status: 'anonimo', motivo: null });
      });
    return () => {
      ativo = false;
    };
  }, []);

  // A camada HTTP avisa quando o refresh foi recusado: volta ao login com o aviso.
  useEffect(
    () =>
      aoEncerrarSessao(() => {
        setEstado((atual) => (atual.status === 'autenticado' ? { status: 'anonimo', motivo: 'expirada' } : atual));
      }),
    [],
  );

  const entrar = useCallback(async (credenciais: Credenciais) => {
    const usuario = await authApi.entrar(credenciais);
    if (!PERFIS_DO_APP.includes(usuario.perfil)) {
      await authApi.sair();
      throw new ErroApi({
        status: 403,
        codigo: 'perfil-sem-permissao',
        mensagem: 'Este aplicativo é para as equipes das concessionárias. Analistas Ford usam o dashboard web.',
      });
    }
    setEstado({ status: 'autenticado', usuario });
    return usuario;
  }, []);

  const sair = useCallback(async () => {
    await authApi.sair();
    setEstado({ status: 'anonimo', motivo: null });
  }, []);

  const valor = useMemo<ValorSessao>(
    () => ({ estado, usuario: estado.status === 'autenticado' ? estado.usuario : null, entrar, sair }),
    [estado, entrar, sair],
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao() {
  const contexto = useContext(ContextoSessao);
  if (!contexto) throw new Error('useSessao deve ser usado dentro de <ProvedorSessao>');
  return contexto;
}

/** Para telas protegidas: garante que há usuário (o layout só as monta nesse caso). */
export function useUsuario(): Usuario {
  const { usuario } = useSessao();
  if (!usuario) throw new Error('useUsuario chamado fora de uma rota protegida');
  return usuario;
}
