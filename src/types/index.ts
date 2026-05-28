// 공통 API 응답 타입
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}
