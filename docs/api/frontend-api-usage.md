---
doc_type: fe_api_usage
source_of_truth: AIBE5_FinalProject_Team4_FE
api_contract_source_of_truth: AIBE5_FinalProject_Team4_BE/docs/api/api-contract.md
last_updated: 2026-06-17
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
- 개발 환경에서는 Vite proxy 또는 `VITE_API_BASE_URL` 기준으로 BE OAuth 시작 URL로 이동합니다.
- API 요청은 쿠키 기반 인증을 사용하며, 공통 API 클라이언트는 `withCredentials: true`로 쿠키를 함께 전송합니다.
- 401 응답을 받으면 `/api/v1/auth/refresh`를 한 번 호출한 뒤 기존 요청을 재시도합니다.
- FE는 access token 또는 refresh token 값을 직접 읽거나 `localStorage`에 저장하지 않습니다.
- 500 서버 내부 오류는 `/error/server`로 이동합니다.
- 502 외부 서비스 오류는 외부 서비스 오류 안내로 처리합니다.
- 네트워크 오류는 `/error/network`로 이동합니다.

## 인증 (현재 `App.tsx` + 공통 API client)

| 환경 | 로그인 시작 | 인증 유지 | `{userId}` |
| --- | --- | --- | --- |
| 개발(`DEV`) | provider 버튼 → `App.handleSocialLogin` → `redirectToOAuthLogin(provider)` → `GET {VITE_API_BASE_URL}/oauth2/authorization/{provider}` | BE가 발급한 인증 쿠키를 공통 API client가 `withCredentials`로 전송합니다. 401 응답 시 `/api/v1/auth/refresh`를 호출합니다. | `GET /api/v1/users/profile` 응답의 `userId` |
| 운영 | 동일 | 동일 | 동일 |

옷장·보유/미보유 API path의 `{userId}`는 하드코딩 `1`이 아니라 로그인 후 조회한 현재 사용자 `userId`를 사용합니다.

`GET /api/v1/auth/mock-token`은 BE local profile에서만 사용하는 수동 개발 테스트용 API입니다. FE 공식 로그인 흐름에서는 자동으로 호출하지 않으며, 실제 로그인 검증은 개발과 운영 모두 OAuth redirect와 쿠키 기반 인증 상태 확인 기준으로 진행합니다.

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

홈 추천은 라벨별로 다릅니다. OOTD(`RECO-001`), 취향 기반 추천(`RECO-002`), 유사 상품(`RECO-003`), AI MD(`RECO-006`), 어울리는 옷(`RECO-005`) 모두 실제 BE API를 호출합니다. 유사 상품(`RECO-003`)은 `src/api/similarProducts.ts`, AI MD(`RECO-006`)는 `src/api/aiMd.ts`, 나머지는 `src/api/recommendations.ts`를 통해 연동됩니다. `RECO-003`의 기준 옷은 `GET /api/v1/users/{userId}/clothes`에서 반환된 `OWNED`와 `WISHLIST` 옷을 모두 허용하며, 유사 상품 결과는 최대 50개 표시를 기준으로 합니다. `RECO-005`는 `limitPerCategory=50`을 기본값으로 사용합니다. ([implementation-gaps.md](../frontend/implementation-gaps.md), [home-recommendation.md](../features/home-recommendation.md))

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
| 약관 원문 | GET | `/api/v1/legal/terms` | 서비스 이용약관 markdown 원문 표시 |
| 약관 원문 | GET | `/api/v1/legal/privacy-policy` | 개인정보 처리방침 markdown 원문 표시 |
| 약관 원문 | GET | `/api/v1/legal/marketing-consent` | 마케팅 정보 수신 동의 markdown 원문 표시 |
| 탈퇴 계정 복구 | POST | `/api/v1/auth/restore-withdrawn` | 탈퇴 후 30일 이내 계정으로 OAuth 로그인을 시도한 경우, 사용자 확인 후 계정 복구와 인증 쿠키 발급 |
| 내 프로필 | GET | `/api/v1/users/profile` | 로그인 사용자 본인의 마이페이지 정보와 편집 초기값 표시. 온보딩 완료 전 `nickname`, `birthDate`는 비어 있을 수 있음 |
| 닉네임 중복 확인 | GET | `/api/v1/users/nickname/check` | 온보딩/마이페이지 편집에서 닉네임 규칙과 중복 여부 실시간 확인 |
| 프로필 이미지 | POST | `/api/v1/users/profile/image` | 프로필 사진 파일을 업로드하고 반환된 `imageUrl`을 프로필 저장 요청에 사용 |
| 내 프로필 | PATCH | `/api/v1/users/profile` | 닉네임, 생년월일, 사용자 성별, 지역, 프로필 이미지, 자기소개, 외부 링크 저장 |
| 온보딩 완료 | POST | `/api/v1/users/onboarding` | 가입 직후 프로필, 선호 스타일, 마케팅 정보 수신 동의 여부를 한 번에 저장 |
| 선호 스타일 | POST | `/api/v1/users/styles` | 마이페이지 편집에서 선택한 선호 스타일 저장 |
| 사용자 프로필 | GET | `/api/v1/users/profile/{userId}` | 타 사용자 프로필 또는 룩피드 프로필 표시 |
| 마케팅 동의 | GET | `/api/v1/users/{userId}/marketing-consent` | 마이페이지에서 마케팅 정보 수신 동의 상태 표시 |
| 마케팅 동의 | PATCH | `/api/v1/users/{userId}/marketing-consent` | 마이페이지에서 마케팅 정보 수신 동의/철회 반영 |
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
| 추천 | GET | `/api/v1/recommendations/{wardrobeId}?currentTemp={temp}` | 취향 기반 상품 추천 표시. FE 홈 `style` 라벨 연동 |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/similar-products` | `OWNED`/`WISHLIST` 기준 옷의 유사 상품 추천 표시. FE 홈 `similar` 라벨 연동. 결과 안내는 최대 50개 기준 |
| 추천 | GET | `/api/v1/users/{userId}/clothes/{clothesId}/recommendations?limitPerCategory={n}` | 옷장 기반 어울리는 옷 추천. FE `match` 라벨 연동. 기본 `n=50` |
| 추천 | GET | `/api/v1/ootd/{wardrobeId}?currentTemp={temp}` | OOTD 추천 표시. FE 홈 `ootd` 라벨 연동 |
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
| 코디 수정/좋아요 | PATCH | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 코디 수정 및 좋아요 토글. (title, description, situation, season 필수) |
| 코디 | DELETE | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 코디 삭제 |
| 이미지 | GET | `/api/v1/images/clothes/{userId}/{filename}` | 옷 이미지 표시 |
| 이미지 | GET | `/api/v1/images/purchase-captures/{userId}/{filename}` | 구매내역 캡처 이미지 표시 |
| 이미지 | GET | `/api/v1/images/feed/{userId}/{filename}` | 룩피드 게시물 이미지 표시 |
| 룩피드 목록 | GET | `/api/v1/feed/posts?page={p}&size={s}` | 피드 목록 페이지네이션 표시 (`FEED-002`). `FeedPage` 응답 |
| 룩피드 상세 | GET | `/api/v1/feed/posts/{postId}` | 피드 상세 모달 표시 (`FEED-003`). `FeedPost` 응답 |
| 룩피드 작성 | POST | `/api/v1/feed/posts` | 피드 게시물 생성 (`FEED-001`). `FeedCreatePayload` 요청 |
| 룩피드 수정 | PUT | `/api/v1/feed/posts/{postId}` | 내 피드 caption 수정. `{ caption }` 요청 |
| 룩피드 삭제 | DELETE | `/api/v1/feed/posts/{postId}` | 내 피드 게시물 삭제 |
| 룩피드 이미지 업로드 | POST | `/api/v1/feed/images` | 피드 이미지 업로드. `multipart/form-data`. `{ imageUrl }` 응답 |
| 좋아요 토글 | POST | `/api/v1/feed/posts/{postId}/likes` | 좋아요/취소 토글 (`FEED-004`). `FeedInteraction` 응답 |
| 저장 토글 | POST | `/api/v1/feed/posts/{postId}/saves` | 코디 저장/취소 토글 (`FEED-005`). `FeedInteraction` 응답. 연결 코디(`outfit`)가 없으면 FE에서 요청하지 않음 |
| 댓글 목록 | GET | `/api/v1/feed/posts/{postId}/comments` | 댓글 목록 표시 (`FEED-006`). `FeedComment[]` 응답 |
| 댓글 작성 | POST | `/api/v1/feed/posts/{postId}/comments` | 댓글/대댓글 작성 (`FEED-007`). `FeedCommentPayload` 요청 |
| 댓글 수정 | PUT | `/api/v1/feed/posts/{postId}/comments/{commentId}` | 내 댓글 수정 |
| 댓글 삭제 | DELETE | `/api/v1/feed/posts/{postId}/comments/{commentId}` | 내 댓글 삭제 |
| 팔로우 토글 | POST | `/api/v1/feed/users/{followeeId}/follows` | 팔로우/언팔로우 토글 (`FEED-008`). `FeedInteraction` 응답. 현재 팔로우 상태는 `FeedPost.author.followedByMe`로 초기화. BE가 해당 필드를 내려주지 않으면 버튼 미표시 |

## 룩피드 API 동기화 기준

`src/api/feed.ts`와 `src/components/feed/`, `src/components/FeedTab.tsx`에서 실제 API를 호출합니다.

| 세부기능 ID | BE API | FE 파일 | 현재 FE 상태 |
| --- | --- | --- | --- |
| `FEED-001` | `POST /api/v1/feed/posts` | `src/api/feed.ts` `createFeedPost` | 피드 게시물 작성 연동 |
| `FEED-002` | `GET /api/v1/feed/posts` | `src/api/feed.ts` `fetchFeedPosts` | 피드 목록 조회 연동. 페이지네이션 `page`/`size` 사용 |
| `FEED-003` | `GET /api/v1/feed/posts/{postId}` | `src/api/feed.ts` `fetchFeedPost` | 피드 상세 모달 연동 |
| `FEED-004` | `POST /api/v1/feed/posts/{postId}/likes` | `src/api/feed.ts` `toggleFeedLike` | 좋아요 토글 연동. `FeedInteraction.active`/`count`로 화면 상태 갱신 |
| `FEED-005` | `POST /api/v1/feed/posts/{postId}/saves` | `src/api/feed.ts` `toggleFeedSave` | 코디 저장 토글 연동. `outfit`이 없으면 FE에서 요청하지 않음 |
| `FEED-006` | `GET /api/v1/feed/posts/{postId}/comments` | `src/api/feed.ts` `fetchFeedComments` | 댓글 목록 조회 연동 |
| `FEED-007` | `POST /api/v1/feed/posts/{postId}/comments` | `src/api/feed.ts` `createFeedComment` | 댓글/대댓글 작성 연동 |
| `FEED-008` | `POST /api/v1/feed/users/{followeeId}/follows` | `src/api/feed.ts` `toggleFollow` | 팔로우 토글 연동. 초기 상태는 `FeedPost.author.followedByMe`로 설정. BE 응답에 해당 필드가 없으면 버튼 미표시 |

팔로우 버튼 초기 상태:

- `GET /api/v1/feed/posts/{postId}` 상세 응답의 `author.followedByMe`로 초기화합니다.
- `mine: true`인 게시물에는 팔로우 버튼을 표시하지 않습니다.
- `author.followedByMe`가 `undefined`(BE 미제공)이면 팔로우 버튼을 표시하지 않습니다. 팔로우 상태를 알 수 없는 상태에서 toggle을 허용하면 기존 팔로우 관계가 의도치 않게 해제될 수 있습니다.
- BE `FeedAuthorResponse`에 `followedByMe` 필드가 추가되면 버튼이 자동으로 표시됩니다.
- 팔로우 토글 성공 후 `FeedInteraction.active`를 UI 상태에 반영합니다.

`FeedAuthor.followedByMe`는 FE 타입(`src/types/feed.ts`)에 optional(`boolean | undefined`)로 선언되어 있습니다. BE `FeedAuthorResponse`에 해당 필드가 추가되면 필수(`boolean`)로 전환합니다.

## 추천 API 동기화 기준

BE 추천 API 중 현재 FE에서 실제 호출하는 API와 아직 mock/static 상태인 API를 구분합니다.

| 세부기능 ID | BE API | 현재 FE 상태 |
| --- | --- | --- |
| `RECO-001` | `GET /api/v1/ootd/{wardrobeId}?currentTemp={temp}` | `HomeTab` `ootd` 라벨 연동 |
| `RECO-002` | `GET /api/v1/recommendations/{wardrobeId}?currentTemp={temp}` | `HomeTab` `style` 라벨 연동 |
| `RECO-003` | `GET /api/v1/users/{userId}/clothes/{clothesId}/similar-products` | `HomeTab` `similar` 라벨 연동. 기준 옷은 `OWNED`와 `WISHLIST` 모두 노출, 결과 안내는 최대 50개 기준 |
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

`RECO-005` `match` 상세에서 구매 링크 클릭 후 **샀어요** 선택 시 FE는 `POST /api/users/{userId}/wishlist-clothes`(필요 시)와 `PATCH /api/v1/clothes/{id}/convert-to-owned`로 보유 옷장 등록합니다. 흐름 상세는 [home-recommendation.md](../features/home-recommendation.md)를 따릅니다.

날씨, 지역, 체감온도 정보(`EXT-004`~`EXT-006`)는 독립 추천 기능이 아니라 `RECO-001`, `RECO-002` 등 추천 기능의 보조 조건입니다. `/api/weather`는 추천 보조 정보 API로 설명합니다.

옷 대상 성별(`gender`)은 응답 또는 저장 요청 payload에 포함될 수 있지만 사용자 화면에 표시하거나 필터 UI로 노출하지 않습니다. FE는 필요 시 내부 분류/추천 제외 기준으로만 사용합니다.

옷 계절(`season`)은 `CLOTHES.season` 기준의 공통 옷 정보입니다. FE는 옷 등록 저장 요청에 `season` code를 포함할 수 있으며, 생성된 옷의 계절을 옷 수정 화면에서 변경하는 UI로 다루지 않습니다. 현재 `GET /api/v1/categories` 일반 응답은 계절 code 목록을 별도 필드로 제공하지 않으므로, 계절 code 기준은 [catalog.md](../domain/catalog.md)의 계절 섹션을 따릅니다.

## 인증 유지 API 확인 대상 (`AUTH-005`)

인증 유지 API는 `AUTH-005` 로그인 상태 유지 기준에 포함됩니다. FE는 아래 계약을 기준으로 API 클라이언트와 타입을 확인합니다.

| 기능 | Method | API 기준 | FE 확인 대상 |
| --- | --- | --- | --- |
| access token 재발급 | POST | `/api/v1/auth/refresh` | 401 처리, access token 갱신, 쿠키 전달 |
| 로그아웃 | POST | `/api/v1/auth/logout` | local token 제거, 세션 종료, 로그인 화면 이동 |
| 회원 탈퇴 | DELETE | `/api/v1/users/me` | 탈퇴 확인 후 local 사용자 상태 정리, 로그인 전 화면 이동 |

`refresh_token`은 HttpOnly 쿠키 기준이므로 FE에서 값을 직접 읽지 않습니다. 인증 유지 흐름은 공통 API client의 401 처리와 로그아웃/회원탈퇴 화면 상태 정리를 함께 확인합니다.

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
