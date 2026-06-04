---
doc_type: fe_api_usage
source_of_truth: AIBE5_FinalProject_Team4_FE
api_contract_source_of_truth: AIBE5_FinalProject_Team4_BE/docs/api/api-contract.md
last_updated: 2026-06-04
---

# API 사용 기준

이 문서는 FE에서 BE API를 호출하고 응답을 화면에 반영하는 기준을 정리합니다. 전체 API 계약의 원본은 BE 레포의 `docs/api/api-contract.md`입니다.

현재 FE 코드와 API 기준의 차이는 [implementation-gaps.md](../frontend/implementation-gaps.md)에 기록합니다.

## BE API 계약과의 관계

- API 경로, 요청 필드, 응답 필드, 인증, 오류 처리의 원본 계약은 BE `docs/api/api-contract.md`를 따릅니다.
- 이 문서는 전체 API 계약을 복사하지 않고, FE 화면에서 API를 사용하는 기준을 정리합니다.
- BE API 계약과 이 문서가 다르면 BE API 계약을 우선 확인하고, FE 사용 기준 문서를 함께 수정합니다.
- API 응답 필드명은 Java DTO 기준 camelCase를 사용합니다.

## 기본 원칙

- API 호출은 공통 API 클라이언트인 `src/api/index.ts`를 우선 사용합니다.
- 백엔드 주소는 `VITE_API_BASE_URL` 환경변수를 기준으로 합니다.
- API 경로는 `/api/v1` 경로가 있으면 `/api/v1`을 우선 사용합니다.
- `/api/v1` 경로가 없는 API는 `/api` 경로를 사용합니다.
- API 응답으로 받은 데이터는 화면 상태에 반영되어야 합니다.
- mock 데이터는 [frontend/mock-policy.md](../frontend/mock-policy.md)의 기준을 따릅니다.

## API 코드 정합성 기준

- 실제 API 연동 코드는 BE `docs/api/api-contract.md`에 정의된 경로, 요청 필드, 응답 필드를 사용합니다.
- BE API 계약에 없는 경로는 실제 서비스 API로 호출하지 않습니다.
- 개발용 임시 API, mock API, 프록시 테스트 API는 실제 API 연동 코드와 구분합니다.
- 임시 API 경로를 사용해야 한다면 사용자 기능 기준으로 오해되지 않도록 mock 또는 개발용 상태로 관리합니다.
- API 요청/응답 타입은 BE `ApiResponse<T>` 구조와 실제 DTO 필드명을 기준으로 작성합니다.
- 코드에서 API 경로, 요청 필드, 응답 필드, 인증 방식, 오류 처리 기준이 바뀌면 이 문서도 함께 수정합니다.

## API 클라이언트

현재 FE 레포의 공통 API 클라이언트 위치:

```text
src/api/index.ts
```

역할:

- `VITE_API_BASE_URL`을 base URL로 사용합니다.
- `localStorage.token`이 있으면 `Authorization: Bearer {token}` 헤더를 추가합니다.
- 500 서버 내부 오류는 `/error/server`로 이동합니다.
- 502 외부 서비스 오류는 외부 서비스 오류 안내로 처리합니다.
- 네트워크 오류는 `/error/network`로 이동합니다.

## 인증 (현재 `App.tsx` 기준)

| 환경 | 로그인 시작 | 토큰 | `{userId}` |
| --- | --- | --- | --- |
| 개발(`DEV`) | 소셜 버튼 → `GET /api/v1/auth/mock-token?userId=1` (`ensureDevToken`) | `localStorage.token` | JWT `sub` → `authUserId` |
| 운영 | `GET {VITE_API_BASE_URL}/oauth2/authorization/{provider}` redirect | OAuth 콜백 `?token=` → `captureOAuthTokenFromUrl()` | 동일 |

옷장·보유/미보유 API path의 `{userId}`는 하드코딩 `1`이 아니라 **JWT `sub`** 를 사용합니다. dev의 `userId=1`은 mock-token 발급 파라미터에만 쓰입니다.

## 경로 작성 기준

권장:

```ts
api.get('/api/v1/categories')
api.get(`/api/v1/users/${userId}/clothes`)
```

지양:

```ts
fetch('/api/chat-gamyagi') // mock 경로 — 공통 api client·BE 계약 경로로 대체
api.get('api/v1/categories')
```

홈 추천(`RECO-001`)은 현재 `App.tsx`의 `MOCK_AI_CURATION`만 사용하며 `/api/recommend`를 호출하지 않습니다. ([implementation-gaps.md](../frontend/implementation-gaps.md))

직접 `fetch`를 사용하는 경우에도 인증, 에러 처리, base URL 기준이 동일하게 적용되어야 하므로 공통 API 클라이언트로 옮기는 것을 우선합니다.

## 응답 처리 기준

BE API는 기본적으로 `ApiResponse<T>` 형식을 사용합니다.

성공 응답:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

실패 응답:

```json
{
  "success": false,
  "data": null,
  "message": "요청 값이 올바르지 않습니다."
}
```

| 필드 | 타입 | FE 처리 기준 |
| --- | --- | --- |
| `success` | boolean | 요청 성공 여부를 확인합니다. |
| `data` | object/null | 성공 시 화면 상태에 반영합니다. |
| `message` | string/null | 실패 또는 안내 메시지로 표시합니다. |

BE 공통 응답 기준에는 `errorCode` 필드를 사용하지 않습니다. FE는 HTTP status와 `message`를 기준으로 오류 화면과 안내 문구를 분기합니다.

FE 공통 응답 타입은 위 구조를 반영해야 합니다. `status`, `errorCode`처럼 BE 공통 응답에 없는 필드를 기준으로 성공/실패를 판단하지 않습니다.

| HTTP status | BE 대표 상황 | FE 처리 기준 |
| --- | --- | --- |
| 400 | 잘못된 요청 값, validation 실패, 이미지 누락, 이미지 용량 초과 | 요청 오류 메시지를 표시하고 입력값을 유지합니다. |
| 401 | 로그인하지 않은 사용자, 유효하지 않은 토큰 | 인증 필요 또는 인증 만료 상태로 처리합니다. |
| 403 | 인증 사용자와 요청 대상 사용자 불일치, 접근 권한 없음 | 접근 권한 없음 안내를 표시합니다. |
| 404 | 리소스 없음 | 리소스 없음 안내 또는 404 페이지로 처리합니다. 빈 목록 상태로 대체하지 않습니다. |
| 409 | 이미 존재하는 데이터, 상태 충돌 | 중복 데이터 또는 상태 전환 불가 안내를 표시합니다. |
| 502 | 외부 API 호출 실패 | 외부 서비스 오류 안내를 표시합니다. |
| 500 | 서버 내부 오류 | 서버 오류 페이지 또는 서버 오류 안내로 처리합니다. |
| 네트워크 오류 | 서버 연결 실패 | 네트워크 에러 페이지 또는 네트워크 오류 안내로 처리합니다. |

## 로딩, 에러, 빈 상태

API를 호출하는 화면은 아래 상태를 구분합니다.

| 상태 | 기준 | 화면 처리 |
| --- | --- | --- |
| loading | 요청 진행 중 | spinner, skeleton, 진행 문구 |
| success | 응답 성공 및 데이터 존재 | 실제 데이터 표시 |
| empty | 응답 성공이나 목록 없음 | 빈 상태 문구와 다음 행동 |
| error | 요청 실패 | 에러 메시지 또는 공통 에러 페이지 |

상세 기준은 [common-loading-error.md](../features/common-loading-error.md)를 따릅니다.

## FE 주요 API 사용 범위

아래 표는 BE API 계약 중 FE 화면과 직접 연결되는 주요 API입니다. 전체 엔드포인트와 상세 계약은 BE `docs/api/api-contract.md`를 원본으로 확인합니다.

| 화면/기능 | Method | API 기준 | FE 처리 |
| --- | --- | --- | --- |
| OAuth 로그인 | GET | `/oauth2/authorization/{provider}` | 로그인 시작 |
| 카탈로그 | GET | `/api/v1/categories` | 카테고리, 타입, 색상, 스타일 선택지 렌더링 |
| 카탈로그 | GET | `/api/v1/categories/guide` | 카테고리 사용 가이드 표시 |
| 카탈로그 | GET | `/api/v1/categories/external-sources` | 외부 출처 선택지 렌더링 |
| 옷장 | GET | `/api/v1/wardrobes/users/{userId}` | 사용자 옷장 정보 표시 |
| 옷장 | POST | `/api/v1/wardrobes/users/{userId}` | 사용자 옷장 생성 |
| 옷장 요약 | GET | `/api/v1/wardrobes/users/{userId}/statistics` | 사용자 옷장에 등록된 보유/미보유 옷 통계 표시 |
| 보유 옷 | GET | `/api/v1/users/{userId}/clothes` | 보유 옷 목록 표시 |
| 보유 옷 | GET | `/api/v1/users/{userId}/clothes/favorites` | 즐겨찾기 보유 옷 표시 |
| 옷 상세 | GET | `/api/v1/clothes/{clothesId}` | 옷 상세 표시 |
| 보유 옷 등록 | POST | `/api/v1/users/{userId}/clothes` | 직접 입력 기반 옷 저장 |
| 옷 즐겨찾기 | PATCH | `/api/v1/clothes/{clothesId}/favorite` | 즐겨찾기 상태 반영 |
| 옷 수정 | PATCH | `/api/v1/clothes/{clothesId}` | 수정 결과 반영 |
| 옷 삭제 | DELETE | `/api/v1/clothes/{clothesId}` | 옷장 목록에서 제거 |
| 미보유 옷 | GET | `/api/users/{userId}/wishlist-clothes` | 미보유 옷 목록 표시 |
| 미보유 옷 | GET | `/api/users/{userId}/wishlist-clothes/favorites` | 즐겨찾기 미보유 옷 표시 |
| 미보유 옷 저장 | POST | `/api/users/{userId}/wishlist-clothes` | 추천/외부 상품을 미보유 옷으로 저장 |
| 미보유 옷 전환 | PATCH | `/api/clothes/{clothesId}/convert-to-owned` | 미보유에서 보유 전환 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos` | 옷 사진 업로드 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos/{photoId}/analyze` | 사진 분석 요청 |
| 사진 기반 등록 | GET | `/api/v1/users/{userId}/clothes/photos/{photoId}/draft` | 사진 분석 초안 표시 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos/{photoId}/save` | 사진 기반 옷 저장 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures` | 구매내역 캡처 업로드 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/analyze` | 구매내역 분석 요청 |
| 구매내역 기반 등록 | GET | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/draft` | 구매내역 분석 초안 표시 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/save` | 구매내역 기반 옷 저장 |
| 외부 상품 | GET | `/api/naver/search` | 네이버쇼핑 상품 검색 |
| 외부 상품 | POST | `/api/v1/external/clothes/naver` | 외부 상품을 옷 정보로 저장 |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/similar-products` | 유사 상품 추천 표시 |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/recommendations` | 보유 옷 기준 추천 표시 |
| 날씨 | GET | `/api/weather` | 날씨 기반 안내 또는 추천 보조 정보 표시 |
| 코디북 | GET | `/api/v1/outfit-books` | 코디북 목록 표시 |
| 코디북 | POST | `/api/v1/outfit-books` | 코디북 생성 |
| 코디북 | GET | `/api/v1/outfit-books/{bookId}` | 코디북 상세 표시 |
| 코디 | POST | `/api/v1/outfit-books/{bookId}/outfits` | 코디 저장 |
| 이미지 | GET | `/api/v1/images/clothes/{userId}/{filename}` | 옷 이미지 표시 |
| 이미지 | GET | `/api/v1/images/purchase-captures/{userId}/{filename}` | 구매내역 캡처 이미지 표시 |

## 사용자 ID 기준

사용자별 리소스 API의 `{userId}`는 인증된 사용자의 ID를 사용합니다. BE는 JWT의 사용자 ID와 path의 `userId`가 일치해야 하는 것을 기준으로 합니다.

문서와 코드 예시의 `{userId}`는 placeholder입니다. 실제 API 호출 코드에는 고정된 사용자 ID 하드코딩을 남기지 않습니다. 화면 개발이나 데모를 위한 임시 ID가 필요하면 [mock-policy.md](../frontend/mock-policy.md)의 mock 기준에 따라 실제 API 호출과 분리합니다.

## API 문서 변경 기준

- FE가 사용하는 API 경로, 요청 필드, 응답 필드가 바뀌면 이 문서를 같은 PR 또는 동기화 PR에서 수정합니다.
- BE API 계약이 바뀌면 BE `docs/api/api-contract.md`를 먼저 확인하고, FE 사용 기준도 함께 갱신합니다.
- API 변경으로 화면의 loading, empty, error 처리 방식이 달라지면 [common-loading-error.md](../features/common-loading-error.md)도 함께 확인합니다.
