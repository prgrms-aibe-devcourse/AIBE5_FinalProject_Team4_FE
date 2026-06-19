---
doc_type: fe_feature_mypage
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-15
---

# 마이페이지

이 문서는 FE 마이페이지 화면의 기능 범위, API 사용 기준, 현재 구현 확인 대상을 정리합니다.

## 기준 문서

- 기능 요구사항: [요구사항 정의서](../requirements/requirements-definition.md)
- 기능 ID 연결: [기능 인덱스](../requirements/feature-index.md)
- API 사용 기준: [API 사용 기준](../api/frontend-api-usage.md)
- 현재 구현 차이: [FE 구현 정합성 현황](../frontend/implementation-gaps.md)

## 기능 범위

| 세부기능 ID | 기능 | FE 처리 기준 |
| --- | --- | --- |
| `MYPAGE-001` | 내 정보 조회/수정 | 닉네임, 생년월일, 사용자 성별, 지역, 선호 스타일을 확인하고 수정합니다. |
| `MYPAGE-002` | 소셜 계정 확인 | 연결된 소셜 로그인 제공자를 확인합니다. |
| `MYPAGE-003` | 외부 링크 관리 | 사용자 룩피드 프로필의 외부 링크를 등록/수정합니다. |
| `MYPAGE-004` | 로그아웃 | 로그인 상태를 해제하고 로그인 화면 또는 초기 화면으로 이동합니다. |
| `MYPAGE-005` | 회원 탈퇴 | 사용자 탈퇴 요청과 탈퇴 후 화면 전환을 처리합니다. |
| `SYSTEM-010` | 마케팅 정보 수신 동의 | 마케팅 정보 수신 동의 상태를 조회하고 동의/철회를 처리합니다. |

## 프로필 API 기준

BE 기준으로 마이페이지 프로필 조회 API는 아래 경로를 사용합니다.

| 기능 | Method | API 기준 | FE 사용 기준 |
| --- | --- | --- | --- |
| 내 프로필 조회 | GET | `/api/v1/users/profile` | 로그인 사용자 본인의 마이페이지 정보 표시 |
| 사용자 프로필 상세 조회 | GET | `/api/v1/users/profile/{userId}` | 타 사용자 프로필 또는 룩피드 프로필 표시 |
| 마케팅 동의 조회 | GET | `/api/v1/users/{userId}/marketing-consent` | 마케팅 정보 수신 동의 상태 표시 |
| 마케팅 동의 변경 | PATCH | `/api/v1/users/{userId}/marketing-consent` | 마케팅 정보 수신 동의/철회 반영 |

응답 타입의 원본은 BE API 계약을 따르며, FE에서는 화면에 필요한 필드만 view model로 변환합니다.

## 화면 상태 기준

- 프로필 조회 중에는 loading 상태를 표시합니다.
- 프로필이 없거나 인증이 만료되면 로그인 필요 상태로 처리합니다.
- 저장 실패 시 사용자가 입력한 값을 유지하고 오류 메시지를 표시합니다.
- 로그아웃 또는 회원 탈퇴 후에는 local token과 사용자 상태를 정리합니다.

## 현재 구현 확인 대상

현재 FE 구현은 `ProfileEditTab.tsx`, `App.tsx`를 중심으로 local state를 사용합니다. 프로필 데이터는 앱 시작 시 `GET /api/v1/users/profile` 응답을 기반으로 초기화하며, localStorage 캐시는 사용하지 않습니다.

프로필 API 연동 PR에서는 아래를 함께 확인합니다.

- `GET /api/v1/users/profile` 응답을 마이페이지 초기 상태로 반영합니다.
- `GET /api/v1/users/profile/{userId}`가 필요한 화면과 본인 프로필 화면을 구분합니다.
- 마케팅 정보 수신 동의 상태는 `GET /api/v1/users/{userId}/marketing-consent`로 조회하고, 토글 변경 시 `PATCH /api/v1/users/{userId}/marketing-consent`로 반영합니다.
- 마케팅 정보 수신 동의 원문은 정적 markdown 파일을 직접 이동하지 않고 마이페이지 내 모달로 표시합니다.
- 온보딩/마이페이지 선호 스타일 code가 [카탈로그 사용 가이드](../domain/catalog.md)와 맞는지 확인합니다.
- 프로필 API 연동으로 local state gap이 해소되면 [FE 구현 정합성 현황](../frontend/implementation-gaps.md)을 수정합니다.

## 변경 기준

- 마이페이지 API 경로, 응답 필드, 사용자 상태 관리 기준이 바뀌면 이 문서를 수정합니다.
- 인증 유지 흐름이 바뀌면 [API 사용 기준](../api/frontend-api-usage.md)과 [공통 로딩/에러/빈 상태](./common-loading-error.md)를 함께 확인합니다.
