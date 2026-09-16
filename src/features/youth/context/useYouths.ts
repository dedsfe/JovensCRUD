import { useContext } from 'react'
import { YouthContext } from './YouthContext'
import type { YouthContextValue } from './YouthContext'

export const useYouths = (): YouthContextValue => {
  const context = useContext(YouthContext)
  if (!context) throw new Error('useYouths deve ser usado dentro de YouthProvider.')
  return context
}
