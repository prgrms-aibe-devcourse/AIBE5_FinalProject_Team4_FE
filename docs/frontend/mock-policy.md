---
doc_type: fe_mock_policy
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-12
---

# Mock 데이터 사용 정책

이 문서는 FE에서 mock 데이터를 사용할 수 있는 범위와 실제 API 연동 시 제거해야 할 기준을 정리합니다.

## 기본 원칙

- mock 데이터는 개발 초기 화면 구성과 API 미구현 상태에서만 사용합니다.
- 실제 API가 존재하는 기능은 API 응답을 화면 상태에 반영해야 합니다.
- mock 데이터와 실제 API 응답을 동시에 사용한다면 사용자에게 어떤 데이터가 표시되는지 명확해야 합니다.
- 사용자가 실제 기능으로 오해할 수 있는 mock 플로우는 문구나 상태를 통해 임시 동작임을 구분합니다.
- 실제 API 연동 코드에서 mock 데이터가 API 응답을 대체해 화면에 표시되면 이 문서 기준을 충족하지 않습니다.

## 허용되는 mock

| 상황 | 허용 기준 |
| --- | --- |
| API 미구현 | 화면 레이아웃 확인용 mock 사용 가능 |
| 디자인 확인 | 카드, skeleton, empty state 확인용 mock 사용 가능 |
| 데모 데이터 | 시연 목적의 초기 데이터 사용 가능 |
| 로딩/에러 상태 | 네트워크 상태 재현을 위한 mock 가능 |

## 지양하는 mock

| 상황 | 이유 |
| --- | --- |
| API 응답을 받았지만 화면에는 mock만 표시 | 실제 기능 검증 불가 |
| 업로드 UI처럼 보이지만 파일 input이 없음 | 사용자 기대와 동작 불일치 |
| 저장 완료처럼 보이지만 서버 저장이 없음 | 데이터 유실 오해 |
| 추천 제외/싫어요처럼 보이지만 피드백 API 미호출 | 도메인 규칙 미반영 |

## 기능별 기준

### 홈 추천

- 현재 구현: `HomeTab.tsx`의 OOTD(`RECO-001`), 취향 기반(`RECO-002`), 유사 상품(`RECO-003`), 어울리는 옷(`RECO-005`), AI MD(`RECO-006`) 라벨 모두 BE API를 호출합니다.
- `RECO-013`~`RECO-014` 추천 피드백/제외 API 연동이 완료되었습니다.
- API 실패 시 fallback 데이터(static)가 사용되지만, 에러 메시지를 통해 사용자에게 실패 상태가 노출됩니다.

### 옷장

- 초기 데모용 보유/미보유 옷 목록은 mock으로 둘 수 있습니다.
- 실제 옷 목록 API가 연결되면 보유/미보유 상태는 BE의 `WARDROBE_CLOTHES.ownership_status` 값인 `OWNED`, `WISHLIST`를 기준으로 판단합니다.
- `isWishlist` 같은 FE mock boolean은 실제 API 연동 기준을 대체하지 않습니다.
- 미보유에서 보유 전환은 서버 상태 전환 API와 연결되어야 합니다.

### 옷 등록

- 사진/구매내역 분석 과정은 mock으로 시각화할 수 있습니다.
- 실제 등록 기능으로 안내하는 경우 파일 선택, 업로드, 분석, 초안 확인, 최종 저장 단계가 연결되어야 합니다.
- 분석 결과는 사용자가 수정할 수 있어야 합니다.

### 공통 로딩/에러

- 로딩과 에러 화면 검증용 mock은 허용합니다.
- 실제 API 실패 시 공통 에러 처리와 화면별 에러 처리가 충돌하지 않아야 합니다.

## 문서화 기준

mock을 사용하는 화면은 관련 기능 문서에 아래를 적습니다.

```text
- mock 사용 여부
- mock 데이터 목적
- 실제 API 연결 시 제거 또는 대체할 부분
- 사용자에게 임시 동작으로 보일 수 있는 부분
```

## 현재 Mock API 경계

현재 FE 코드에는 개발 또는 mock 성격으로 볼 수 있는 API 경로가 남아 있을 수 있습니다.

| 경로 / 데이터 | 기준 |
| --- | --- |
| `HomeTab.tsx` OOTD·스타일 API 연동 | **BE 추천 API 연동**. API 실패 시에만 static 데이터를 fallback으로 사용하며 에러를 표시합니다. |
| `HomeTab.tsx` `match` 탭 (`RECO-005`) | **BE `recommendations` API 연동**. mock/static이 아닙니다. |
| `HomeTab.tsx` `similar` 탭 (`RECO-003`) | **BE `similar-products` API 연동**. 기준 옷은 `OWNED`만 사용합니다. |
| `HomeTab.tsx` `aimd` 탭 (`RECO-006`) | **BE AI MD API 연동**. MD 목록, 코디·상품 추천, 코디 저장을 사용합니다. |
| `/api/chat-gamyagi` | BE API 계약에 없는 AI 채팅 mock 또는 개발용 경로입니다. 실제 AI MD 연동은 `/api/v1/users/{userId}/recommendations/ai-md/**` 기준입니다. |
| `/api/analyze-garment` | BE API 계약에 없는 legacy 분석 mock 또는 개발용 경로입니다. 실제 옷 등록 분석은 photo/purchase-capture API 기준으로 사용합니다. |

위 경로가 실제 서비스 API로 유지되어야 한다면 BE API 계약과 FE API 사용 문서를 먼저 갱신합니다.

## 실제 연동 기준

- 실제 API가 있는 기능은 API 응답을 화면 상태에 반영합니다.
- mock 데이터는 도메인 enum/code 기준과 충돌하지 않는 값을 사용합니다.
- mock 저장, 전환, 삭제는 실제 사용자 데이터 변경처럼 표시하지 않습니다.
- fallback 데이터와 정상 API 데이터는 화면 상태나 안내 문구로 구분합니다.
- mock 제거 또는 실제 API 대체가 필요한 부분은 관련 이슈나 기능 문서에 남깁니다.
- mock 사용 범위가 바뀌거나 실제 API 대체 시점이 바뀌면 이 문서와 관련 기능 문서를 함께 수정합니다.
