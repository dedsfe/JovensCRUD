export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  required: boolean
  options: string[]
  position: number
  isActive: boolean
  createdAt: string
}

export interface CustomFieldDraft {
  label: string
  type: CustomFieldType
  required: boolean
  options: string[]
}

export type YouthCustomData = Record<string, string>
