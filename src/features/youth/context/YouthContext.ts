import { createContext } from 'react'
import type { Youth, YouthAccess, YouthMutationInput } from '../types/youth'
import type { CustomField } from '../../custom-fields/types/customField'

export interface YouthContextValue {
  youths: Youth[]
  customFields: CustomField[]
  access: YouthAccess | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  createYouth: (input: YouthMutationInput) => Promise<Youth>
  updateYouth: (youth: Youth, input: YouthMutationInput) => Promise<Youth>
  setYouthStatus: (youth: Youth, status: Youth['status']) => Promise<Youth>
}

export const YouthContext = createContext<YouthContextValue | null>(null)
