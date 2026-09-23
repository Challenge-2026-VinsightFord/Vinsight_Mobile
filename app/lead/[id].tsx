import { useLocalSearchParams } from 'expo-router';
import { EstadoVazio, Tela } from '@/components';

// Placeholder da US-46: a visão 360° do lead é a US-47.
export default function DetalheLead() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Tela>
      <EstadoVazio icone="car-sport" titulo={`Lead #${id}`} mensagem="A visão 360° do cliente e do veículo chega na US-47." />
    </Tela>
  );
}
