import api from '@/api'
import type { BeApiResponse, MockTokenData } from '@/types/be'

export const DEFAULT_DEV_USER_ID = 1

/** 로컬 개발: BE mock-token으로 JWT를 localStorage에 저장 */
export async function ensureDevToken(userId = DEFAULT_DEV_USER_ID): Promise<void> {
  if (localStorage.getItem('token')) return

  const { data: body } = await api.get<BeApiResponse<MockTokenData>>(
    `/api/v1/auth/mock-token?userId=${userId}`,
  )

  if (!body.success || !body.data?.accessToken) {
    throw new Error('개발용 토큰 발급에 실패했습니다.')
  }

  localStorage.setItem('token', body.data.accessToken)
}

