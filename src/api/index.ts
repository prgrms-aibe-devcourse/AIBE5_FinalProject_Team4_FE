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
    if (error.response && error.response.status >= 500)
      window.location.href = "/error/server";

    else if (!error.response)
      window.location.href = "/error/network";

    return Promise.reject(error)
  }
)

export default api
