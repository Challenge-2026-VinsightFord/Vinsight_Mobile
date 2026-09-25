/** Validações de formulário feitas no app, antes de chamar a API (que valida de novo). */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email: string): string | undefined {
  if (!email.trim()) return 'Informe seu e-mail.';
  if (!EMAIL.test(email.trim())) return 'E-mail em formato inválido.';
  return undefined;
}

export function validarSenha(senha: string): string | undefined {
  if (!senha) return 'Informe sua senha.';
  return undefined;
}
