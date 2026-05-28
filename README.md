# 옷장난감 FE

옷장 관리 서비스 **옷장난감**의 프론트엔드 프로젝트입니다.

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | React 19 + Vite 8 + TypeScript 6 |
| 스타일링 | Tailwind CSS v4 |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios |

## 시작하기 (팀원 온보딩 가이드)

### 1. Node.js 버전 확인

이 프로젝트는 **Node.js v24.13.0** 을 사용합니다.

```bash
node -v   # v24.13.0 이어야 합니다
```

버전이 다르다면 [nvm](https://github.com/nvm-sh/nvm)을 사용하여 맞춰주세요.

```bash
nvm install   # .nvmrc를 읽어 자동으로 v24.13.0 설치
nvm use       # 해당 버전으로 전환
```

### 2. 레포지토리 클론

```bash
git clone <레포지토리 주소>
cd closetnangam-FE
```

### 3. 의존성 설치

```bash
npm ci
```

> `npm install` 대신 `npm ci`를 사용합니다. `package-lock.json` 기준으로 설치해 팀원 간 버전을 완전히 통일합니다.

### 4. 환경변수 설정

`.env.local` 파일을 직접 생성해야 합니다. (`.gitignore`에 포함되어 있어 git에서 관리되지 않습니다)

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 본인 환경에 맞게 값을 수정하세요.

```
VITE_API_BASE_URL=http://localhost:8080
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속 후 확인하세요.

백엔드(Spring Boot)가 `localhost:8080`에서 실행 중이면 `/api/*` 요청이 자동으로 프록시됩니다.

---

## 프로젝트 구조

```
src/
├── api/            # Axios 인스턴스 및 API 호출 함수
├── assets/         # 이미지, 폰트 등 정적 자원
├── components/     # 재사용 가능한 공통 컴포넌트
│   └── common/
├── hooks/          # 커스텀 훅
├── pages/          # 라우트별 페이지 컴포넌트
├── types/          # TypeScript 공통 타입 정의
└── utils/          # 순수 유틸리티 함수
```

## 절대경로 사용법

`@/`는 `src/`의 절대경로 alias입니다.

```ts
// ❌ 상대경로 (피하세요)
import Button from '../../components/common/Button'

// ✅ 절대경로
import Button from '@/components/common/Button'
```

## 주요 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (localhost:5173) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과물 미리보기 |
