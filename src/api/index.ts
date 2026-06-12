import axios from 'axios'

const api = axios.create({
  // 개발: Vite 프록시(/api → BE). 운영: VITE_API_BASE_URL 직접 호출
  baseURL: import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL ?? ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  maxRedirects: 0,
})

// 요청 인터셉터 (예: 토큰 자동 첨부)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 — 개발 중에는 페이지 이동 없이 호출부에서 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipRedirect =
      import.meta.env.DEV ||
      error.config?.headers?.['X-Skip-Global-Error-Redirect'] === 'true'

    if (skipRedirect) {
      return Promise.reject(error)
    }

    if (error.response && error.response.status >= 500) {
      window.location.href = '/error/server'
    } else if (!error.response) {
      window.location.href = '/error/network'
    }

    return Promise.reject(error)
  },
)

export default api
