export type AccountRole = 'member' | 'leader' | 'admin'
export type AccountStatus = 'pending' | 'active' | 'blocked'

export interface AccountProfile {
  id: string
  fullName: string
  email: string
  role: AccountRole
  status: AccountStatus
  createdAt: string
}

export interface AccountNameFormValues {
  fullName: string
}

export interface AccountPasswordFormValues {
  newPassword: string
  confirmPassword: string
}
