---
doc_type: fe_folder_structure
source_of_truth: AIBE5_FinalProject_Team4_FE
last_updated: 2026-06-03
---

# FE 폴더 구조

이 문서는 FE 레포의 폴더와 파일 책임을 정리합니다.

## 현재 구조

```text
src/
├── api/
├── assets/
├── components/
│   └── common/
├── hooks/
├── pages/
│   └── error/
├── types.ts
├── types/
├── utils/
├── App.tsx
├── main.tsx
└── index.css
```

## 폴더 책임

| 경로 | 책임 |
| --- | --- |
| `src/api/` | Axios 인스턴스, API client, API별 호출 함수 |
| `src/assets/` | FE 번들에 포함되는 이미지, 정적 자원 |
| `src/components/` | 여러 화면에서 재사용하는 UI 컴포넌트 |
| `src/components/common/` | Spinner, Skeleton, LoadingWrapper 등 공통 상태 컴포넌트 |
| `src/data/` | 화면 검증용 static seed data 또는 mock data |
| `src/hooks/` | API 호출, 상태 관리, 화면 공통 로직을 담는 custom hook |
| `src/pages/` | 라우트 단위 화면 |
| `src/pages/error/` | 404, 서버 오류, 네트워크 오류 등 공통 에러 화면 |
| `src/types.ts`, `src/types/` | FE에서 공유하는 TypeScript 타입 |
| `src/utils/` | 화면과 무관한 순수 유틸리티 |

## 파일 배치 기준

### API

API 호출은 `src/api/`에 둡니다.

권장 구조:

```text
src/api/
├── index.ts
├── clothes.ts
├── wardrobe.ts
├── recommendations.ts
└── catalog.ts
```

컴포넌트 내부에서 직접 `fetch`를 작성하기보다 API 함수 또는 공통 API 클라이언트를 사용합니다.

### 화면

라우트와 직접 연결되는 화면은 `src/pages/`에 둡니다.

예:

```text
src/pages/OnboardingPage.tsx
src/pages/error/ServerErrorPage.tsx
```

현재 `App.tsx` 안에 탭 단위 화면이 많이 포함되어 있으나, 기능이 커지는 경우 아래처럼 분리합니다.

```text
src/pages/HomePage.tsx
src/pages/WardrobePage.tsx
src/pages/ProfilePage.tsx
src/pages/FeedPage.tsx
```

### 컴포넌트

화면 일부를 구성하는 컴포넌트는 `src/components/`에 둡니다.

예:

```text
src/components/HomeTab.tsx
src/components/ClosetTab.tsx
src/components/ProfileEditTab.tsx
```

여러 화면에서 공통으로 쓰는 컴포넌트는 `src/components/common/`에 둡니다.

### 데이터

화면 검증용 static seed data 또는 mock data는 `src/data/`에 둘 수 있습니다.

예:

```text
src/data/
├── initialGarments.ts
└── triggerProducts.ts
```

`src/data/`의 데이터는 실제 API 응답을 대체하는 공식 데이터가 아닙니다. 실제 API 연동 코드에서 계속 사용된다면 [mock-policy.md](mock-policy.md)와 [implementation-gaps.md](implementation-gaps.md)에 경계를 기록합니다.

### 타입

도메인 타입은 공통 문서의 용어를 따릅니다.

예:

```ts
type OwnershipStatus = 'OWNED' | 'WISHLIST';
type ClothesInfoSource = 'PHOTO' | 'PURCHASE_HISTORY' | 'EXTERNAL_SHOPPING';
```

API 응답 타입은 API별 파일 또는 `src/types/`에 둡니다.

## 구조 유지 기준

- API 호출 로직은 `src/api/` 또는 관련 hook으로 모읍니다.
- 라우트 단위 화면과 재사용 컴포넌트는 책임을 분리합니다.
- 도메인 타입은 공통 문서의 enum/code 기준과 일치시킵니다.
- 화면 검증용 seed/mock 데이터는 `src/data/`에 둘 수 있지만, 실제 API 연동 기준을 대체하지 않습니다.
- 공통 로딩/에러 UI는 `src/components/common/` 또는 공통 화면에서 재사용합니다.
- `App.tsx`가 기능 추가로 과도하게 커지면 페이지와 컴포넌트로 분리합니다.
- 폴더 책임이나 주요 파일 배치 기준이 바뀌면 이 문서를 같은 PR에서 수정합니다.
