/**
 * localStorage에 저장된 JWT 토큰에서 유저 ID(sub)를 추출합니다.
 */
export function getUserIdFromAccessToken(): number | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    // JWT 표준 상 'sub' 필드에 userId가 들어있거나, 
    // 현재 프로젝트 BE 명세에 따라 다를 수 있으나 보통 sub를 숫자로 변환해 사용
    const sub = payload.sub || payload.userId;
    return sub ? Number(sub) : null;
  } catch (error) {
    console.error('Failed to parse token payload:', error);
    return null;
  }
}
