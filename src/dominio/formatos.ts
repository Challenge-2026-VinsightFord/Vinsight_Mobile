/** Formatação de valores para exibição (pt-BR). */

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');

export const formatarMoeda = (valor: number | null | undefined) => (valor == null ? '—' : moeda.format(valor));

export const formatarKm = (km: number | null | undefined) => (km == null ? '—' : `${inteiro.format(km)} km`);

/** 0.87 → "87%" */
export const formatarPercentual = (fracao: number | null | undefined) =>
  fracao == null ? '—' : `${Math.round(fracao * 100)}%`;

/** "2026-10-02" ou ISO completo → "02/10/2026". Datas sem hora são tratadas como locais. */
export function formatarData(iso: string | null | undefined) {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

/** ISO com hora → "02/10/2026 09:00" no fuso do aparelho. */
export function formatarDataHora(iso: string | null | undefined) {
  if (!iso) return '—';
  const data = new Date(iso);
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const hh = String(data.getHours()).padStart(2, '0');
  const mi = String(data.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${data.getFullYear()} ${hh}:${mi}`;
}

/** "ABC1D23" → "ABC-1D23" (padrão de exibição de placa). */
export const formatarPlaca = (placa: string) =>
  placa.length === 7 ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];
