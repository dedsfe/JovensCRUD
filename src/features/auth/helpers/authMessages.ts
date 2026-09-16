const emailLimitMessage =
  'O limite temporário de e-mails foi atingido. Aguarde e tente novamente mais tarde.'

const knownCodes: Record<string, string> = {
  over_email_send_rate_limit: emailLimitMessage,
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
}

const knownMessages: Array<[string, string]> = [
  ['invalid login credentials', 'E-mail ou senha incorretos.'],
  ['email not confirmed', 'Confirme seu e-mail antes de entrar.'],
  ['user already registered', 'Já existe uma conta com este e-mail.'],
  ['password should be at least', 'A senha precisa ter pelo menos 12 caracteres.'],
  ['unable to validate email address', 'Digite um endereço de e-mail válido.'],
  ['email rate limit exceeded', emailLimitMessage],
  ['for security purposes', 'Aguarde alguns segundos antes de tentar novamente.'],
]

export const getAuthErrorMessage = (error: unknown): string => {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : ''
  const message = error instanceof Error ? error.message.toLocaleLowerCase('en-US') : ''
  const match = knownMessages.find(([source]) => message.includes(source))

  return knownCodes[code] ?? match?.[1] ?? 'Não foi possível concluir. Tente novamente.'
}
