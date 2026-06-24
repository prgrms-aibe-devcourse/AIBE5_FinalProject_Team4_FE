---
doc_type: fe_feature_home_recommendation
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-25
---

# 홈 추천 화면 기준

이 문서는 홈 추천 화면과 홈 추천 결과에서 이어지는 사용자 행동 기준을 정리합니다.

관련 공통 문서:

- [feature-index.md](../requirements/feature-index.md)
- [recommendation-policy.md](recommendation-policy.md)
- [catalog.md](../domain/catalog.md)
- [frontend-api-usage.md](../api/frontend-api-usage.md)

## 목적

홈 화면은 옷장난감의 추천 중심 화면입니다. 사용자는 자신의 옷장과 스타일 성향을 기준으로 상품이나 코디 후보를 확인하고, 관심 상품을 미보유 옷으로 저장하거나 비선호 피드백을 남길 수 있어야 합니다.

## 추천 기능 범위

| 세부기능 ID | 기능 | 홈 추천 흐름 기준 |
| --- | --- | --- |
| `HOME-001` | 추천 목록 노출 | 홈을 추천 중심 화면으로 사용하고 로그인/옷장 데이터 상태에 따라 화면 상태를 반영합니다. |
| `HOME-002` | 라벨 선택 | 상단 라벨로 추천 유형을 전환하고 현재 선택한 추천 유형을 표시합니다. |
| `RECO-001` | OOTD 코디 | 날씨와 계절 보조 조건을 반영한 코디 추천 결과를 표시합니다. |
| `RECO-002` | 취향 분석/스타일 기반 추천 | 사용자 스타일 점수와 추천 보조 정보를 기반으로 상품 추천 결과를 표시합니다. |
| `RECO-003` | 유사 상품 추천 | 선택한 옷과 유사한 상품 추천 결과를 표시합니다. |
| `RECO-004` | 어울리는 옷 추천 | 옷장에 등록한 옷(`OWNED`/`WISHLIST`)과 어울리는 상품 추천 결과를 표시합니다. |
| `RECO-005` | AI MD 추천 | AI MD가 제안하는 추천 이유와 스타일링 설명을 표시합니다. |
| `RECO-012`~`RECO-013` | 추천 피드백/제외 | 추천 결과에 대한 저장, 싫어요, 추천 제외 액션으로 사용합니다. |
| `EXT-003`~`EXT-004` | 날씨 보조 정보 | 독립 추천 기능이 아니라 OOTD, 취향 기반 추천의 보조 조건으로 사용합니다. |

## 화면 구성

홈 추천 흐름은 아래 정보를 표시하거나 행동으로 제공합니다.

- 추천 목록 또는 추천 영역
- 추천 상품 또는 코디 목록
- 추천 이유
- 상품 이미지
- 상품명, 브랜드명(`brandName`), 카테고리, 타입, 계절 code, 색상, 스타일
- 외부 구매 링크(`externalProductUrl`) 또는 대체 구매 검색 링크
- 추천 상품 또는 코디 상세 진입 액션
- 미보유 옷 저장 액션 (위시리스트 토글)
- 구매 링크 이동 후 보유 옷장 등록 확인 액션 (`match` 상세)
- 싫어요 또는 추천 제외 액션

## API 반영 기준

- API 응답이 있는 경우 추천 목록은 API 응답을 우선 표시합니다.
- API 실패 시 fallback 데이터는 가능하지만 실패 상태를 숨기지 않습니다.
- 같은 점수 그룹 안에서 추천 순서가 랜덤하게 바뀌는 것은 오류로 보지 않습니다.
- 추천 제외된 상품은 해당 사용자 추천 후보에서 다시 노출되지 않는 것을 기준으로 합니다.
- 실제 추천 API는 [frontend-api-usage.md](../api/frontend-api-usage.md)에 정리된 BE API 계약 기준 경로를 사용합니다.
- BE API 계약에 없는 임시 추천 경로는 실제 추천 연동 완료 상태로 보지 않습니다.
- 추천 상품 카드에서 `brandName`, `season`, `externalProductUrl`을 사용하는 경우 BE 응답 필드명을 그대로 기준으로 삼습니다.
- `season`은 `CLOTHES.season` code이며 사용자별 옷장 정보로 해석하지 않습니다.
- 옷 대상 성별(`gender`)은 추천 카드의 일반 표시명이나 필터 UI로 노출하지 않으며, 내부 분류/추천 제외 기준으로만 사용합니다.

## 유사 상품 추천 (`similar`, `RECO-003`)

현재 FE는 `HomeTab` `similar` 라벨에서 아래 흐름을 사용합니다.

- 기준 옷: 사용자 옷장에 등록된 `OWNED`, `WISHLIST` 항목
- 기준 옷 선택: 전체/보유/위시리스트 필터로 구분 표시
- API: `GET /api/v1/users/{userId}/clothes/{clothesId}/similar-products`
- FE 요청: 별도 `limit` query parameter 없이 BE 유사상품 기본 계약을 사용
- UI 결과 안내: 최대 50개 결과
- 카드 액션: 상세 모달, 외부 구매 페이지, 미보유 옷 저장

FE의 `similar` 탭은 유사상품 결과를 최대 50개까지 표시하는 것을 기준으로 합니다. 기준 옷 후보는 `GET /api/v1/users/{userId}/clothes` 응답에서 `OWNED`와 `WISHLIST`를 모두 포함하되, 사용자가 선택 모달에서 상태별로 나눠 볼 수 있어야 합니다.

유사 상품 저장은 `candidateSource` 기준으로 분기합니다.

- `candidateSource="INTERNAL"`이고 `clothesId`가 있으면 신규 생성하지 않고 `POST /api/users/{userId}/wishlist-clothes/{clothesId}`로 기존 `EXTERNAL_SHOPPING` 공용 옷을 사용자 미보유 옷에 연결합니다.
- `candidateSource="NAVER"`인 후보는 저장 전 상품 정보 확인 모달에서 필수 분류값을 확보한 뒤 `POST /api/users/{userId}/wishlist-clothes`로 신규 미보유 옷을 생성합니다.
- 추천 피드백은 `candidateSource="INTERNAL"`처럼 `clothesId`가 있는 후보에만 보냅니다.

## 어울리는 옷 추천 (`match`, `RECO-004`)

현재 FE는 `HomeTab` `match` 라벨에서 아래 흐름을 사용합니다.

- 기준 옷: 사용자 옷장에 등록된 `OWNED`, `WISHLIST` 항목 중 BE `clothesId`가 있는 항목
- 기준 옷 선택: 전체/보유/위시리스트 + 전체/상의/하의/아우터/신발 필터로 구분 표시 (`HomeTab` 기준 옷 선택 모달)
- API: `GET /api/v1/users/{userId}/clothes/{clothesId}/recommendations?limitPerCategory={n}`
- FE 기본 요청: `limitPerCategory=50` (`src/api/recommendations.ts`, BE 허용 범위 `1`~`50`, BE 기본값 `5`)
- UI: 카테고리(상의/하의/아우터/신발)별 섹션, 접기/더보기 그리드
- 카드 액션: 상세 모달, 위시리스트 토글(`POST /api/users/{userId}/wishlist-clothes/{clothesId}`)

FE의 `match` 탭은 `RECO-003`(`similar`)과 동일하게 기준 옷 후보에 `OWNED`와 `WISHLIST`를 모두 포함합니다. 사용자는 선택 모달에서 보유/위시리스트를 필터로 나눠 볼 수 있으며, 선택한 `clothesId`를 그대로 recommendations API에 전달합니다.

BE 계약: path `clothesId`는 해당 사용자의 활성 옷장 항목이며 `WARDROBE_CLOTHES.ownership_status`가 `OWNED` 또는 `WISHLIST`이어야 합니다. ([api-contract-reco004-anchor.md](../api/api-contract-reco004-anchor.md))

### 어울리는 옷 추천 요청 수 (`limitPerCategory`)

FE는 카테고리당 최대 50건을 요청합니다. BE API 계약도 `limitPerCategory` 허용 범위를 `1`~`50`으로 봅니다.

| 항목 | BE | FE |
| --- | --- | --- |
| query `limitPerCategory` | 기본 `5`, 허용 `1`~`50` | 기본 요청 `50` (명시 전달) |
| 화면 표시 | — | 카테고리별 접기/더보기 그리드로 추가 후보 확인 |

## 추천 상세 — 구매 후 보유 옷장 등록 (`match`)

`RecommendProductDetailModal`에서 네이버쇼핑 구매 링크 클릭 시 FE 전용 확인 흐름을 사용합니다.

1. `externalProductUrl` 또는 상품명 기반 구매 URL을 새 탭으로 연다.
2. 확인 모달: 제목 「옷이 마음에 드셨나요?」, 본문 「구매하셨다면 옷장에 추가해 드리겠습니다」
3. **샀어요** 선택 시 보유 옷장(`OWNED`) 등록을 시도한다.
4. **안 샀어요** 선택 시 모달만 닫는다.

**샀어요** BE 호출 순서:

1. 위시리스트에 없으면 `POST /api/users/{userId}/wishlist-clothes/{clothesId}` 로 기존 `EXTERNAL_SHOPPING` 마스터 연결
2. `PATCH /api/v1/clothes/{clothesId}/convert-to-owned` 로 `WISHLIST` → `OWNED` 전환

이미 보유 옷장에 있으면 API 호출 없이 안내 토스트만 표시합니다. 성공 시 옷장 목록 refresh 콜백(`onRefreshWardrobe`)을 호출합니다.

관련 코드:

- `src/components/RecommendProductDetailModal.tsx`
- `src/hooks/useRecommendWishlistToggle.ts` (`addPurchasedToCloset`)
- `src/utils/recommendWishlistPayload.ts`

## 미보유 옷 저장

추천 상품 저장은 좋아요가 아니라 미보유 옷 저장 흐름입니다.

기준:

- 저장 대상은 `WISHLIST` 상태로 사용자 옷장에 연결됩니다.
- 추천 응답의 `brandName`, `season`, `externalProductUrl`은 미보유 저장 payload 구성에 사용할 수 있습니다.
- 유사 상품 및 AI MD 상품 추천은 `candidateSource` 기준으로 저장 방식을 나눕니다. `INTERNAL` 후보는 `POST /api/users/{userId}/wishlist-clothes/{clothesId}` 연결 API를 사용하고, `NAVER` 후보만 `POST /api/users/{userId}/wishlist-clothes` 신규 생성 플로우를 사용합니다.
- 저장 완료 후 사용자는 옷장 미보유 탭에서 확인할 수 있어야 합니다.
- 이미 저장된 상품이면 중복 저장을 막거나 저장됨 상태를 표시합니다.

## 로딩, 에러, 빈 상태

| 상태 | 화면 기준 |
| --- | --- |
| loading | 추천 목록 skeleton/spinner 표시 |
| empty | 추천 가능한 상품이 없음을 안내하고 옷 등록 또는 스타일 설정 행동 제공 |
| error | API 실패 메시지 또는 재시도 행동 제공 |

## mock 사용 기준

- 추천 목록과 카드 레이아웃 확인용 mock은 허용합니다.
- 실제 API가 연결된 추천 영역은 API 응답을 우선 사용합니다.
- mock 추천 상품을 실제 저장 완료처럼 처리하지 않습니다.

## 구현 기준

- 홈 추천 결과 선택은 상품 상세 또는 코디 상세 진입으로 이어집니다.
- API 응답을 받은 추천 영역은 정적 mock보다 API 데이터를 우선 표시합니다.
- 미보유 옷 저장 액션은 옷장 미보유 상태와 연결합니다.
- `match` 상세의 **샀어요** 액션은 위시리스트 생성(필요 시) 후 보유 옷장 전환 API와 연결합니다.
- 추천 제외와 싫어요는 서버 상태 또는 피드백 정책과 연결합니다.
- 추천 목록은 loading, success, empty, error 상태를 구분합니다.
- 추천 목록, 상세 진입, 저장 액션, 피드백 정책, API 연동 기준이 바뀌면 이 문서를 같은 PR에서 수정합니다.
