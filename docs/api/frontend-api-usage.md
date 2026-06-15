---
doc_type: fe_api_usage
source_of_truth: AIBE5_FinalProject_Team4_FE
api_contract_source_of_truth: AIBE5_FinalProject_Team4_BE/docs/api/api-contract.md
last_updated: 2026-06-14
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

## 인증 (현재 `LoginPage` + `App.tsx`)

| 환경 | 로그인 시작 | 토큰 | `{userId}` |
| --- | --- | --- | --- |
| 개발(`DEV`) | `LoginPage` provider 버튼 → `App.handleSocialLogin` → `ensureDevToken` → `GET /api/v1/auth/mock-token?userId=1` | `localStorage.token` | JWT `sub` → `authUserId` |
| 운영 | 동일 버튼 → `redirectToOAuthLogin(provider)` → `GET {VITE_API_BASE_URL}/oauth2/authorization/{provider}` | OAuth 콜백 `?token=` → `captureOAuthTokenFromUrl()` | 동일 |

옷장·보유/미보유 API path의 `{userId}`는 하드코딩 `1`이 아니라 **JWT `sub`** 를 사용합니다. dev의 `userId=1`은 mock-token 발급 파라미터에만 쓰입니다.

`DEV`이어도 `.env.local` 파일에 `VITE_USE_REAL_AUTH`가 `true`라면 실제 OAuth 경로를 타게 됩니다.

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

홈 추천은 라벨별로 다릅니다. OOTD(`RECO-001`)와 취향 기반 추천(`RECO-002`)은 static/mock입니다. 유사 상품(`RECO-003`)은 `src/api/similarProducts.ts`, AI MD(`RECO-006`)는 `src/api/aiMd.ts`, 어울리는 옷(`RECO-005`)은 `src/api/recommendations.ts`를 통해 실제 BE API를 호출합니다. `RECO-003`의 기준 옷은 `GET /api/v1/users/{userId}/clothes`에서 반환된 `OWNED` 옷만 허용합니다. `RECO-005`는 `limitPerCategory=50`을 기본값으로 사용합니다. ([implementation-gaps.md](../frontend/implementation-gaps.md), [home-recommendation.md](../features/home-recommendation.md))

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
| 내 프로필 | GET | `/api/v1/users/profile` | 로그인 사용자 본인의 마이페이지 정보 표시 |
| 사용자 프로필 | GET | `/api/v1/users/profile/{userId}` | 타 사용자 프로필 또는 룩피드 프로필 표시 |
| 카탈로그 | GET | `/api/v1/categories` | 카테고리, 타입, 색상, 스타일 선택지 렌더링 |
| 카탈로그 | GET | `/api/v1/categories/guide` | 카테고리 사용 가이드 표시 |
| 카탈로그 | GET | `/api/v1/categories/ai-guide` | AI 분석용 카탈로그 가이드 확인 |
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
| 미보유 옷 전환 | PATCH | `/api/v1/clothes/{clothesId}/convert-to-owned` | 미보유에서 보유 전환 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos` | 옷 사진 업로드 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos/{photoId}/analyze` | 사진 분석 요청 |
| 사진 기반 등록 | GET | `/api/v1/users/{userId}/clothes/photos/{photoId}/draft` | 사진 분석 초안 표시 |
| 사진 기반 등록 | POST | `/api/v1/users/{userId}/clothes/photos/{photoId}/save` | 사진 기반 옷 저장 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures` | 구매내역 캡처 업로드 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/analyze` | 구매내역 분석 요청 |
| 구매내역 기반 등록 | GET | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/draft` | 구매내역 분석 초안 표시 |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/save` | 상품별 옷 저장 (`itemIndex` 선택, 생략 시 0) |
| 구매내역 기반 등록 | POST | `/api/v1/users/{userId}/clothes/purchase-captures/{captureId}/items/{itemIndex}/skip` | 복수 상품 캡처에서 특정 상품 건너뛰기 |
| 외부 상품 | GET | `/api/naver/search` | 네이버쇼핑 상품 검색 |
| 외부 상품 | POST | `/api/v1/external/clothes/naver` | 외부 상품을 옷 정보로 저장 |
| 추천 | GET | `/api/v1/recommendations/{wardrobeId}?currentTemp={temp}` | 취향 기반 상품 추천 표시. 현재 FE 홈 `style` 라벨은 static/mock |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/similar-products` | `OWNED` 기준 옷의 유사 상품 추천 표시. FE 홈 `similar` 라벨 연동 |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/recommendations?limitPerCategory={n}` | 옷장 기반 어울리는 옷 추천. FE `match` 라벨 연동. 기본 `n=50` |
| 추천 | GET | `/api/v1/ootd/{wardrobeId}?currentTemp={temp}` | OOTD 추천 표시. 현재 FE 홈 `ootd` 라벨은 static/mock |
| 추천 | POST | `/api/v1/users/{userId}/recommendations/feedback` | 추천 저장/싫어요/추천 제외 피드백 제출 |
| AI MD | GET | `/api/v1/users/{userId}/recommendations/ai-md/personas` | 사용자 성별에 맞는 AI MD 목록 표시 |
| AI MD | GET | `/api/v1/users/{userId}/recommendations/ai-md/{mdId}/products` | AI MD 외부 상품 추천 표시 |
| AI MD | POST | `/api/v1/users/{userId}/recommendations/ai-md/{mdId}/outfits` | AI MD 코디 후보 생성 |
| AI MD | POST | `/api/v1/users/{userId}/recommendations/ai-md/{mdId}/outfits/save` | 사용자가 선택한 AI MD 코디 후보 저장 |
| 날씨 | GET | `/api/weather` | 추천 보조 정보 표시. 독립 추천 기능으로 보지 않음 |
| 코디북 | GET | `/api/v1/outfit-books` | 코디북 목록 표시 |
| 코디북 | POST | `/api/v1/outfit-books` | 코디북 생성 |
| 코디북 | GET | `/api/v1/outfit-books/{bookId}` | 코디북 상세 표시 |
| 코디 | POST | `/api/v1/outfit-books/{bookId}/outfits` | 코디 저장 |
| 코디 | GET | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 저장 코디 상세와 구성 옷 표시 |
| 코디 | PUT | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 코디 수정 |
| 코디 | DELETE | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 코디 삭제 |
| 이미지 | GET | `/api/v1/images/clothes/{userId}/{filename}` | 옷 이미지 표시 |
| 이미지 | GET | `/api/v1/images/purchase-captures/{userId}/{filename}` | 구매내역 캡처 이미지 표시 |

## 추천 API 동기화 기준

BE 추천 API 중 현재 FE에서 실제 호출하는 API와 아직 mock/static 상태인 API를 구분합니다.

| 세부기능 ID | BE API | 현재 FE 상태 |
| --- | --- | --- |
| `RECO-001` | `GET /api/v1/ootd/{wardrobeId}?currentTemp={temp}` | `HomeTab` `ootd` 라벨 static/mock |
| `RECO-002` | `GET /api/v1/recommendations/{wardrobeId}?currentTemp={temp}` | `HomeTab` `style` 라벨 static/mock |
| `RECO-003` | `GET /api/v1/users/{userId}/clothes/{clothesId}/similar-products` | `HomeTab` `similar` 라벨 연동. 기준 옷은 `OWNED`만 노출 |
| `RECO-005` | `GET /api/v1/users/{userId}/clothes/{clothesId}/recommendations?limitPerCategory={n}` | `HomeTab` `match` 라벨 연동. FE 기본 `n=50` |
| `RECO-006` | `/api/v1/users/{userId}/recommendations/ai-md/**` | `HomeTab` `aimd` 라벨 연동. MD 목록·코디/상품 추천·코디 저장 사용 |
| `RECO-013`~`RECO-014` | `POST /api/v1/users/{userId}/recommendations/feedback` | 저장/싫어요/추천 제외 액션 연동 필요 |

추천 응답에서 FE가 카드와 저장 액션에 사용하는 주요 필드는 아래 기준을 따릅니다.

| 필드 | FE 처리 기준 |
| --- | --- |
| `brandName` | 추천 카드 브랜드명과 브랜드 로고 매칭에 사용합니다. 값이 비어 있으면 `UNKNOWN` 또는 대체 문구로 처리합니다. |
| `season` | `CLOTHES.season` code입니다. 추천 카드 저장 payload에 전달할 수 있지만 사용자별 옷장 정보로 해석하지 않습니다. |
| `externalProductUrl` | 구매 이동 URL 또는 네이버쇼핑 URL 생성의 우선 입력값입니다. 값이 없으면 상품명 기반 검색 URL로 대체할 수 있습니다. |
| `gender` | 옷 대상 성별 code입니다. 사용자 화면에 표시하지 않고 내부 필터/추천 제외 기준으로만 사용합니다. |

AI MD 추천은 아래 기준을 함께 확인합니다.

- persona의 `speechStyle`은 화면 문구 또는 말투 설명에 사용할 수 있지만, 고정 UI 텍스트로 하드코딩하지 않습니다.
- AI MD 코디 후보는 `TOP`, `BOTTOM`, `SHOES`가 모두 포함된 완성형 코디만 유효한 후보로 봅니다.
- AI MD 상품 추천은 BE가 사용자 스타일 점수와 외부 상품 다양성 기준을 반영해 내려준 결과를 표시합니다.
- 상세 연동 기준이 필요하면 BE `docs/api/ai-md-api-spec.md`와 `docs/api/similar-product-api-spec.md`를 원본으로 확인합니다.

`RECO-005` `match` 상세에서 구매 링크 클릭 후 **샀어요** 선택 시 FE는 `POST /api/users/{userId}/wishlist-clothes`(필요 시)와 `PATCH /api/clothes/{id}/convert-to-owned`로 보유 옷장 등록합니다. 흐름 상세는 [home-recommendation.md](../features/home-recommendation.md)를 따릅니다.

날씨, 지역, 체감온도 정보(`EXT-004`~`EXT-006`)는 독립 추천 기능이 아니라 `RECO-001`, `RECO-002` 등 추천 기능의 보조 조건입니다. `/api/weather`는 추천 보조 정보 API로 설명합니다.

옷 대상 성별(`gender`)은 응답 또는 저장 요청 payload에 포함될 수 있지만 사용자 화면에 표시하거나 필터 UI로 노출하지 않습니다. FE는 필요 시 내부 분류/추천 제외 기준으로만 사용합니다.

옷 계절(`season`)은 `CLOTHES.season` 기준의 공통 옷 정보입니다. FE는 옷 등록 저장 요청에 `season` code를 포함할 수 있으며, 생성된 옷의 계절을 옷 수정 화면에서 변경하는 UI로 다루지 않습니다. 현재 `GET /api/v1/categories` 일반 응답은 계절 code 목록을 별도 필드로 제공하지 않으므로, 계절 code 기준은 [catalog.md](../domain/catalog.md)의 계절 섹션을 따릅니다.

## 인증 유지 API 확인 대상 (`AUTH-005`)

인증 유지 API는 `AUTH-005` 로그인 상태 유지 기준에 포함됩니다. FE는 아래 계약을 기준으로 API 클라이언트와 타입을 확인합니다.

| 기능 | Method | API 기준 | FE 확인 대상 |
| --- | --- | --- | --- |
| access token 재발급 | POST | `/api/v1/auth/refresh` | 401 처리, access token 갱신, 쿠키 전달 |
| 로그아웃 | POST | `/api/v1/auth/logout` | local token 제거, 세션 종료, 로그인 화면 이동 |

`refresh_token`은 HttpOnly 쿠키 기준이므로 FE에서 값을 직접 읽지 않습니다. 실제 FE 구현 반영 전까지는 [implementation-gaps.md](../frontend/implementation-gaps.md)에 미연동 항목으로 둡니다.

## 구매내역 복수 상품 등록 (`REG-002`)

analyze/draft 응답(`PurchaseCaptureDraftResponse`)과 save 응답(`PurchaseCaptureRegistrationResponse`)은 아래 필드를 공통으로 사용합니다.

| 필드 | FE 처리 |
| --- | --- |
| `items[]` | 상품 카드 목록. `itemIndex`, `status`(`PENDING`/`SAVED`/`SKIPPED`), `season`, `gender`, `imageUrl` 사용 |
| `pendingItemCount` | 남은 상품 수 표시, 완료 여부 판단 |
| `captureCompleted` | true이면 등록 플로우 종료 |

저장 요청(`PurchaseCaptureSaveRequest`):

- 단일 상품: 기존과 같이 `itemIndex` 생략 가능 (BE가 0으로 처리)
- 복수 상품: `itemIndex` 필수 권장
- `imageUrl` (선택): 요청 값을 최우선 사용. 생략 시 BE가 draft `items[].imageUrl` → 캡처 `previewUrl` 순으로 fallback. FE는 `buildPurchaseSavePayload`에서 URL이 있을 때만 필드를 포함합니다.
- `externalSource` (필수): 카탈로그 code. FE는 쇼핑몰 미선택·미인식 시 `CUSTOM`으로 전송합니다 (`UNKNOWN`은 카탈로그에 없음).

분석 실패 (`analysisStatus=FAILED`):

- AI가 카탈로그 code가 아닌 값을 반환하면 BE가 `analysisStatus=FAILED`로 내립니다. 유효한 code만 `SUCCESS` 초안이 됩니다.
- 저장 API는 `analysisStatus=SUCCESS` 캡처만 허용합니다. FAILED 캡처는 수동 입력 저장 경로가 없습니다.
- FE는 FAILED·분석 API 오류 시 업로드 단계로 되돌리고 저장 버튼을 제공하지 않으며, 다른 캡처 선택 또는 **AI 분석 다시 시도**로 유도합니다.

건너뛰기:

```ts
POST /api/v1/users/{userId}/clothes/purchase-captures/{captureId}/items/{itemIndex}/skip
```

응답은 갱신된 draft(`PurchaseCaptureDraftResponse`)입니다. FE local state만 `skipped`로 바꾸지 않고 API를 호출해 서버 `item_progress`와 동기화합니다.

타입 위치: `src/types/purchaseCaptureRegistration.ts` (공통 `BeApiResponse`는 `src/types/be.ts`)

## 사용자 ID 기준

사용자별 리소스 API의 `{userId}`는 인증된 사용자의 ID를 사용합니다. BE는 JWT의 사용자 ID와 path의 `userId`가 일치해야 하는 것을 기준으로 합니다.

문서와 코드 예시의 `{userId}`는 placeholder입니다. 실제 API 호출 코드에는 고정된 사용자 ID 하드코딩을 남기지 않습니다. 화면 개발이나 데모를 위한 임시 ID가 필요하면 [mock-policy.md](../frontend/mock-policy.md)의 mock 기준에 따라 실제 API 호출과 분리합니다.

## API 문서 변경 기준

- FE가 사용하는 API 경로, 요청 필드, 응답 필드가 바뀌면 이 문서를 같은 PR 또는 동기화 PR에서 수정합니다.
- BE API 계약이 바뀌면 BE `docs/api/api-contract.md`를 먼저 확인하고, FE 사용 기준도 함께 갱신합니다.
- API 변경으로 화면의 loading, empty, error 처리 방식이 달라지면 [common-loading-error.md](../features/common-loading-error.md)도 함께 확인합니다.
