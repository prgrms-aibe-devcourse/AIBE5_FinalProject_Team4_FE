---
doc_type: fe_implementation_gaps
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-14
---

# FE 구현 정합성 현황

이 문서는 현재 FE 코드와 `docs/` 공식 기준 사이에 남아 있는 차이를 정리합니다. 차이는 곧바로 오류라는 뜻이 아니라, 실제 구현 또는 문서 기준 확정 단계에서 맞춰야 할 기준을 명확히 하기 위한 기록입니다.

코드가 이 문서의 목표 기준과 다르게 변경되거나, 목표 기준 자체가 바뀌면 관련 기준 문서를 같은 PR에서 수정합니다.

## 기록 기준

이 문서는 아래 경우만 기록합니다.

- 기준 문서와 현재 FE 코드 구현이 서로 다르게 읽히는 경우
- 현재 FE API 호출, 응답 타입, mock 경계가 기준 문서의 기능 설명보다 좁거나 다른 경우
- FE, BE 또는 코드리뷰 담당자가 문서를 보고 현재 FE 코드를 잘못 이해할 가능성이 있는 경우
- 기준 문서가 확정 기준인지, 현재 구현 상태인지 구분이 필요한 경우
- 코드가 변경되면서 기존 gap이 해소되거나 새 gap이 생긴 경우

아직 구현되지 않은 MVP 예정 기능은 이 문서에 gap으로 기록하지 않습니다. 개발 중인 기능은 기준 문서에 명확히 정의되어 있으면 됩니다.

단, 현재 코드가 mock, static data, local state, 임시 API 경로를 사용해 사용자 기능처럼 동작하거나 공식 기준과 다른 값으로 동작한다면 이 문서에 기록합니다.

해소된 항목은 이 문서에 `해소`, `완료`, `resolved` 상태로 남기지 않고 삭제합니다. 일부만 해소된 경우에는 아직 남은 차이만 좁혀서 다시 작성합니다.

## 현재 코드와 목표 기준 요약

| 영역 | 현재 코드에 남아 있는 형태 | 목표 기준 | 관련 문서 |
| --- | --- | --- | --- |
| 인증 유지 | `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` 미사용. access token은 `localStorage.token` 중심으로 복구 | `AUTH-005` refresh token 기반 로그인 상태 유지 | [frontend-api-usage.md](../api/frontend-api-usage.md) |
| 홈 추천 API | `HomeTab`의 OOTD와 취향 기반 라벨은 static/mock. 유사 상품, 어울리는 옷, AI MD 라벨은 BE API 연동. AI MD chat은 `/api/chat-gamyagi` 직접 `fetch` | 남은 OOTD·취향 기반 추천과 AI chat을 BE API 계약 경로 및 공통 API client로 전환 | [home-recommendation.md](../features/home-recommendation.md), [mock-policy.md](mock-policy.md) |
| 추천 피드백 | 추천 저장/싫어요/추천 제외 액션이 `feedback` API와 연결되지 않음 | `RECO-013`~`RECO-014` 피드백 API 호출 | [frontend-api-usage.md](../api/frontend-api-usage.md) |
| 옷 대상 성별 UI | 사진/구매내역 등록, 옷 수정 화면에서 `gender`를 표시하고 직접 수정 | `CLOTHES.gender`는 사용자 화면 비노출, 내부 분류/추천 및 저장 요청용 code | [garment-registration.md](../features/garment-registration.md), [domain-types.md](domain-types.md) |
| 옷 계절 수정 payload/검증 주석 | 옷 수정 payload builder가 `season`을 포함할 수 있고, 일부 검증 코드 주석이 `WARDROBE_CLOTHES.season` 기준으로 남아 있음 | `CLOTHES.season`은 옷 등록 시 확정하는 공통 옷 정보이며 생성 후 변경하지 않음 | [garment-registration.md](../features/garment-registration.md), [domain-types.md](domain-types.md) |
| 옷장 통계 범위 | `ClosetTab` local count와 현재 BE `totalOwnedCount`만으로 전체 요약을 해석할 수 있음 | 옷장 전체 요약은 `OWNED`와 `WISHLIST`를 함께 고려 | [wardrobe.md](../features/wardrobe.md) |
| 공통 응답 | `src/types/index.ts`의 `ApiResponse<T>`에 `status` 필드 포함 | `success`, `data`, `message` 기준 | [domain-types.md](domain-types.md) |
| 에러 분기 | `src/api/index.ts`에서 `status >= 500`을 모두 `/error/server`로 이동 | 500 서버 내부 오류와 502 외부 서비스 오류 구분 | [frontend-api-usage.md](../api/frontend-api-usage.md), [common-loading-error.md](../features/common-loading-error.md) |
| 온보딩/스타일 | 온보딩, 프로필, 스타일 값 일부가 local state와 하드코딩 문자열 중심 | 공식 style code와 사용자 스타일 API 기준 | [catalog.md](../domain/catalog.md), [domain-types.md](domain-types.md) |
| 피드 | `feed` tab이 static feed mock 중심 | 룩피드 API와 실제 사용자 데이터 기준 | [feature-index.md](../requirements/feature-index.md), [routing.md](routing.md) |
| BE 신규 API 타입 | 일부 신규 API 응답/요청 타입이 `src/types/be.ts`에 모두 정리되어 있지 않을 수 있음 | BE develop 기준 API 계약 타입 반영 | [frontend-api-usage.md](../api/frontend-api-usage.md), [domain-types.md](domain-types.md) |
| 배포/인프라 목표 구조 | GitHub Actions는 lint/build CI를 수행하고, AWS 배포와 CD 자동화는 진행 예정. 공통 시스템 아키텍처는 목표 구조 기준 | FE/BE 배포 구현 시 시스템 아키텍처, 기술 스택, 기획서, gap 문서 동시 갱신 | [system-architecture.md](../architecture/system-architecture.md), [tech-stack.md](../architecture/tech-stack.md) |

## Feature ID 연결표

| F-ID | 화면/Route/Tab | 현재 주요 코드 | 기준 문서 | 현재 구현 상태 |
| --- | --- | --- | --- | --- |
| `AUTH-005` | 로그인 상태 유지 | `src/api/index.ts`, `App.tsx` | [frontend-api-usage.md](../api/frontend-api-usage.md) | refresh/logout API 미연동. 401 처리와 access token 재발급 흐름 확정 필요 |
| `ONBOARD-001`~`ONBOARD-010`, `STYLE-001` | 온보딩, 마이페이지 | `OnboardingPage.tsx`, `ProfileEditTab.tsx`, `App.tsx` | [feature-index.md](../requirements/feature-index.md), [catalog.md](../domain/catalog.md) | local state와 일부 하드코딩 스타일 값 사용. 공식 style code 및 사용자 스타일 API 연동 확인 필요 |
| `WARDROBE-002` | `closet` tab 요약 | `ClosetTab.tsx` | [feature-index.md](../requirements/feature-index.md), [wardrobe.md](../features/wardrobe.md) | 옷장 전체 요약 기준과 현재 BE 통계 API 범위가 다르게 읽힐 수 있음 |
| `WARDROBE-011`~`WARDROBE-030`, 옷 수정 | 옷 등록/수정 modal | `PhotoGarmentRegisterModal.tsx`, `PurchaseGarmentRegisterModal.tsx`, `GarmentEditModal.tsx` | [garment-registration.md](../features/garment-registration.md), [domain-types.md](domain-types.md) | 등록/수정 API 연동 자체가 아니라, 옷 대상 성별 UI 노출과 `season` 수정 payload/검증 주석 확인 필요 |
| `RECO-001` | `home` tab `ootd` 라벨 | `HomeTab.tsx` | [home-recommendation.md](../features/home-recommendation.md) | static/mock. BE `GET /api/v1/ootd/{wardrobeId}` 미연동 |
| `RECO-002` | `home` tab `style` 라벨 | `HomeTab.tsx` | [home-recommendation.md](../features/home-recommendation.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | static/mock. BE `GET /api/v1/recommendations/{wardrobeId}` 미연동 |
| `RECO-005` | `home` tab `match` 라벨 | `HomeTab.tsx`, `MatchRecommendationByCategory.tsx`, `src/api/recommendations.ts` | [home-recommendation.md](../features/home-recommendation.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | BE recommendations API 연동. 추천 피드백 API와 별개로 동작 |
| `RECO-013`~`RECO-014` | 추천 카드 액션 | `HomeTab.tsx`, 추천 카드 UI | [home-recommendation.md](../features/home-recommendation.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | 추천 저장/싫어요/추천 제외 피드백 API 미연동 |
| `FEED-001` | `feed` tab | `App.tsx` 내부 feed section | [feature-index.md](../requirements/feature-index.md), [routing.md](routing.md) | static feed mock |

## FE 코드와 공식 기준 확인 필요

### `AUTH-005` 로그인 상태 유지 API

BE develop 기준으로 refresh token 기반 인증 유지 API가 반영되어 있습니다. FE에서는 아직 해당 API를 사용하지 않습니다.

기준 확인 대상:

- `POST /api/v1/auth/refresh`: access token 재발급
- `POST /api/v1/auth/logout`: refresh token 삭제 및 로그아웃
- `refresh_token`: HttpOnly cookie, FE에서 직접 읽지 않음

남은 gap:

- FE API client의 401 처리와 refresh 호출 정책 확정 필요
- 기존 `localStorage.token` 저장/복구 흐름과 access token 재발급 흐름의 역할 분리 필요
- 로그아웃 시 local token 제거, 서버 logout 호출, 화면 이동 순서 확정 필요

### 홈 추천 static/mock 잔여 범위

현재 `HomeTab.tsx`는 OOTD와 취향 기반 라벨에만 static/mock 추천 데이터를 사용합니다. 유사 상품(`RECO-003`), 어울리는 옷(`RECO-005`), AI MD(`RECO-006`) 라벨은 공통 API client를 통해 BE API를 호출합니다.

남은 gap:

- `RECO-001` OOTD: BE `GET /api/v1/ootd/{wardrobeId}` 미연동
- `RECO-002` 취향 기반 상품 추천: BE `GET /api/v1/recommendations/{wardrobeId}` 미연동
- `RECO-013`~`RECO-014` 추천 피드백/제외: BE feedback API 미연동
- OOTD와 취향 기반 추천을 BE API로 전환할 때 static 데이터 제거와 계약 정합 필요

### `RECO-005` 추천 상세 — 구매 후 보유 옷장 등록

`RecommendProductDetailModal` + `useRecommendWishlistToggle.addPurchasedToCloset` 흐름:

1. 네이버쇼핑 구매 링크 새 탭 오픈
2. 확인 모달(「옷이 마음에 드셨나요?」)에서 **샀어요** / **안 샀어요**
3. **샀어요**: 필요 시 `POST /api/users/{userId}/wishlist-clothes` → `PATCH /api/clothes/{id}/convert-to-owned`
4. **안 샀어요**: 모달만 닫음

기준 문서: [home-recommendation.md](../features/home-recommendation.md) 「추천 상세 — 구매 후 보유 옷장 등록」. 이 흐름은 `RECO-013` 피드백 API와 별개이며, 추천 싫어요/제외 API 미연동 gap과는 독립입니다.

### 옷 대상 성별(`gender`) UI 노출

공식 기준에서 `CLOTHES.gender`는 사용자 화면에 표시하거나 사용자가 직접 수정하는 값이 아니라, 내부 분류/추천과 저장 요청에 사용하는 code입니다.

BE API 계약 원본(`AIBE5_FinalProject_Team4_BE/docs/api/api-contract.md`) 기준:

- `PhotoClothesSaveRequest`, `PurchaseCaptureSaveRequest`, `ClothesUpdateRequest`에 `gender` 필수
- `ClothesResponse`, draft/analyze 응답, `ClothesRecommendationResponse.RecommendedItem`에 `gender` 포함

현재 FE 코드:

- `PhotoGarmentRegisterModal`, `PurchaseGarmentRegisterModal`, `GarmentEditModal`에서 대상 성별 선택 UI를 표시하고 직접 수정할 수 있음
- `photoDraftMapper`, `purchaseCaptureDraftMapper`, `clothesMapper`는 `gender`를 저장/수정 payload와 내부 view model에 포함함

남은 gap:

- 사용자는 대상 성별을 보거나 직접 수정하지 않아야 함
- FE는 draft/analyze 응답 또는 사용자 프로필 기반 기본값을 내부 상태에 유지하고 저장 요청에 포함해야 함
- 추천 응답의 `gender`도 화면 표시가 아니라 내부 필터/제외 기준으로만 사용해야 함
- UI 노출 제거 시 [frontend-api-usage.md](../api/frontend-api-usage.md), [domain-types.md](domain-types.md), 이 문서를 함께 수정해야 함

### 옷 계절(`season`) 수정 기준

공식 기준에서 `CLOTHES.season`은 사용자별 옷장 정보가 아니라 옷 자체의 공통 정보입니다. 옷 등록 시 1개 선택해 저장하고, 생성된 옷의 계절은 옷 수정 플로우에서 변경하지 않습니다.

현재 FE 코드 확인 대상:

- `PhotoGarmentRegisterModal`
- `PurchaseGarmentRegisterModal`
- `GarmentEditModal`
- 관련 draft mapper와 clothes mapper
- `src/utils/garmentRegisterValidation.ts`

남은 gap:

- 등록 화면에서는 `season` 저장 요청을 유지해야 합니다.
- 옷 수정 화면에서는 `season`을 읽기 전용 정보로만 표시해야 하며, 수정 payload로 갱신하지 않도록 확인해야 합니다.
- `garmentRegisterValidation.ts`의 `GARMENT_SEASON_MAX_LENGTH` 주석처럼 `WARDROBE_CLOTHES.season` 기준으로 남은 코드 주석은 `CLOTHES.season` 기준으로 정리해야 합니다.
- 현재 BE `implementation-gaps.md`에도 옷 수정 요청과 일부 Swagger/OpenAPI 설명의 `season` 기준 차이가 기록되어 있으므로, FE는 BE 계약 확정 전까지 `season`을 사용자별 옷장 정보로 해석하지 않습니다.
- 계절 code 목록은 `GET /api/v1/categories` 일반 응답의 별도 필드가 아니라 [catalog.md](../domain/catalog.md)의 계절 섹션을 기준으로 사용합니다.

### `WARDROBE-002` 옷장 통계

공통 기능 정의와 FE 기준 문서에서 `WARDROBE-002`는 사용자 옷장에 등록된 보유/미보유 옷 통계 조회입니다. 옷장 전체 등록 수는 `OWNED`와 `WISHLIST`를 모두 포함해야 합니다.

현재 FE 구현은 `ClosetTab.tsx`에서 local state를 기반으로 옷장 요약을 계산합니다.

```text
src/components/ClosetTab.tsx
- ownedList = clothes.filter(c => !c.isWishlist)
- wishlistList = clothes.filter(c => c.isWishlist)
- categoriesCount는 isWishlist가 false인 항목만 집계
```

현재 확인된 BE 구현은 `/api/v1/wardrobes/users/{userId}/statistics`에서 `OWNED` 상태의 보유 옷만 계산하고, 응답도 `totalOwnedCount`, `itemTypes`, `userStylePayloads` 중심입니다.

따라서 FE가 옷장 전체 등록 수 또는 미보유 옷 수를 표시해야 하는 경우 아래 중 하나가 필요합니다.

- BE 통계 API 응답에 보유/미보유/전체 개수를 분리한 필드를 추가합니다.
- FE가 보유 옷 API와 미보유 옷 API 응답을 조합해 옷장 전체 요약을 계산합니다.

BE API 계약이 확정되면 [frontend-api-usage.md](../api/frontend-api-usage.md)와 [wardrobe.md](../features/wardrobe.md)를 같은 PR에서 수정합니다.

### mock API 경계

아래 경로는 현재 FE 코드에서 보이지만, BE API 계약 원본에는 없는 경로입니다. 실제 서비스 API 연동 완료 상태로 보지 않습니다.

| 현재 FE 경로 | 현재 용도 | 실제 기준 |
| --- | --- | --- |
| `/api/chat-gamyagi` | AI MD 채팅 mock 성격 | BE AI MD API(`/api/v1/users/{userId}/recommendations/ai-md/**`)로 대체 필요 |

### `ApiResponse<T>`와 에러 분기

공식 API 기준에서 공통 응답은 `success`, `data`, `message`를 사용합니다.

현재 FE 공통 응답 타입은 `status` 필드를 포함합니다.

```text
src/types/index.ts
- data
- message
- status
```

현재 FE 공통 API 클라이언트는 `status >= 500`을 모두 `/error/server`로 이동합니다.

```text
src/api/index.ts
- error.response.status >= 500 -> /error/server
```

BE API 계약 기준으로 `500`은 서버 내부 오류이고, `502`는 외부 API 호출 실패입니다. FE 공통 응답 타입과 에러 분기가 확정 기준에 맞게 변경되면 [frontend-api-usage.md](../api/frontend-api-usage.md), [common-loading-error.md](../features/common-loading-error.md), 이 문서를 같은 PR에서 수정합니다.

### BE 신규 API 타입 정합성

이번 문서 동기화 범위에서는 코드 파일을 수정하지 않습니다. 따라서 `src/types/be.ts`에는 BE develop 기준 API 계약에 포함된 일부 응답/요청 타입이 아직 모두 정리되어 있지 않을 수 있습니다.

확인 대상:

- `RECO-001`: `OotdResponse`
- `RECO-002`: `RecommendResponse`
- `RECO-013`~`RECO-014`: `RecommendationFeedbackRequest`, `feedbackType`
- `OUTFIT-001`~`OUTFIT-006`: outfit create/update/delete, `items[]`
- `AUTH-005`: refresh/logout 응답 및 쿠키 기반 인증 유지 흐름

위 타입은 실제 FE 연동 PR에서 API 호출부와 함께 추가하거나, 별도 타입 정리 PR에서 반영합니다. 코드 타입이 추가되면 [frontend-api-usage.md](../api/frontend-api-usage.md)와 이 문서를 함께 확인합니다.

### 공통 시스템 아키텍처 목표 구조와 현재 FE/CI 상태

[system-architecture.md](../architecture/system-architecture.md)는 현재 로컬 구현만이 아니라 MVP와 운영 배포까지 고려한 목표 시스템 구성을 설명합니다. 따라서 AWS EC2, RDS, S3, GitHub Actions 기반 배포 흐름은 목표 구조 기준으로 읽습니다.

현재 FE 레포 설정 기준으로는 아래 상태입니다.

- GitHub Actions는 lint와 build CI를 수행합니다.
- AWS 배포 또는 CD workflow는 아직 구현되지 않았습니다.
- Docker Compose는 FE 애플리케이션 실행 기준이 아니라 BE/로컬 개발 인프라 기준으로 이해합니다.
- AWS S3는 운영 기준 이미지 저장소이며, FE는 API 응답의 이미지 URL을 사용하는 쪽이 기준입니다.

자동 코드리뷰와 문서 검토 시 `system-architecture.md`만 보고 현재 FE 구현이 누락되었다고 판단하지 않고, 이 문서의 gap 항목과 BE 레포의 구현 정합성 문서를 함께 확인합니다.

FE 배포 또는 CD workflow가 구현되면 [system-architecture.md](../architecture/system-architecture.md), [tech-stack.md](../architecture/tech-stack.md), [project-plan.md](../planning/project-plan.md), 루트 [README](../../README.md), 이 문서를 같은 PR에서 함께 갱신합니다.

## 우선 정리 대상

| 우선순위 | 대상 | 이유 |
| --- | --- | --- |
| 1 | `AUTH-005` refresh/logout 연동 | 로그인 상태 유지와 세션 만료 처리에 직접 영향 |
| 2 | 옷 대상 성별(`gender`) UI 비노출 전환 | 공통 문서 기준과 현재 등록/수정 UI가 다르게 동작 |
| 3 | 옷 계절(`season`) 수정 payload/검증 주석 정리 | ERD v2.3 기준과 등록/수정 화면 payload 해석에 영향 |
| 4 | OOTD·취향 기반 추천 static/mock API 전환 | 사용자가 보는 추천 화면의 실제 데이터 연동 여부에 영향 |
| 5 | 추천 피드백 API 연동 | 저장/싫어요/추천 제외 정책과 사용자 스타일 점수에 영향 |
| 6 | `ApiResponse<T>` 타입과 500/502 에러 분기 | 모든 API parsing과 공통 error handling에 영향 |
| 7 | BE 신규 API 타입 정리 | 추천/OOTD/코디/인증 유지 API 연동 시 타입 안정성에 영향 |
| 8 | `WARDROBE-002` 옷장 통계 범위 | 옷장 전체 요약과 보유 옷 통계 해석에 영향 |
| 9 | 온보딩/스타일/피드 local·static 데이터 경계 | 실제 사용자 데이터와 mock/local 데이터 구분에 영향 |
| 10 | `/api/chat-gamyagi` mock API 경계 | AI MD 실제 API 연동 여부 판단에 영향 |
| 11 | 배포/인프라 목표 구조와 현재 FE/CI 상태 | AWS 배포 및 CD 구현 시 공통 시스템 문서와 실제 FE 레포 설정 정합성에 영향 |

## 문서 변경 기준

- 이 표에 적힌 현재 구현 차이가 실제 코드 수정으로 해소되면 이 문서도 함께 수정합니다.
- gap이 완전히 해소되면 이 문서에서 해당 항목을 삭제합니다.
- 일부만 해소되면 해소된 내용은 삭제하고 아직 남은 차이만 더 좁게 작성합니다.
- 코드 변경으로 기준 문서와 구현 차이가 새로 생기면 같은 PR에서 이 문서를 갱신합니다.
- 현재 코드를 우선 기준으로 확정하기로 결정한 경우, 코드만 유지하지 않고 관련 기준 문서도 같은 PR에서 함께 수정합니다.
- API 경로, 요청 필드, 응답 필드, 오류 처리 기준이 바뀌면 [frontend-api-usage.md](../api/frontend-api-usage.md)를 같은 PR에서 수정합니다.
- 기능 범위, 화면 흐름, 라우팅 기준이 바뀌면 [feature-index.md](../requirements/feature-index.md), 관련 기능 문서, [routing.md](routing.md)를 함께 확인합니다.
- 도메인 규칙, enum, catalog code, FE 타입 기준이 바뀌면 [glossary.md](../domain/glossary.md), [catalog.md](../domain/catalog.md), [invariants.md](../domain/invariants.md), [domain-types.md](domain-types.md)를 함께 확인합니다.
- mock 데이터, fallback, 임시 API 경계가 바뀌면 [mock-policy.md](mock-policy.md)를 같은 PR에서 수정합니다.
- 시스템 구성, 기술 스택, 화면 구조, 주요 기능 흐름이 바뀌면 [system-architecture.md](../architecture/system-architecture.md), [information-architecture.md](../architecture/information-architecture.md), [sequence-diagrams.md](../architecture/sequence-diagrams.md), [tech-stack.md](../architecture/tech-stack.md)를 함께 확인합니다.
- 공통 문서가 변경되면 BE 레포 원본 문서와 FE 레포의 동일 기준 문서를 함께 확인합니다.
