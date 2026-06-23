import api from '@/api'

/** GET /api/weather — 반환 형식은 BE 계약을 따릅니다.
 *  백엔드가 `region` 쿼리 파라미터를 요구하므로 기본값을 '서울'로 설정합니다.
 */
export async function fetchWeather(region: string = '서울특별시'): Promise<any> {
  const res = await api.get('/api/weather', { params: { region } })
  return res.data
}
