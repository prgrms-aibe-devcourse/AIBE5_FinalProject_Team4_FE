import api from '@/api'
import type { BeApiResponse } from '@/types/be'

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

/** GET /api/weather — 반환 형식은 BE 계약을 따릅니다.
 *  보백엔드가 `region` 쿼리 파라미터를 요구하므로 기본값을 '서울'로 설정합니다.
 */
export async function fetchWeather(region: string = '서울'): Promise<any> {
  const res = await api.get('/api/weather', { params: { region } })
  return res.data  // unwrap 제거, 배열 직접 반환
}