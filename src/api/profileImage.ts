import api from '@/api'
import type { BeApiResponse } from '@/types/be'

const PROFILE_IMAGE_TIMEOUT_MS = 60_000

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function uploadProfileImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const data = await unwrap(
    api.post<BeApiResponse<{ imageUrl: string }>>(
      '/api/v1/users/profile/image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: PROFILE_IMAGE_TIMEOUT_MS,
      },
    ),
  )

  if (!data.imageUrl) {
    throw new Error('프로필 이미지 URL이 응답에 없습니다.')
  }

  return data.imageUrl
}
