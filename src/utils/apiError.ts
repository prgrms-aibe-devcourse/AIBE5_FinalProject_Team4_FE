import axios from 'axios'

export function extractApiErrorMessage(
  error: unknown,
  fallback = '요청에 실패했습니다.',
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined
    if (typeof body?.message === 'string' && body.message.trim()) {
      return body.message
    }
    const status = error.response?.status
    if (status === 401) return '로그인이 필요합니다. 다시 로그인해 주세요.'
    if (status === 403) return '접근 권한이 없습니다.'
    if (status === 404) return '요청한 정보를 찾을 수 없습니다.'
    if (status === 400) return '요청 값이 올바르지 않습니다.'
    if (status === 409) return '이미 처리된 요청이거나 상태가 충돌했습니다.'
    if (status === 502) return '외부 AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    if (status && status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    if (!error.response) return '네트워크 연결을 확인해 주세요.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
