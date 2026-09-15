export type YouthStatus = 'active' | 'inactive'

export interface Youth {
  id: string
  fullName: string
  preferredName: string
  age: number
  phone: string
  status: YouthStatus
  initials: string
  portraitTone: 'moss' | 'clay' | 'fern' | 'stone'
}
