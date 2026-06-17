import api from '@/api'
import type { BeApiResponse } from '@/types/be'

export interface NicknameAvailabilityResponse {
  nickname: string
  available: boolean
  message: string
}

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function checkNicknameAvailability(
  nickname: string,
): Promise<NicknameAvailabilityResponse> {
  return unwrap(
    api.get<BeApiResponse<NicknameAvailabilityResponse>>(
      '/api/v1/users/nickname/check',
      { params: { nickname } },
    ),
  )
}
