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
| `MYPAGE-001` | 내 정보 조회/수정 | 내 정보 화면에서는 개인정보를 확인하고, 프로필 이미지, 기본 정보, 선호 스타일을 수정합니다. 자기소개와 외부 링크는 룩피드 프로필 편집 흐름에서 수정합니다. |
| `MYPAGE-002` | 소셜 계정 확인 | 연결된 소셜 로그인 제공자를 확인합니다. |
| `MYPAGE-003` | 외부 링크 관리 | 사용자 룩피드 프로필의 외부 링크를 등록/수정합니다. |
| `MYPAGE-004` | 로그아웃 | 로그인 상태를 해제하고 로그인 화면 또는 초기 화면으로 이동합니다. |
| `MYPAGE-005` | 회원 탈퇴 | 기본 마이페이지에는 노출하지 않고, 개인정보 편집 화면 안에서 사용자 탈퇴 요청과 탈퇴 후 화면 전환을 처리합니다. |
| `SYSTEM-010` | 마케팅 정보 수신 동의 | 마케팅 정보 수신 동의 상태를 조회하고 동의/철회를 처리합니다. |

## 프로필 API 기준

BE 기준으로 마이페이지 프로필 조회 API는 아래 경로를 사용합니다.

| 기능 | Method | API 기준 | FE 사용 기준 |
| --- | --- | --- | --- |
| 내 프로필 조회 | GET | `/api/v1/users/profile` | 로그인 사용자 본인의 마이페이지 정보 표시 |
| 사용자 프로필 상세 조회 | GET | `/api/v1/users/profile/{userId}` | 타 사용자 프로필 또는 룩피드 프로필 표시 |
| 닉네임 중복 확인 | GET | `/api/v1/users/nickname/check` | 개인정보 편집 화면에서 닉네임 규칙과 중복 여부 실시간 확인 |
| 프로필 이미지 업로드 | POST | `/api/v1/users/profile/image` | 프로필 사진 파일을 업로드하고 반환된 이미지 URL을 프로필 저장 요청에 사용 |
| 마케팅 동의 조회 | GET | `/api/v1/users/{userId}/marketing-consent` | 마케팅 정보 수신 동의 상태 표시 |
| 마케팅 동의 변경 | PATCH | `/api/v1/users/{userId}/marketing-consent` | 마케팅 정보 수신 동의/철회 반영 |
| 회원 탈퇴 | DELETE | `/api/v1/users/me` | 탈퇴 확인 후 회원 상태를 정리하고 로그인 전 화면으로 이동 |
| 탈퇴 계정 복구 | POST | `/api/v1/auth/restore-withdrawn` | 탈퇴 후 30일 이내 재로그인 시 복구 확인 모달에서 사용자가 복구를 선택한 경우 호출 |

`GET /api/v1/users/profile`은 본인 마이페이지와 편집 화면에 필요한 기본 프로필, 온보딩 여부, 생년월일, 사용자 성별, 지역, 프로필 이미지 URL, 자기소개, 외부 링크, 선호 스타일 code, 소셜 로그인 제공자를 반환합니다.

응답 타입의 원본은 BE API 계약을 따르며, FE에서는 화면에 필요한 필드만 view model로 변환합니다.

## 화면 상태 기준

- 프로필 조회 중에는 loading 상태를 표시합니다.
- 프로필이 없거나 인증이 만료되면 로그인 필요 상태로 처리합니다.
- 저장 실패 시 사용자가 입력한 값을 유지하고 오류 메시지를 표시합니다.
- 로그아웃 또는 회원 탈퇴 후에는 local token과 사용자 상태를 정리합니다.

## 현재 구현 확인 대상

현재 FE 구현은 `App.tsx`, `userProfileStorage.ts`를 중심으로 본인 프로필 API 응답을 화면 상태에 반영합니다.

프로필 API 연동 PR에서는 아래를 함께 확인합니다.

- `GET /api/v1/users/profile` 응답을 마이페이지 초기 상태로 반영합니다.
- `GET /api/v1/users/profile/{userId}`가 필요한 화면과 본인 프로필 화면을 구분합니다.
- 내 정보 화면은 확인 중심으로 유지하고, 기본 정보 수정·지역 수정·마케팅 동의 변경·회원탈퇴는 기본 정보 하단 시트에서 처리합니다.
- 선호 스타일 수정은 선호 스타일 하단 시트에서 처리합니다.
- 프로필 이미지 수정은 내 정보 화면에서 파일을 업로드한 뒤, 서버가 반환한 이미지 URL을 프로필 저장 요청에 반영합니다.
- 자기소개와 외부 링크 수정은 룩피드 프로필 편집 흐름에서 처리합니다.
- 닉네임은 룩피드 프로필 식별에도 사용하므로 전체 회원 기준으로 중복될 수 없으며, 개인정보 편집 화면에서 `GET /api/v1/users/nickname/check`로 실시간 확인합니다.
- 닉네임은 영문 소문자, 숫자, 마침표(`.`), 밑줄(`_`)만 3~30자로 입력합니다.
- 마케팅 정보 수신 동의 상태는 `GET /api/v1/users/{userId}/marketing-consent`로 조회하고, 저장 시 `PATCH /api/v1/users/{userId}/marketing-consent`로 반영합니다.
- 마케팅 정보 수신 동의 원문은 BE `/api/v1/legal/marketing-consent` 응답의 markdown `content`를 마이페이지 내 모달로 표시합니다.
- 회원 탈퇴는 `DELETE /api/v1/users/me`를 호출하고, 성공 시 local 사용자 상태를 정리해 로그인 전 화면으로 이동합니다.
- 탈퇴 후 30일 이내 같은 계정으로 다시 로그인하면 복구 확인 모달을 표시하고, 사용자가 복구를 선택한 경우에만 `POST /api/v1/auth/restore-withdrawn`을 호출합니다.
- 마이페이지 선호 스타일 표시와 편집 선택지는 `GET /api/v1/categories` 응답의 style code/name을 우선 사용합니다.
- 선호 스타일 수정 시 최소 2개 이상 선택해야 저장할 수 있습니다.
- 카탈로그 API 조회에 실패하거나 style 목록이 비어 있으면 선호 스타일 편집 선택지를 임의 fallback으로 대체하지 않고, 오류 상태를 확인할 수 있게 처리합니다.

## 변경 기준

- 마이페이지 API 경로, 응답 필드, 사용자 상태 관리 기준이 바뀌면 이 문서를 수정합니다.
- 인증 유지 흐름이 바뀌면 [API 사용 기준](../api/frontend-api-usage.md)과 [공통 로딩/에러/빈 상태](./common-loading-error.md)를 함께 확인합니다.
