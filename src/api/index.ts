import axios from 'axios'

const api = axios.create({
  // 개발: Vite 프록시(/api -> BE). 운영: VITE_API_BASE_URL 직접 호출
  baseURL: import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL ?? ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  maxRedirects: 0, withCredentials: true, // 쿠키 자동전송
})

// 응답 인터셉터 -- 개발 중에는 페이지 이동 없이 호출부에서 처리
api.interceptors.response.use(
  (response) => response,
  async(error) => {
    const originalConfig = error.config;
      // 401 처리 (refresh 로직)
      if (error.response?.status === 401) {
          if (originalConfig.url?.includes('/api/v1/auth/refresh') || originalConfig._retry) {
              return Promise.reject(error);
          }

          originalConfig._retry = true;

          try {
              await api.post('/api/v1/auth/refresh');
              return api(originalConfig);
          } catch {
              return Promise.reject(error);
          }
      }

      // 401 이외 에러 처리
      const skipRedirect =
          import.meta.env.DEV ||
          error.config?.headers?.['X-Skip-Global-Error-Redirect'] === 'true';

      if (skipRedirect) return Promise.reject(error);

      if (error.response?.status >= 500) window.location.href = '/error/server';
      else if (!error.response) window.location.href = '/error/network';

      return Promise.reject(error);
  },
)

export default api
