export interface PasswordRequirement {
  key: 'length' | 'mixedCase' | 'number' | 'symbol'
  label: string
  met: boolean
}

export interface PasswordAssessment {
  score: number
  label: 'Não avaliada' | 'Fraca' | 'Razoável' | 'Boa' | 'Forte'
  requirements: PasswordRequirement[]
}

const strengthLabels: PasswordAssessment['label'][] = [
  'Não avaliada',
  'Fraca',
  'Razoável',
  'Boa',
  'Forte',
]

export const MIN_PASSWORD_LENGTH = 12

export const assessPassword = (password: string): PasswordAssessment => {
  const requirements: PasswordRequirement[] = [
    {
      key: 'length',
      label: `${MIN_PASSWORD_LENGTH} caracteres`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      key: 'mixedCase',
      label: 'letras maiúsculas e minúsculas',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { key: 'number', label: 'um número', met: /\d/.test(password) },
    {
      key: 'symbol',
      label: 'um símbolo',
      met: /[^\p{L}\p{N}\s]/u.test(password),
    },
  ]
  const score = password ? requirements.filter(({ met }) => met).length : 0

  return {
    score,
    label: strengthLabels[score],
    requirements,
  }
}

export const isStrongPassword = (password: string): boolean =>
  assessPassword(password).score === 4
