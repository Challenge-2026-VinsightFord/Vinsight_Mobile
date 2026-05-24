/**
 * API externa NHTSA — recalls de segurança por marca Ford (Desafio 2 / pós-venda).
 * Documentação: https://vpic.nhtsa.dot.gov/api/
 */
export async function fetchFordRecalls(modelYear, modelName) {
  const year = modelYear || '2020';
  const model = (modelName || 'FOCUS').toUpperCase().replace(/\s+/g, '');

  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=FORD&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível consultar recalls na NHTSA.');
  }

  const data = await response.json();
  const results = data?.results || [];

  return results.slice(0, 8).map((item) => ({
    id: item.NHTSACampaignNumber || String(Math.random()),
    component: item.Component || 'N/A',
    summary: item.Summary || 'Sem descrição',
    reportDate: item.ReportReceivedDate || '',
    consequence: item.Consequence || '',
  }));
}

export async function fetchDealerByCep(cep) {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos.');
  }

  const viaCep = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const address = await viaCep.json();
  if (address.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    cep: address.cep,
    city: address.localidade,
    state: address.uf,
    neighborhood: address.bairro,
    street: address.logradouro,
    label: `Concessionária Ford — ${address.localidade}/${address.uf}`,
  };
}
