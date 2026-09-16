import type { YouthCustomData } from '../../custom-fields/types/customField'

export type YouthStatus = 'active' | 'inactive' | 'archived'

export interface Youth {
  id: string
  fullName: string
  preferredName: string
  birthDate: string | null
  age: number | null
  phone: string
  status: YouthStatus
  initials: string
  photoPath: string | null
  photoUrl: string | null
  notes: string | null
  customData: YouthCustomData
  createdAt: string
}

export interface YouthFormValues {
  fullName: string
  preferredName: string
  birthDate: string
  phone: string
  status: 'active' | 'inactive'
  notes: string
  customData: YouthCustomData
}

export interface YouthMutationInput {
  values: YouthFormValues
  photo: File | null
  removePhoto: boolean
}

export interface YouthAccess {
  role: 'member' | 'leader' | 'admin'
  status: 'pending' | 'active' | 'blocked'
  canManage: boolean
}
