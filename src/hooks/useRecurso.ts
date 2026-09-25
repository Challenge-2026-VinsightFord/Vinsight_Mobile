import { useCallback, useEffect, useRef, useState } from 'react';

interface EstadoRecurso<T> {
  dados: T | undefined;
  erro: unknown;
  carregando: boolean;
}

/**
 * Carrega um recurso identificado por `chave`. Com chave nula, espera (útil quando o id
 * depende de outra requisição). Recarregar mantém os dados antigos na tela até chegar a resposta.
 */
export function useRecurso<T>(chave: string | number | null | undefined, carregar: () => Promise<T>) {
  const [estado, setEstado] = useState<EstadoRecurso<T>>({ dados: undefined, erro: null, carregando: chave != null });
  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;
  const geracao = useRef(0);

  const executar = useCallback(async () => {
    if (chave == null) return;
    const minha = ++geracao.current;
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    try {
      const dados = await carregarRef.current();
      if (minha === geracao.current) setEstado({ dados, erro: null, carregando: false });
    } catch (erro) {
      if (minha === geracao.current) setEstado((e) => ({ dados: e.dados, erro, carregando: false }));
    }
  }, [chave]);

  useEffect(() => {
    executar();
  }, [executar]);

  return { ...estado, recarregar: executar };
}
