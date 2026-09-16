import type { CustomField, CustomFieldDraft, CustomFieldType, YouthCustomData } from '../types/customField'

export const customFieldTypeLabels: Record<CustomFieldType, string> = {
  text: 'Texto curto',
  textarea: 'Texto longo',
  number: 'Número',
  date: 'Data',
  boolean: 'Sim ou não',
  select: 'Lista de opções',
}

export const emptyCustomFieldDraft: CustomFieldDraft = {
  label: '',
  type: 'text',
  required: false,
  options: [],
}

export const normalizeCustomData = (value: unknown): YouthCustomData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.entries(value).reduce<YouthCustomData>((current, [key, item]) => {
    if (typeof item === 'string') current[key] = item
    else if (typeof item === 'number' || typeof item === 'boolean') current[key] = String(item)
    return current
  }, {})
}

export const cleanCustomData = (value: YouthCustomData): YouthCustomData =>
  Object.entries(value).reduce<YouthCustomData>((current, [key, item]) => {
    const nextValue = item.trim()
    if (nextValue) current[key] = nextValue
    return current
  }, {})

export const validateCustomFieldDraft = (draft: CustomFieldDraft): Record<string, string> => {
  const errors: Record<string, string> = {}
  const label = draft.label.trim()
  if (label.length < 2) errors.label = 'Informe um nome com pelo menos 2 caracteres.'
  if (label.length > 80) errors.label = 'Use no máximo 80 caracteres.'
  if (draft.type === 'select') {
    const normalized = draft.options.map((option) => option.trim()).filter(Boolean)
    const unique = new Set(normalized.map((option) => option.toLocaleLowerCase('pt-BR')))
    if (normalized.length < 2) errors.options = 'Informe pelo menos duas opções.'
    else if (unique.size !== normalized.length) errors.options = 'Remova as opções repetidas.'
  }
  return errors
}

export const validateCustomFieldValues = (
  fields: CustomField[],
  values: YouthCustomData,
): Record<string, string> => fields.reduce<Record<string, string>>((errors, field) => {
  const value = values[field.id]?.trim() ?? ''
  if (field.required && !value) errors[field.id] = `${field.label} é obrigatório.`
  else if (value && field.type === 'number' && !Number.isFinite(Number(value))) {
    errors[field.id] = 'Informe um número válido.'
  } else if (value && field.type === 'select' && !field.options.includes(value)) {
    errors[field.id] = 'Escolha uma das opções disponíveis.'
  }
  return errors
}, {})
