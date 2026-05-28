import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 (예: 토큰 자동 첨부)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 (예: 공통 에러 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 처리 등 공통 로직 추가 가능
    return Promise.reject(error)
  }
)

export default api
