import api from '@/api'
import type { BeApiResponse, MockTokenData } from '@/types/be'

export const DEFAULT_DEV_USER_ID = 1

/** 로컬 개발: BE mock-token으로 JWT를 localStorage에 저장 */
export async function ensureDevToken(
  userId = DEFAULT_DEV_USER_ID,
  options?: { forceRefresh?: boolean },
): Promise<void> {
  if (!options?.forceRefresh && localStorage.getItem('token')) return

  const response = await api.get<BeApiResponse<MockTokenData>>(
    `/api/v1/auth/mock-token?userId=${userId}`,
  )
  const body = response.data

  if (!body.success || !body.data?.accessToken) {
    throw new Error(
      '개발용 토큰 발급에 실패했습니다. BE가 local 프로필로 실행 중인지 확인하세요.',
    )
  }

  localStorage.setItem('token', body.data.accessToken)
}

export function clearDevToken(): void {
  localStorage.removeItem('token')
}

