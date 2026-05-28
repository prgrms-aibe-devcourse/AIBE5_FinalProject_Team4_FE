# 옷장난감 FE

옷장 관리 서비스 **옷장난감**의 프론트엔드 프로젝트입니다.

- 백엔드: [closetnangam-BE](https://github.com/your-org/closetnangam-BE) (Spring Boot 3.5 / Java 21)
- 배포: EC2 (FE + BE 분리) / RDS / Docker

---

## 기술 스택

| 분류 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | React | 18.3 |
| 빌드 도구 | Vite | 8 |
| 언어 | TypeScript | 6 |
| 스타일링 | Tailwind CSS | 4 |
| 라우팅 | React Router | 7 |
| HTTP 클라이언트 | Axios | 1 |
| 린터 | ESLint | 10 |
| Node.js | Node.js | 24.13.0 |

---

## 팀원 온보딩 가이드

### 사전 준비 — Node.js 버전 맞추기

이 프로젝트는 **Node.js v24.13.0** 을 사용합니다. 버전이 다르면 설치 시 오류가 발생합니다.

nvm이 설치되어 있다면:

```bash
nvm install   # .nvmrc를 읽어 v24.13.0 자동 설치
nvm use       # 해당 버전으로 전환
node -v       # v24.13.0 확인
```

nvm이 없다면 [nvm 설치 가이드](https://github.com/nvm-sh/nvm)를 참고하세요.

### 1. 레포지토리 클론

```bash
git clone <레포지토리 주소>
cd closetnangam-FE
```

### 2. 의존성 설치

```bash
npm ci
```

> `npm install` 대신 `npm ci`를 사용합니다. `package-lock.json` 기준으로 설치하여 팀원 간 패키지 버전을 완전히 통일합니다.

### 3. 환경변수 설정

`.env.local` 파일을 직접 생성해야 합니다. (`.gitignore`에 포함되어 git에서 관리되지 않습니다)

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 백엔드 주소를 확인하세요. 로컬에서 백엔드를 직접 실행하는 경우 기본값 그대로 사용하면 됩니다.

```
VITE_API_BASE_URL=http://localhost:8080
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 에 접속하여 확인하세요.

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

## 절대경로 alias

`@/`는 `src/`를 가리키는 절대경로 alias입니다.

```ts
// ❌ 상대경로 (사용 금지)
import Button from '../../components/common/Button'

// ✅ 절대경로
import Button from '@/components/common/Button'
```

## 주요 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (localhost:5173) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 코드 검사 |
| `npm run preview` | 빌드 결과물 로컬 미리보기 |

## 환경변수

| 변수명 | 설명 | 예시 |
|---|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 주소 | `http://localhost:8080` |

> `VITE_` 접두사가 붙은 환경변수만 브라우저에서 접근 가능합니다. 민감한 정보는 절대 `VITE_`를 붙이지 마세요.
