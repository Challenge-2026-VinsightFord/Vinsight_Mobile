import { EstadoVazio, Tela } from '@/components';

// Placeholder da US-44: a fila priorizada (busca, filtros, paginação) é a US-46.
export default function Fila() {
  return (
    <Tela>
      <EstadoVazio
        icone="list"
        titulo="Fila de leads"
        mensagem="A fila priorizada por score será conectada à Lead Engine na US-46."
      />
    </Tela>
  );
}
