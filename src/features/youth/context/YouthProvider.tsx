import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../../auth/context/useAuth'
import { youthApi } from '../api/youthApi'
import type { Youth, YouthAccess, YouthMutationInput } from '../types/youth'
import { YouthContext } from './YouthContext'

export const YouthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { user } = useAuth()
  const [youths, setYouths] = useState<Youth[]>([])
  const [access, setAccess] = useState<YouthAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const nextAccess = await youthApi.getAccess(user.id)
      setAccess(nextAccess)

      if (!nextAccess.canManage) {
        setYouths([])
        return
      }

      setYouths(await youthApi.list())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar o diretório.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    const refreshFrame = window.requestAnimationFrame(() => void refresh())
    return () => window.cancelAnimationFrame(refreshFrame)
  }, [refresh])

  const createYouth = useCallback(
    async (input: YouthMutationInput): Promise<Youth> => {
      const created = await youthApi.create(input)
      setYouths((current) => [created, ...current])
      return created
    },
    [],
  )

  const updateYouth = useCallback(
    async (youth: Youth, input: YouthMutationInput): Promise<Youth> => {
      const updated = await youthApi.update(youth, input)
      setYouths((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      return updated
    },
    [],
  )

  const setYouthStatus = useCallback(
    async (youth: Youth, status: Youth['status']): Promise<Youth> => {
      const updated = await youthApi.setStatus(youth, status)
      setYouths((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      return updated
    },
    [],
  )

  const value = useMemo(
    () => ({
      youths,
      access,
      isLoading,
      error,
      refresh,
      createYouth,
      updateYouth,
      setYouthStatus,
    }),
    [access, createYouth, error, isLoading, refresh, setYouthStatus, updateYouth, youths],
  )

  return <YouthContext.Provider value={value}>{children}</YouthContext.Provider>
}
