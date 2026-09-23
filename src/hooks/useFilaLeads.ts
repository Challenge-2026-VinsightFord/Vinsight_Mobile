import { useCallback, useEffect, useRef, useState } from 'react';
import { leadsApi, type FaixaRisco, type ItemFila, type StatusLead } from '@/api';

export interface FiltroFila {
  status: StatusLead;
  risco: FaixaRisco | null;
}

interface EstadoFila {
  itens: ItemFila[];
  pagina: number; // última página carregada (base 0)
  totalPaginas: number;
  total: number;
  fase: 'carregando' | 'pronto' | 'erro';
  erro: unknown;
  atualizando: boolean; // pull-to-refresh em andamento
  erroAtualizacao: unknown; // refresh falhou, mas a lista anterior continua na tela
  carregandoMais: boolean;
  erroMais: unknown;
}

const INICIAL: EstadoFila = {
  itens: [],
  pagina: -1,
  totalPaginas: 0,
  total: 0,
  fase: 'carregando',
  erro: null,
  atualizando: false,
  erroAtualizacao: null,
  carregandoMais: false,
  erroMais: null,
};

/** Junta páginas sem repetir leads (a fila pode mudar entre uma página e outra). */
function juntar(atuais: ItemFila[], novos: ItemFila[]) {
  const ids = new Set(atuais.map((l) => l.id));
  return [...atuais, ...novos.filter((l) => !ids.has(l.id))];
}

/**
 * Estado da fila de leads com paginação incremental.
 * Mudou o filtro, a fila recomeça do zero; respostas de um filtro antigo que cheguem
 * atrasadas são descartadas (contador `geracao`).
 */
export function useFilaLeads({ status, risco }: FiltroFila) {
  const [estado, setEstado] = useState<EstadoFila>(INICIAL);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const geracao = useRef(0);
  const buscandoMais = useRef(false);

  const buscar = useCallback(
    (page: number) => leadsApi.listar({ status, risco: risco ?? undefined, page }),
    [status, risco],
  );

  const carregarInicio = useCallback(
    async (modo: 'inicial' | 'atualizar') => {
      const minha = ++geracao.current;
      buscandoMais.current = false;
      setEstado((e) => (modo === 'inicial' ? INICIAL : { ...e, atualizando: true, erroAtualizacao: null }));
      try {
        const p = await buscar(0);
        if (minha !== geracao.current) return;
        setEstado({
          ...INICIAL,
          itens: p.content,
          pagina: p.page,
          totalPaginas: p.totalPages,
          total: p.totalElements,
          fase: 'pronto',
        });
      } catch (erro) {
        if (minha !== geracao.current) return;
        setEstado((e) =>
          modo === 'atualizar' && e.fase === 'pronto'
            ? { ...e, atualizando: false, erroAtualizacao: erro }
            : { ...INICIAL, fase: 'erro', erro },
        );
      }
    },
    [buscar],
  );

  useEffect(() => {
    carregarInicio('inicial');
  }, [carregarInicio]);

  const carregarMais = useCallback(async () => {
    const e = estadoRef.current;
    if (buscandoMais.current || e.fase !== 'pronto' || e.atualizando || e.pagina + 1 >= e.totalPaginas) return;

    buscandoMais.current = true;
    const minha = geracao.current;
    setEstado((s) => ({ ...s, carregandoMais: true, erroMais: null }));
    try {
      const p = await buscar(e.pagina + 1);
      if (minha !== geracao.current) return;
      setEstado((s) => ({
        ...s,
        itens: juntar(s.itens, p.content),
        pagina: p.page,
        totalPaginas: p.totalPages,
        total: p.totalElements,
        carregandoMais: false,
      }));
    } catch (erro) {
      if (minha === geracao.current) setEstado((s) => ({ ...s, carregandoMais: false, erroMais: erro }));
    } finally {
      if (minha === geracao.current) buscandoMais.current = false;
    }
  }, [buscar]);

  return {
    ...estado,
    temMais: estado.fase === 'pronto' && estado.pagina + 1 < estado.totalPaginas,
    atualizar: useCallback(() => carregarInicio('atualizar'), [carregarInicio]),
    tentarNovamente: useCallback(() => carregarInicio('inicial'), [carregarInicio]),
    carregarMais,
  };
}
