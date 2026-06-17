---
doc_type: fe_feature_outfit_book
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-14
---

# 코디북

이 문서는 FE 코디북 화면의 기능 범위, API 사용 기준, 현재 구현 확인 대상을 정리합니다.

## 기준 문서

- 기능 요구사항: [요구사항 정의서](../requirements/requirements-definition.md)
- 기능 ID 연결: [기능 인덱스](../requirements/feature-index.md)
- API 사용 기준: [API 사용 기준](../api/frontend-api-usage.md)
- 현재 구현 차이: [FE 구현 정합성 현황](../frontend/implementation-gaps.md)

## 기능 범위

| 세부기능 ID | 기능 | FE 처리 기준 |
| --- | --- | --- |
| `OUTFITBOOK-001` | 단일 코디북 | 사용자별 하나의 코디북을 기준으로 화면을 구성합니다. |
| `OUTFITBOOK-002` | 코디북 조회 | 저장된 코디 목록을 조회하고 목록 화면에 표시합니다. |
| `OUTFITBOOK-003` | 코디북 상세 | 저장된 코디의 스타일 상세 정보와 구성 옷을 확인합니다. |
| `OUTFIT-001`~`OUTFIT-006` | 코디 저장/조회/수정/삭제 | 추천받거나 직접 구성한 코디를 저장, 조회, 수정, 삭제합니다. |
| `OUTFIT-007` | 코디 즐겨찾기 | 저장된 코디의 즐겨찾기(좋아요) 상태를 변경하고 즐겨찾기 탭에서 모아봅니다. |

## API 기준

| 기능 | Method | API 기준 | FE 사용 기준 |
| --- | --- | --- | --- |
| 코디북 목록 | GET | `/api/v1/outfit-books` | 사용자 코디북 목록 또는 단일 코디북 표시 |
| 코디북 생성 | POST | `/api/v1/outfit-books` | 사용자 코디북 생성 |
| 코디북 상세 | GET | `/api/v1/outfit-books/{bookId}` | 코디북 상세와 저장 코디 목록 표시 |
| 코디 저장 | POST | `/api/v1/outfit-books/{bookId}/outfits` | 코디북에 코디 저장 (favorite 포함 가능) |
| 코디 상세 | GET | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 저장 코디 구성 옷과 스타일 상세 표시 |
| 코디 수정/좋아요 | PATCH | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 저장 코디 수정 및 좋아요 상태 토글. **주의: title, description, situation, season 필수 포함** |
| 코디 삭제 | DELETE | `/api/v1/outfit-books/{bookId}/outfits/{outfitId}` | 코디북에서 코디 제거 |

`OutfitResponse.items[]`는 저장 코디를 구성하는 옷 목록을 표시하는 기준 필드입니다. 상세 필드 원본은 BE API 계약을 따릅니다.

## 화면 상태 기준

- 코디북 목록 또는 상세 조회 중에는 loading 상태를 표시합니다.
- 저장된 코디가 없으면 empty 상태와 다음 행동을 표시합니다.
- 코디 저장/수정/삭제 실패 시 기존 목록 상태를 유지하고 오류 메시지를 표시합니다.
- 코디 삭제는 사용자 코디북 연결 제거 기준이며, 공통 코디 정보 삭제로 해석하지 않습니다.
- 즐겨찾기 탭(OUTFITBOOK-TAB-FAVORITE)은 전체 코디 중 `favorite: true`인 항목만 필터링하여 표시합니다.

## 현재 구현 확인 대상

FE 코드에 코디북 화면 또는 코디 상세 화면이 추가되면 아래를 함께 확인합니다.

- 코디북 목록, 코디 상세, 수정, 삭제 API가 [API 사용 기준](../api/frontend-api-usage.md)과 맞는지 확인합니다.
- 추천 상세 또는 AI MD 추천에서 저장한 코디가 코디북 화면에 도달 가능한지 확인합니다.
- 코디 상세 응답의 `items[]`를 FE view model로 변환하는 기준을 [FE 도메인 타입 기준](../frontend/domain-types.md)에 반영합니다.
- 구현과 기준 문서가 다르면 [FE 구현 정합성 현황](../frontend/implementation-gaps.md)을 수정합니다.

## 변경 기준

- 코디북 API 경로, 응답 필드, 화면 도달 경로가 바뀌면 이 문서를 수정합니다.
- 추천 상세 또는 AI MD 추천의 코디 저장 흐름이 바뀌면 [홈 추천 화면](./home-recommendation.md)과 함께 확인합니다.
