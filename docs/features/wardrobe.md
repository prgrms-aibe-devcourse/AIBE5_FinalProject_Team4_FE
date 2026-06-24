---
doc_type: fe_feature_wardrobe
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-25
---

# 옷장 화면 기준

이 문서는 사용자 옷장 화면에서 보유 옷과 미보유 옷을 조회하고 관리하는 기준을 정리합니다.

관련 공통 문서:

- [feature-index.md](../requirements/feature-index.md)
- [requirements-definition.md](../requirements/requirements-definition.md)
- [glossary.md](../domain/glossary.md)
- [invariants.md](../domain/invariants.md)
- [catalog.md](../domain/catalog.md)
- [frontend-api-usage.md](../api/frontend-api-usage.md)

## 목적

옷장 화면은 사용자가 실제 보유한 옷과 아직 보유하지 않은 관심/추천 옷을 함께 관리하는 화면입니다.

## 핵심 개념

| 개념 | FE 표시 기준 |
| --- | --- |
| `OWNED` | 보유 옷 |
| `WISHLIST` | 위시리스트, 관심 상품 |
| `WARDROBE_CLOTHES` | 사용자 옷장에 연결된 옷 정보 |
| `CLOTHES` | 옷 자체의 공통 정보 |

보유/위시리스트 상태는 `CLOTHES`가 아니라 `WARDROBE_CLOTHES.ownership_status` 기준으로 판단합니다.

## 화면 구성

옷장 화면은 아래 정보를 표시합니다.

- 보유 옷
- 미보유 옷
- 카테고리/타입/색상/스타일 필터
- 옷 목록
- 옷 상세 정보
- 즐겨찾기 상태
- 미보유에서 보유 전환 액션
- 삭제 (옷장 연결 해제) 액션

## API 기준

| 세부기능 ID | 기능 | API 기준 |
| --- | --- | --- |
| `WARDROBE-001` | 사용자별 단일 옷장 | `GET /api/v1/wardrobes/users/{userId}` |
| `WARDROBE-002` | 옷장 통계 | `GET /api/v1/wardrobes/users/{userId}/statistics` |
| `WARDROBE-003`~`WARDROBE-008` | 보유 옷 조회/상세/수정/삭제/즐겨찾기 | `GET /api/v1/users/{userId}/clothes`, `GET /api/v1/clothes/{clothesId}`, `PATCH /api/v1/clothes/{clothesId}`, `DELETE /api/v1/clothes/{clothesId}` |
| `WARDROBE-009` | 미보유 옷 조회 | `GET /api/users/{userId}/wishlist-clothes` |
| `WARDROBE-010` | 미보유에서 보유 전환 | `PATCH /api/v1/clothes/{clothesId}/convert-to-owned` |

## 옷장 통계 기준

`WARDROBE-002`는 공통 기능 정의상 사용자 옷장에 등록된 보유/미보유 옷 통계 조회입니다.

| 통계 기준 | 포함 범위 |
| --- | --- |
| 옷장 전체 등록 수 | `OWNED`, `WISHLIST` 모두 포함 |
| 보유 옷 수 | `OWNED` |
| 미보유 옷 수 | `WISHLIST` |

옷장 전체 요약에서 전체 등록 수를 다룰 때는 `OWNED`와 `WISHLIST`를 모두 고려합니다. 보유 옷 전용 수치를 옷장 전체 수로 사용하지 않습니다.

통계 범위, API 응답 필드, 화면 표시 기준이 바뀌면 [feature-index.md](../requirements/feature-index.md), [frontend-api-usage.md](../api/frontend-api-usage.md), 이 문서를 같은 PR에서 수정합니다.

## 미보유에서 보유 전환

기준:

- `WISHLIST` 상태인 옷만 `OWNED`로 전환할 수 있습니다.
- 전환 후 보유 옷 목록에 표시되어야 합니다.
- 전환 후 미보유 목록에서는 제거되거나 상태 변경이 반영되어야 합니다.
- 같은 옷의 공통 정보는 중복 생성하지 않습니다.

## 필터와 카탈로그

카테고리, 아이템 타입, 색상, 스타일은 [catalog.md](../domain/catalog.md)의 code 값을 기준으로 합니다.

FE 표시 문구는 별도 매핑을 둘 수 있지만, API 요청/응답 값은 문서의 code를 따릅니다.

## 로딩, 에러, 빈 상태

| 상태 | 화면 기준 |
| --- | --- |
| loading | 옷장 요약과 목록 영역에 skeleton/spinner 표시 |
| empty | 현재 탭/필터 범위에 표시할 옷이 없을 때 `옷이 없습니다.` 문구와 옷 등록 진입 행동 제공 |
| error | 목록 조회 실패 메시지 또는 재시도 행동 제공 |

## mock 사용 기준

- 초기 데모용 옷 목록 mock은 허용합니다.
- API가 연결된 뒤에는 `ownershipStatus` 기준으로 보유/미보유를 구분합니다.
- mock 전환 버튼이 실제 전환 완료처럼 보이지 않도록 합니다.
- 실제 API 연동 코드에서 `isWishlist` 같은 FE 임의 boolean만으로 보유/미보유 저장 기준을 대체하지 않습니다.

## 구현 기준

- 보유/미보유 상태는 `ownershipStatus` 기준으로 분리합니다.
- 미보유에서 보유 전환은 서버 상태 전환 API와 연결합니다.
- 공통 옷 정보와 사용자 옷장 정보를 UI에서 혼동하지 않도록 표시합니다.
- API 요청에는 카탈로그 code 기준과 다른 임의 문자열을 보내지 않습니다.
- 빈 상태와 오류 상태에서는 사용자가 취할 다음 행동을 제공합니다.
- 옷장 탭, 보유/미보유 상태 기준, 전환 흐름, API 연동 기준이 바뀌면 이 문서를 같은 PR에서 수정합니다.
