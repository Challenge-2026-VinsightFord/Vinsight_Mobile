import { Linking } from 'react-native';
import type { CanalContato } from '@/api';
import { informar } from './confirmar';

/**
 * Abre o app do canal (discador, WhatsApp, e-mail) com o contato do cliente.
 *
 * O backend mascara telefone e e-mail conforme o perfil (o CONSULTOR recebe "(11) *****-4321").
 * O app nunca desmascara: com valor mascarado, avisamos que o contato segue pela central
 * da concessionária em vez de abrir um discador com número incompleto.
 */
export async function iniciarContato(canal: CanalContato, valor: string, nomeCliente: string) {
  if (valor.includes('*')) {
    await informar(
      'Contato protegido (LGPD)',
      `Pelo seu perfil, o ${canal === 'EMAIL' ? 'e-mail' : 'telefone'} de ${nomeCliente} aparece mascarado. ` +
        'Faça o contato pela central de relacionamento da concessionária e registre o desfecho aqui no app.',
    );
    return;
  }

  const digitos = valor.replace(/\D/g, '');
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const url =
    canal === 'EMAIL' ? `mailto:${valor}` : canal === 'WHATSAPP' ? `https://wa.me/${comDdi}` : `tel:+${comDdi}`;

  try {
    await Linking.openURL(url);
  } catch {
    await informar('Não foi possível abrir', 'Nenhum aplicativo deste aparelho consegue abrir esse contato.');
  }
}
