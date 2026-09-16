import type { Youth, YouthFormValues } from '../types/youth'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

export type YouthFormField = keyof YouthFormValues
export type YouthFormErrors = Partial<Record<YouthFormField, string>>

export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—'

export const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null

  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const today = new Date()
  let age = today.getFullYear() - year
  const birthdayHasPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day)

  if (!birthdayHasPassed) age -= 1
  return age >= 0 ? age : null
}

export const formatBrazilianPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length < 3) return `(${digits}`

  const areaCode = digits.slice(0, 2)
  const localNumber = digits.slice(2)
  if (localNumber.length <= 4) return `(${areaCode}) ${localNumber}`

  const firstGroupLength = digits.length === 11 ? 5 : 4
  const firstGroup = localNumber.slice(0, firstGroupLength)
  const secondGroup = localNumber.slice(firstGroupLength)
  return `(${areaCode}) ${firstGroup}${secondGroup ? `-${secondGroup}` : ''}`
}

export const formatBrazilianDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export const isoDateToBrazilian = (value: string | null): string => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

export const brazilianDateToIso = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null

  const [, day, month, year] = match
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  const isValid =
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() === Number(month) - 1 &&
    parsed.getUTCDate() === Number(day)

  return isValid ? `${year}-${month}-${day}` : null
}

export const validateYouthField = (
  field: YouthFormField,
  values: YouthFormValues,
): string | null => {
  const fullName = values.fullName.trim()
  const preferredName = values.preferredName.trim()

  if (field === 'fullName') {
    if (fullName.length < 2) return 'Informe o nome completo.'
    if (fullName.length > 120) return 'Use no máximo 120 caracteres.'
  }

  if (field === 'preferredName') {
    if (preferredName.length < 2) return 'Informe como o jovem prefere ser chamado.'
    if (preferredName.length > 80) return 'Use no máximo 80 caracteres.'
  }

  if (field === 'birthDate') {
    if (!values.birthDate) return 'Informe a data de nascimento.'
    const isoDate = brazilianDateToIso(values.birthDate)
    if (!isoDate) return 'Use uma data válida no formato DD/MM/AAAA.'

    const birthDate = new Date(`${isoDate}T12:00:00`)
    if (birthDate > new Date()) return 'A data não pode estar no futuro.'
  }

  if (field === 'phone') {
    const phoneDigits = values.phone.replace(/\D/g, '')
    if (!phoneDigits) return 'Informe o telefone.'
    if (phoneDigits.length < 10) return 'Inclua o DDD e o número completo.'
  }

  if (field === 'status' && !['active', 'inactive'].includes(values.status)) {
    return 'Selecione a situação do jovem.'
  }

  return null
}

export const validateYouthForm = (values: YouthFormValues): YouthFormErrors =>
  (Object.keys(values) as YouthFormField[]).reduce<YouthFormErrors>(
    (errors, field) => {
      const message = validateYouthField(field, values)
      if (message) errors[field] = message
      return errors
    },
    {},
  )

export const validateYouthPhoto = (photo: File | null): string | null => {
  if (!photo) return null
  if (!IMAGE_TYPES.has(photo.type)) return 'Use uma foto JPG, PNG ou WebP.'
  if (photo.size > MAX_PHOTO_SIZE) return 'A foto deve ter no máximo 5 MB.'
  return null
}

export interface YouthDuplicateMatch {
  youth: Youth
  reasons: string[]
}

export const findDuplicateYouths = (
  youths: Youth[],
  values: YouthFormValues,
  excludeId?: string,
): YouthDuplicateMatch[] => {
  const normalizedName = normalizeText(values.fullName.trim())
  const phoneDigits = values.phone.replace(/\D/g, '')
  const birthIso = brazilianDateToIso(values.birthDate)

  return youths.reduce<YouthDuplicateMatch[]>((matches, candidate) => {
    if (candidate.id === excludeId) return matches

    const reasons: string[] = []
    if (
      normalizedName.length >= 2 &&
      normalizeText(candidate.fullName) === normalizedName
    ) {
      reasons.push('mesmo nome')
    }
    if (
      phoneDigits.length >= 10 &&
      candidate.phone.replace(/\D/g, '') === phoneDigits
    ) {
      reasons.push('mesmo telefone')
    }
    if (birthIso && candidate.birthDate === birthIso) {
      reasons.push('mesma data de nascimento')
    }

    if (reasons.length > 0) matches.push({ youth: candidate, reasons })
    return matches
  }, [])
}

export interface BirthdayDetails {
  day: number
  month: number
  isCurrentMonth: boolean
  isToday: boolean
  formattedDate: string
  turningAge: number | null
}

export const getBirthdayDetails = (birthDate: string | null): BirthdayDetails | null => {
  if (!birthDate) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  const currentYear = now.getFullYear()

  const isCurrentMonth = month === currentMonth
  const isToday = isCurrentMonth && day === currentDay

  const monthNames = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ]
  const formattedDate = `${day} de ${monthNames[month - 1]}`
  const turningAge = currentYear - year

  return {
    day,
    month,
    isCurrentMonth,
    isToday,
    formattedDate,
    turningAge: turningAge > 0 ? turningAge : null,
  }
}

export const getWhatsAppUrl = (
  phone: string,
  preferredName: string,
  type: 'general' | 'birthday' = 'general',
): string | null => {
  const raw = phone.replace(/\D/g, '')
  if (raw.length < 10) return null

  const number = raw.startsWith('55') && raw.length > 11 ? raw : `55${raw}`

  const message =
    type === 'birthday'
      ? `A paz do Senhor, ${preferredName}! Passando para desejar um feliz aniversário! Que Deus continue abençoando ricamente a sua vida e seus passos! 🎉🎂`
      : `A paz do Senhor, ${preferredName}! Tudo bem?`

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
