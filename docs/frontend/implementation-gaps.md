---
doc_type: fe_implementation_gaps
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-03
---

# FE 구현 정합성 현황

이 문서는 현재 FE 코드와 `docs/` 공식 기준 사이의 차이를 정리합니다. 차이는 곧바로 오류라는 뜻이 아니라, 실제 구현 또는 문서 기준 확정 단계에서 맞춰야 할 기준을 명확히 하기 위한 기록입니다.

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

## 현재 코드와 목표 기준 요약

| 영역 | 현재 코드에 남아 있는 형태 | 목표 기준 | 관련 문서 |
| --- | --- | --- | --- |
| API 경로 | `/api/recommend`, `/api/chat-gamyagi`, `/api/analyze-garment` 직접 `fetch` | BE API 계약 경로와 공통 API client 사용 | [frontend-api-usage.md](../api/frontend-api-usage.md) |
| 사용자 ID | `/users/1`, `wardrobes/users/1` 예시 또는 하드코딩 | 인증 사용자 ID 사용 | [frontend-api-usage.md](../api/frontend-api-usage.md) |
| 공통 응답 | `ApiResponse<T>`에 `status` 필드 포함 | `success`, `data`, `message` 기준 | [domain-types.md](domain-types.md) |
| 에러 분기 | `src/api/index.ts`에서 `status >= 500`을 모두 `/error/server`로 이동 | 500 서버 내부 오류와 502 외부 서비스 오류를 구분 | [frontend-api-usage.md](../api/frontend-api-usage.md) |
| 옷장 통계 범위 | local count 또는 현재 BE `totalOwnedCount`만 사용 가능 | 옷장 전체 요약은 `OWNED`와 `WISHLIST`를 함께 고려 | [wardrobe.md](../features/wardrobe.md) |
| 카테고리 | `Top`, `Bottom`, `Outer`, `Shoes` | `TOP`, `BOTTOM`, `OUTER`, `SHOES` | [domain-types.md](domain-types.md) |
| 보유 상태 | `isWishlist` boolean | `ownershipStatus: OWNED/WISHLIST` | [wardrobe.md](../features/wardrobe.md) |
| 스타일 | `Amekaji`, `Dandy`, `Tech Casual` 등 | BE catalog의 `StyleCode` | [catalog.md](../domain/catalog.md) |
| mock 데이터 | static list, fallback recommendation | 실제 API 응답 우선, mock 경계 표시 | [mock-policy.md](mock-policy.md) |

## Feature ID 연결표

| F-ID | 화면/Route/Tab | 현재 주요 컴포넌트 | 기준 문서 | 현재 구현 상태 |
| --- | --- | --- | --- | --- |
| `AUTH-001` | `/`, 로그인 화면 | `App.tsx`, `LoginPage.tsx` 예정 | [frontend-api-usage.md](../api/frontend-api-usage.md), [routing.md](routing.md) | 현재는 버튼 클릭 시 local state 로그인 처리 |
| `USER-001` | `/onboarding` | `OnboardingPage.tsx`, `App.tsx` 내부 온보딩 | [feature-index.md](../requirements/feature-index.md), [routing.md](routing.md) | local state 기반 입력 |
| `STYLE-001` | 온보딩, 마이페이지 | `OnboardingPage.tsx`, `ProfileEditTab.tsx` | [catalog.md](../domain/catalog.md), [domain-types.md](domain-types.md) | 일부 하드코딩 스타일 사용 |
| `WARD-001` | `closet` tab | `ClosetTab.tsx` | [frontend-api-usage.md](../api/frontend-api-usage.md), [wardrobe.md](../features/wardrobe.md) | local clothes state 기반 |
| `WARD-002` | `closet` tab 요약 | `ClosetTab.tsx` | [feature-index.md](../requirements/feature-index.md), [wardrobe.md](../features/wardrobe.md) | 현재는 local count 계산. BE 통계 API는 보유 옷 기반이며, 옷장 전체 요약은 미보유 API와 조합 또는 BE 계약 확정 필요 |
| `CLOTH-002` | `closet` tab 보유 목록 | `ClosetTab.tsx` | [frontend-api-usage.md](../api/frontend-api-usage.md), [wardrobe.md](../features/wardrobe.md) | local `isWishlist=false` 기준 |
| `CLOTH-006` | `closet` tab 미보유 목록 | `ClosetTab.tsx` | [frontend-api-usage.md](../api/frontend-api-usage.md), [wardrobe.md](../features/wardrobe.md) | local `isWishlist=true` 기준 |
| `CLOTH-007` | 옷 상세/옷장 전환 | `ClosetTab.tsx` | [frontend-api-usage.md](../api/frontend-api-usage.md), [wardrobe.md](../features/wardrobe.md) | local state에서 `isWishlist=false`로 변경 |
| `REG-001` | 옷 등록 modal | `App.tsx`, `AiAnalyzing.tsx` | [garment-registration.md](../features/garment-registration.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | `/api/analyze-garment` mock 성격 경로 사용 |
| `REG-002` | 구매내역 등록 modal | `App.tsx` | [garment-registration.md](../features/garment-registration.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | `/api/analyze-garment` mock 성격 경로 사용 |
| `RECO-001` | `home` tab | `HomeTab.tsx` | [home-recommendation.md](../features/home-recommendation.md), [recommendation-policy.md](../features/recommendation-policy.md) | static recommendation 중심 |
| `RECO-003` | `home` tab, 옷 상세 | `HomeTab.tsx` | [home-recommendation.md](../features/home-recommendation.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | static/mock 추천 |
| `RECO-004` | `home` tab, 옷 상세 | `HomeTab.tsx` | [home-recommendation.md](../features/home-recommendation.md), [frontend-api-usage.md](../api/frontend-api-usage.md) | static/mock 추천 |
| `FEED-001` | `feed` tab | `App.tsx` 내부 feed section | [feature-index.md](../requirements/feature-index.md), [routing.md](routing.md) | static feed mock |

## FE 코드와 공식 기준 확인 필요

### `WARD-002` 옷장 통계

공통 기능 정의와 FE 기준 문서에서 `WARD-002`는 사용자 옷장에 등록된 보유/미보유 옷 통계 조회입니다. 옷장 전체 등록 수는 `OWNED`와 `WISHLIST`를 모두 포함해야 합니다.

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

### API 경로와 mock 경계

아래 경로는 현재 FE 코드에서 보일 수 있지만, BE API 계약 원본에는 없는 경로입니다. 실제 서비스 API 연동 완료 상태로 보지 않습니다.

| 현재 FE 경로 | 현재 용도 | 실제 기준 |
| --- | --- | --- |
| `/api/recommend` | Gemini 또는 추천 mock 호출 성격 | `similar-products`, `recommendations`, 추천 정책 기준 API로 대체 |
| `/api/chat-gamyagi` | AI MD 채팅 mock 성격 | AI MD 기능 API가 확정되면 BE 계약 문서에 추가 후 사용 |
| `/api/analyze-garment` | 사진/구매내역 분석 mock 성격 | photo 또는 purchase-capture analyze API 사용 |

실제 API 연동 코드에서 위 경로가 계속 사용된다면 [frontend-api-usage.md](../api/frontend-api-usage.md)의 API 코드 정합성 기준을 충족하지 않습니다.

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

### 도메인 code와 보유 상태

공식 기준에서 카테고리, 스타일, 보유/미보유 상태는 BE catalog와 enum 값을 사용합니다.

현재 FE 코드에는 아래 값이 남아 있습니다.

```text
src/types.ts
- category: Top | Bottom | Outer | Shoes
- isWishlist: boolean

src/components/HomeTab.tsx
- RecommendationLabel: ootd | style | similar | match | aimd

src/components/ClosetTab.tsx
- closetTab: owned | wishlist
- filter category: All, Top, Bottom, Outer, Shoes
```

실제 API 연동 기준에서는 `TOP`, `BOTTOM`, `OUTER`, `SHOES`, `OWNED`, `WISHLIST` 등 공식 code를 기준으로 요청/응답을 처리합니다. FE view model 또는 UI label이 필요하면 API code와 분리해 관리합니다.

## 우선 정리 대상

| 우선순위 | 대상 | 이유 |
| --- | --- | --- |
| 1 | `userId` 하드코딩 제거 | 인증 사용자 기준과 소유권 검증 기준에 직접 영향 |
| 2 | `ApiResponse<T>` 타입 정정 | 모든 API parsing과 error handling에 영향 |
| 3 | mock API 경로와 BE API 경로 분리 | 실제 연동 여부 판단에 영향 |
| 4 | 500/502 에러 분기 구분 | BE API 오류 계약과 FE 공통 에러 처리에 영향 |
| 5 | category/style code 정규화 | 카탈로그 validation과 필터/등록 기능에 영향 |
| 6 | `isWishlist`에서 `ownershipStatus` 기준으로 전환 | 옷장 보유/미보유 도메인 의미에 영향 |

## 문서 변경 기준

- 이 표에 적힌 현재 구현 차이가 실제 코드 수정으로 해소되면 이 문서도 함께 수정합니다.
- 코드 변경으로 기준 문서와 구현 차이가 새로 생기면 같은 PR에서 이 문서를 갱신합니다.
- 현재 코드를 우선 기준으로 확정하기로 결정한 경우, 코드만 유지하지 않고 관련 기준 문서도 같은 PR에서 함께 수정합니다.
- API 경로, 요청 필드, 응답 필드, 오류 처리 기준이 바뀌면 [frontend-api-usage.md](../api/frontend-api-usage.md)를 같은 PR에서 수정합니다.
- 기능 범위, 화면 흐름, 라우팅 기준이 바뀌면 [feature-index.md](../requirements/feature-index.md), 관련 기능 문서, [routing.md](routing.md)를 함께 확인합니다.
- 도메인 규칙, enum, catalog code, FE 타입 기준이 바뀌면 [glossary.md](../domain/glossary.md), [catalog.md](../domain/catalog.md), [invariants.md](../domain/invariants.md), [domain-types.md](domain-types.md)를 함께 확인합니다.
- mock 데이터, fallback, 임시 API 경계가 바뀌면 [mock-policy.md](mock-policy.md)를 같은 PR에서 수정합니다.
- 공통 문서가 변경되면 BE 레포 원본 문서와 FE 레포의 동일본을 함께 확인합니다.
