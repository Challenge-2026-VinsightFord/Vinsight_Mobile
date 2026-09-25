import { useEffect, useState } from 'react';

/** Devolve `valor` só depois de `ms` sem mudanças (ex.: busca enquanto o usuário digita). */
export function useDebounce<T>(valor: T, ms = 250): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(timer);
  }, [valor, ms]);
  return atrasado;
}
