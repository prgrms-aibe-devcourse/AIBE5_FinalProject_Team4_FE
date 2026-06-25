---
doc_type: fe_implementation_gaps
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-25
---

# FE 구현 정합성 현황

이 문서는 현재 FE 코드와 `docs/` 공식 기준 사이에 남아 있는 차이를 정리합니다.
차이는 곧바로 오류라는 뜻이 아니라, 구현 또는 문서 기준 확정 단계에서 맞춰야 할 내용을 명확히 하기 위한 기록입니다.

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

## 현재 남은 gap 요약

### OOTD 발표용 임시 mock (HomeTab.tsx)
- **상태**: 임시 (발표 후 원복 예정)
- **내용**: 로그인 사용자에게도 `fetchOotdRecommendations` API 대신 고정 mock 3개 코디를 표시하도록 임시 변경됨.
- **영향**: BE OOTD API 장애/계약 문제가 화면에 드러나지 않음. 사용자 옷장/날씨 기반 추천 결과 미반영.
- **원복 방법**: HomeTab.tsx에서 TODO 주석 위치 찾아 `res = { combinations: [...] }` 를 `res = await fetchOotdRecommendations(wardrobeId, currentTemp ?? 20)` 로 복구.

## 문서 변경 기준

- 이 문서에 적힌 현재 구현 차이가 실제 코드 수정으로 해소되면 이 문서도 함께 수정합니다.
- gap이 완전히 해소되면 이 문서에서 해당 항목을 삭제합니다.
- 일부만 해소되면 해소된 내용은 삭제하고 아직 남은 차이만 더 좁게 작성합니다.
- 코드 변경으로 기준 문서와 구현 차이가 새로 생기면 같은 PR에서 이 문서를 갱신합니다.
- 현재 코드를 우선 기준으로 확정하기로 결정한 경우, 코드만 유지하지 않고 관련 기준 문서도 같은 PR에서 함께 수정합니다.
- API 경로, 요청 필드, 응답 필드, 오류 처리 기준이 바뀌면 [frontend-api-usage.md](../api/frontend-api-usage.md)를 같은 PR에서 수정합니다.
- 기능 범위, 화면 흐름, 라우팅 기준이 바뀌면 [feature-index.md](../requirements/feature-index.md), 관련 기능 문서, [routing.md](routing.md)를 함께 확인합니다.
- 도메인 규칙, enum, catalog code, FE 타입 기준이 바뀌면 [glossary.md](../domain/glossary.md), [catalog.md](../domain/catalog.md), [invariants.md](../domain/invariants.md), [domain-types.md](domain-types.md)를 함께 확인합니다.
- mock 데이터, fallback, 임시 API 경계가 바뀌면 [mock-policy.md](mock-policy.md)를 같은 PR에서 수정합니다.
- 공통 문서가 변경되면 BE 레포 원본 문서와 FE 레포의 동일 기준 문서를 함께 확인합니다.
