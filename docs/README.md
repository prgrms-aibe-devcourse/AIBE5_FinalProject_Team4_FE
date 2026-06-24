---
doc_type: fe_doc_index
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-25
---

# 프로젝트 문서

이 폴더는 옷장난감 FE 레포의 공식 프로젝트 문서입니다. 기획, 기능 범위, 도메인 규칙, FE 화면 흐름, API 사용 방식, mock 정책, 라우팅, 로딩/에러/빈 상태를 같은 기준으로 이해하기 위해 작성합니다.

## 문서 원칙

- 공통 기획/기능/도메인 문서는 BE 레포를 source of truth로 봅니다.
- FE 레포에는 공통 문서를 BE 원본과 동일한 기준으로 둡니다. FE 화면 적용 기준은 FE 전용 문서에서 상세화합니다.
- 기능 요구사항과 세부기능 ID의 공식 기준은 [requirements/requirements-definition.md](./requirements/requirements-definition.md)입니다.
- API 계약, DB, ERD 상세는 BE 문서를 원본으로 봅니다.
- 이용약관, 개인정보 처리방침, 마케팅 정보 수신 동의 원본은 BE `docs/legal/`과 BE `/api/v1/legal/{documentType}` 응답을 기준으로 봅니다.
- FE 화면 흐름, 라우팅, FE API 사용 방식, mock 정책, 로딩/에러/빈 상태는 FE 문서에서 상세화합니다.
- 코드와 문서가 다르면 PR에서 코드가 문서를 따를지, 문서 기준을 수정할지 명시합니다.
- 기능 흐름, API 사용 방식, 라우팅, mock 정책, 로딩/에러/빈 상태 기준이 코드 변경으로 달라지면 관련 문서를 같은 PR에서 수정합니다.
- 오래된 기준은 삭제 전에 변경 사유를 남기거나, 문서 안에서 deprecated로 표시합니다.

## 문서 목록

| 문서 | 성격 | 역할 |
| --- | --- | --- |
| [planning/project-plan.md](./planning/project-plan.md) | 공통 | 서비스 기획, 문제 정의, MVP 범위, 주요 화면 구조 |
| [requirements/requirements-definition.md](./requirements/requirements-definition.md) | 공통 | 요구사항 ID, 세부기능 ID, 기능 요구, 정책/제약 기준 |
| [requirements/feature-index.md](./requirements/feature-index.md) | 공통 | 요구사항 정의서의 세부기능 ID와 API/화면/도메인 연결 기준 |
| [domain/glossary.md](./domain/glossary.md) | 공통 | 프로젝트에서 사용하는 도메인 용어와 enum 기준 |
| [domain/catalog.md](./domain/catalog.md) | 공통 | 카테고리, 타입, 계절, 색상, 스타일, 외부 출처 code 사용 기준 |
| [domain/invariants.md](./domain/invariants.md) | 공통 | 구현 중 유지해야 하는 핵심 도메인 규칙 |
| [features/recommendation-policy.md](./features/recommendation-policy.md) | 공통 | 추천 점수, 피드백, 추천 제외, 동점 처리 기준 |
| [features/garment-registration.md](./features/garment-registration.md) | 공통 | 사진, 구매내역, 외부 상품 기반 옷 등록 흐름 |
| [features/auth-and-onboarding.md](./features/auth-and-onboarding.md) | FE | 로그인, 약관 링크, 온보딩, 마케팅 정보 수신 동의 기준 |
| [architecture/system-architecture.md](./architecture/system-architecture.md) | 공통 | FE, BE, DB, 외부 API, 저장소, 인프라의 전체 연결 구조 |
| [architecture/information-architecture.md](./architecture/information-architecture.md) | 공통 | 화면, 메뉴, 주요 진입 흐름 |
| [architecture/sequence-diagrams.md](./architecture/sequence-diagrams.md) | 공통 | 로그인, 옷 등록, 옷장, 추천, 보유 전환, 룩피드 주요 기능 흐름 |
| [architecture/tech-stack.md](./architecture/tech-stack.md) | 공통 | FE/BE 기술 스택, 외부 API, 인프라, 테스트 도구 기준 |
| [api/frontend-api-usage.md](./api/frontend-api-usage.md) | FE | FE API 호출 기준, 응답 처리, 인증 사용자 ID, 오류 처리 |
| [frontend/domain-types.md](./frontend/domain-types.md) | FE | FE 도메인 타입, API code, view model 기준 |
| [frontend/implementation-gaps.md](./frontend/implementation-gaps.md) | FE | 현재 FE 코드와 공식 문서 기준의 차이 |
| [frontend/folder-structure.md](./frontend/folder-structure.md) | FE | FE 폴더 구조와 파일 책임 |
| [frontend/mock-policy.md](./frontend/mock-policy.md) | FE | mock 데이터, mock API, 실제 API 경계 |
| [frontend/routing.md](./frontend/routing.md) | FE | 라우팅과 화면 진입 기준 |
| [features/home-recommendation.md](./features/home-recommendation.md) | FE | 홈 추천 화면, 추천 라벨, 저장/피드백 기준 |
| [features/wardrobe.md](./features/wardrobe.md) | FE | 옷장 화면, 보유/위시리스트 탭, 전환 기준 |
| [features/mypage.md](./features/mypage.md) | FE | 마이페이지, 프로필 API, 계정 관리 기준 |
| [features/outfit-book.md](./features/outfit-book.md) | FE | 코디북, 코디 상세, 저장/수정/삭제 기준 |
| [features/common-loading-error.md](./features/common-loading-error.md) | FE | 공통 loading, success, empty, error 상태 처리 기준 |

## 문서 확인 순서

처음 문서를 읽거나 FE 기능을 작성, 수정, 삭제, 검토할 때는 아래 순서를 따릅니다.

1. [기획서](./planning/project-plan.md)에서 서비스 목표와 MVP 범위를 확인합니다.
2. [요구사항 정의서](./requirements/requirements-definition.md)에서 요구사항 ID, 세부기능 ID, 기능 요구, 정책/제약을 확인합니다.
3. [기능 인덱스](./requirements/feature-index.md)에서 세부기능 ID와 API, 데이터, FE 화면 연결 기준을 확인합니다.
4. [시스템 아키텍처](./architecture/system-architecture.md), [정보 구조도](./architecture/information-architecture.md), [시퀀스 다이어그램](./architecture/sequence-diagrams.md), [기술 스택](./architecture/tech-stack.md)에서 전체 구성, 화면 흐름, 주요 기능 동작 순서, 사용 기술을 확인합니다.
5. [도메인 용어집](./domain/glossary.md), [카탈로그 사용 가이드](./domain/catalog.md), [도메인 규칙](./domain/invariants.md)에서 데이터 의미와 불변 규칙을 확인합니다.
6. [FE 구현 정합성 현황](./frontend/implementation-gaps.md)에서 현재 코드와 공식 기준의 차이, mock/static/local state 경계를 확인합니다.
7. [인증과 온보딩](./features/auth-and-onboarding.md), [추천 정책](./features/recommendation-policy.md), [옷 등록 플로우](./features/garment-registration.md)에서 주요 기능 정책을 확인합니다.
8. [FE 도메인 타입 기준](./frontend/domain-types.md)에서 API code, UI label, view model 변환 기준을 확인합니다.
9. [FE API 사용 기준](./api/frontend-api-usage.md)에서 API 호출, 응답 parsing, 인증 사용자 ID, 오류 처리 기준을 확인합니다.
10. [폴더 구조](./frontend/folder-structure.md), [라우팅 기준](./frontend/routing.md), [mock 정책](./frontend/mock-policy.md)에서 FE 코드 구조와 임시 구현 경계를 확인합니다.
11. [홈 추천 화면](./features/home-recommendation.md), [옷장 화면](./features/wardrobe.md), [마이페이지](./features/mypage.md), [코디북](./features/outfit-book.md), [공통 로딩/에러/빈 상태](./features/common-loading-error.md)에서 화면별 구현 기준을 확인합니다.
12. 문서 기준과 코드가 다르면 코드가 문서를 따를지, 문서 기준을 수정할지 PR 안에서 명시합니다.
13. 현재 코드와 공식 기준의 차이가 생기거나 해소되면 [FE 구현 정합성 현황](./frontend/implementation-gaps.md)을 같은 PR에서 수정합니다.

## 문서와 코드 정합성 기준

이 문서는 FE 구현의 공식 기준입니다. 구현 코드가 이 문서의 규칙, 계약, 용어, 화면 흐름과 맞지 않으면 문서 기준을 충족하지 않는 구현으로 봅니다.

기존 코드가 임시 구현, mock, 하드코딩, 비공식 API 경로를 포함할 수 있더라도 실제 기능 연동 기준은 이 문서를 따릅니다. 코드 변경으로 문서 기준 자체가 바뀌어야 한다면, 코드만 변경하지 않고 해당 기준 문서를 함께 갱신합니다.

현재 코드와 공식 문서 기준의 차이는 [implementation-gaps.md](./frontend/implementation-gaps.md)에 기록합니다. 차이가 해소되면 해당 문서도 함께 수정합니다.

## 동기화 기준

공통 문서가 변경되면 같은 변경 사항이 필요한 FE 문서도 함께 확인합니다. FE 레포의 공통 문서는 BE 원본과 동일한 기준으로 관리하며, 기획, 기능 ID, 도메인 용어, enum 값은 BE 문서의 기준과 충돌하지 않아야 합니다.

API 계약이 변경되면 BE `docs/api/api-contract.md`를 먼저 확인하고, FE에서 사용하는 경로, 요청 필드, 응답 필드, 오류 처리 기준은 [frontend-api-usage.md](./api/frontend-api-usage.md)에 반영합니다.

도메인 code 또는 FE 타입 기준이 변경되면 [domain-types.md](./frontend/domain-types.md)를 함께 수정합니다. 현재 구현과 목표 기준의 차이가 해소되거나 새로 생기면 [implementation-gaps.md](./frontend/implementation-gaps.md)를 함께 수정합니다.

## BE 원본 공통 문서와 FE 동기화 문서

FE 레포에는 아래 문서를 BE 원본과 동일한 기준으로 둡니다.

```text
docs/planning/project-plan.md
docs/requirements/requirements-definition.md
docs/requirements/feature-index.md
docs/domain/glossary.md
docs/domain/catalog.md
docs/domain/invariants.md
docs/features/recommendation-policy.md
docs/features/garment-registration.md
docs/architecture/system-architecture.md
docs/architecture/information-architecture.md
docs/architecture/sequence-diagrams.md
docs/architecture/tech-stack.md
```

FE 전용 문서는 위 공통 기준을 FE 화면, 컴포넌트, 라우팅, API 사용 방식, mock 정책, 로딩/에러/빈 상태에 적용하는 방식으로 작성합니다.
