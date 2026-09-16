import type { AccessRole, AccessStatus } from '../types/access'

export const accessRoleLabels: Record<AccessRole, string> = {
  member: 'Membro',
  leader: 'Líder',
  admin: 'Administrador',
}

export const accessStatusLabels: Record<AccessStatus, string> = {
  pending: 'Aguardando aprovação',
  active: 'Acesso ativo',
  blocked: 'Acesso bloqueado',
}

export const getAccessInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—'

export const formatAccessDate = (value: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

export const normalizeAccessSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
