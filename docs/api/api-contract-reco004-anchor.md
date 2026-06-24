---
doc_type: fe_api_contract_delta
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-25
sync_target: AIBE5_FinalProject_Team4_BE/docs/api/api-contract.md
---

# RECO-004 기준 옷(`clothesId`) 계약 — FE 기준

이 문서는 `GET /api/v1/users/{userId}/clothes/{clothesId}/recommendations`의 **기준 옷** 정책을 FE 구현과 맞추기 위한 계약 보충입니다. BE 원본 [api-contract.md](https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_BE/blob/develop/docs/api/api-contract.md)의 「옷장 기반 어울리는 옷 추천」 절과 동기화 대상입니다.

## 정책 요약

| 항목 | FE / BE 공통 기준 |
| --- | --- |
| path `userId` | JWT 사용자와 일치 |
| path `clothesId` | 해당 사용자의 **활성 옷장 항목** |
| 허용 `ownership_status` | `OWNED`, `WISHLIST` 모두 허용 |
| FE 기준 옷 후보 | `GET /api/v1/users/{userId}/clothes` + `GET /api/users/{userId}/wishlist-clothes`를 합친 옷장 목록 |
| FE 선택 UI | 전체 / 보유 / 위시리스트 + 카테고리 필터 (`HomeTab` 기준 옷 선택 모달) |
| query `limitPerCategory` | 기본 `5`, 허용 `1`~`50`. FE는 `50`을 명시 전달 |

`RECO-003` 유사 상품(`GET .../similar-products`)과 **동일한 기준 옷 범위**를 사용합니다.

## BE 계약 문구 (동기화 목표)

「옷장 기반 어울리는 옷 추천 (`GET .../recommendations`)」 절은 아래와 같이 정의합니다.

> JWT 사용자와 path의 `userId`가 일치해야 합니다. `clothesId`는 해당 사용자의 활성 옷장 항목이어야 하며, `WARDROBE_CLOTHES.ownership_status`가 `OWNED` 또는 `WISHLIST`인 옷을 모두 기준 옷으로 사용할 수 있습니다.

intro 문단의 「보유 옷 1벌을 기준으로」는 「옷장에 등록한 옷 1벌을 기준으로」로 정리합니다.

## BE 검증 기준

- `clothesId`가 요청 사용자 옷장에 없거나 비활성이면 `404` 또는 `400`.
- `ownership_status`가 `OWNED`, `WISHLIST`가 아니면 거부.
- **`OWNED`만 허용하는 검증은 사용하지 않습니다.**

## FE 구현 위치

| 파일 | 역할 |
| --- | --- |
| `src/components/HomeTab.tsx` | `matchEligibleClothes`, 기준 옷 선택 모달, `fetchClothesRecommendations` 호출 |
| `src/api/recommendations.ts` | `GET .../recommendations` 클라이언트 |

## 관련 문서

- [home-recommendation.md](../features/home-recommendation.md)
- [frontend-api-usage.md](./frontend-api-usage.md)
- [recommendation-policy.md](../features/recommendation-policy.md)
