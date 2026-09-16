import { supabase } from '../../../lib/supabase'
import {
  brazilianDateToIso,
  calculateAge,
  getInitials,
} from '../helpers/youthHelpers'
import type {
  Youth,
  YouthAccess,
  YouthFormValues,
  YouthMutationInput,
  YouthStatus,
} from '../types/youth'
import { cleanCustomData, normalizeCustomData } from '../../custom-fields/helpers/customFieldHelpers'

const PHOTO_BUCKET = 'youth-photos'
const PHOTO_URL_TTL_SECONDS = 60 * 60

interface YouthRow {
  id: string
  full_name: string
  preferred_name: string | null
  birth_date: string | null
  phone: string | null
  status: YouthStatus
  photo_path: string | null
  notes: string | null
  custom_data: unknown
  created_at: string
}

interface ProfileRow {
  role: YouthAccess['role']
  status: YouthAccess['status']
}

const getCurrentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Sua sessão expirou. Entre novamente.')
  return data.user.id
}

const getPhotoExtension = (photo: File): string => {
  if (photo.type === 'image/png') return 'png'
  if (photo.type === 'image/webp') return 'webp'
  return 'jpg'
}

const uploadPhoto = async (youthId: string, photo: File): Promise<string> => {
  const path = `${youthId}/${crypto.randomUUID()}.${getPhotoExtension(photo)}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo, {
    cacheControl: '3600',
    contentType: photo.type,
    upsert: false,
  })

  if (error) throw new Error('Não foi possível enviar a foto. Tente novamente.')
  return path
}

const removePhoto = async (path: string | null): Promise<void> => {
  if (!path) return
  await supabase.storage.from(PHOTO_BUCKET).remove([path])
}

const createPhotoUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, PHOTO_URL_TTL_SECONDS)

  return error ? null : data.signedUrl
}

const mapYouth = async (row: YouthRow): Promise<Youth> => ({
  id: row.id,
  fullName: row.full_name,
  preferredName: row.preferred_name?.trim() || row.full_name.split(/\s+/)[0] || row.full_name,
  birthDate: row.birth_date,
  age: calculateAge(row.birth_date),
  phone: row.phone ?? '',
  status: row.status,
  initials: getInitials(row.preferred_name?.trim() || row.full_name),
  photoPath: row.photo_path,
  photoUrl: await createPhotoUrl(row.photo_path),
  notes: row.notes ?? null,
  customData: normalizeCustomData(row.custom_data),
  createdAt: row.created_at,
})

const toDatabaseValues = (values: YouthFormValues) => ({
  full_name: values.fullName.trim(),
  preferred_name: values.preferredName.trim() || null,
  birth_date: brazilianDateToIso(values.birthDate),
  phone: values.phone.trim() || null,
  status: values.status,
  notes: values.notes.trim() || null,
  custom_data: cleanCustomData(values.customData),
})

const youthSelection =
  'id, full_name, preferred_name, birth_date, phone, status, photo_path, notes, custom_data, created_at'

export const youthApi = {
  getAccess: async (userId: string): Promise<YouthAccess> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (error || !data) throw new Error('Não foi possível verificar seu acesso.')
    const profile = data as ProfileRow

    return {
      ...profile,
      canManage:
        profile.status === 'active' &&
        (profile.role === 'admin' || profile.role === 'leader'),
    }
  },

  list: async (): Promise<Youth[]> => {
    const { data, error } = await supabase
      .from('youths')
      .select(youthSelection)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Não foi possível carregar o diretório.')
    return Promise.all(((data ?? []) as YouthRow[]).map(mapYouth))
  },

  create: async ({ values, photo }: YouthMutationInput): Promise<Youth> => {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('youths')
      .insert({
        ...toDatabaseValues(values),
        created_by: userId,
        updated_by: userId,
      })
      .select(youthSelection)
      .single()

    if (error || !data) throw new Error('Não foi possível adicionar o jovem.')
    let row = data as YouthRow

    if (photo) {
      try {
        const photoPath = await uploadPhoto(row.id, photo)
        const { data: updated, error: updateError } = await supabase
          .from('youths')
          .update({ photo_path: photoPath, updated_by: userId })
          .eq('id', row.id)
          .select(youthSelection)
          .single()

        if (updateError || !updated) {
          await removePhoto(photoPath)
          throw new Error('Não foi possível vincular a foto ao cadastro.')
        }

        row = updated as YouthRow
      } catch (photoError) {
        await supabase.from('youths').delete().eq('id', row.id)
        throw photoError
      }
    }

    return mapYouth(row)
  },

  update: async (
    youth: Youth,
    { values, photo, removePhoto: shouldRemovePhoto }: YouthMutationInput,
  ): Promise<Youth> => {
    const userId = await getCurrentUserId()
    let nextPhotoPath = shouldRemovePhoto ? null : youth.photoPath
    let uploadedPath: string | null = null

    if (photo) {
      uploadedPath = await uploadPhoto(youth.id, photo)
      nextPhotoPath = uploadedPath
    }

    const { data, error } = await supabase
      .from('youths')
      .update({
        ...toDatabaseValues(values),
        photo_path: nextPhotoPath,
        updated_by: userId,
      })
      .eq('id', youth.id)
      .select(youthSelection)
      .single()

    if (error || !data) {
      await removePhoto(uploadedPath)
      throw new Error('Não foi possível salvar as alterações.')
    }

    if (youth.photoPath && youth.photoPath !== nextPhotoPath) {
      await removePhoto(youth.photoPath)
    }

    return mapYouth(data as YouthRow)
  },

  setStatus: async (youth: Youth, status: YouthStatus): Promise<Youth> => {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('youths')
      .update({ status, updated_by: userId })
      .eq('id', youth.id)
      .select(youthSelection)
      .single()

    if (error || !data) {
      throw new Error(
        status === 'archived'
          ? 'Não foi possível arquivar o jovem.'
          : 'Não foi possível restaurar o jovem.',
      )
    }
    return mapYouth(data as YouthRow)
  },
}
