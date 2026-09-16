export type AccessRole = 'member' | 'leader' | 'admin'
export type AccessStatus = 'pending' | 'active' | 'blocked'
export type AccessFilter = 'all' | AccessStatus

export interface AccessProfile {
  id: string
  fullName: string
  email: string
  role: AccessRole
  status: AccessStatus
  createdAt: string
  updatedAt: string
}

export interface AccessUpdate {
  role: AccessRole
  status: AccessStatus
}
