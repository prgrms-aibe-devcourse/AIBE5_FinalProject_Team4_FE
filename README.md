<h1 align="center"> 옷장..난감! FE </h1>

<p align="center">
  <strong>"개인 디지털 옷장 기반 의류 및 코디 추천 서비스"</strong>
  <br />
  사용자의 옷장 데이터와 스타일 취향을 바탕으로 어울리는 상품과 코디를 추천합니다.
</p>

<p align="center">
  Backend Repository :
  <a href="https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_BE">
    AIBE5_FinalProject_Team4_BE
  </a>
</p>

<h2 align="center"> 🗂️ Project Overview </h2>

<p align="center">
  옷장난감은 사용자가 보유한 옷과 관심 상품을 디지털 옷장에 등록하고,<br />
  <strong>옷장 데이터와 취향 데이터를 기반으로 개인화된 상품과 코디를 추천받을 수 있는 서비스입니다.</strong>
  <br />
  이 저장소는 위 서비스의 웹 화면과 사용자 인터랙션을 담당합니다.
  <br />
  <br />
  개발 기간 : 2026.05.19 ~ 2026.06.26
</p>

<h2 align="center"> 📖 Documentation </h2>

<p align="center">
  프로젝트의 원활한 협업을 위한 <strong>가이드라인과 공식 문서</strong>입니다.<br />
  작업을 시작하기 전 Wiki와 <strong>docs</strong> 문서를 함께 확인해 주세요!
</p>

<table align="center">
  <tr align="center">
    <td>
      <a href="https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_FE/wiki/FE%E2%80%90%EB%A1%9C%EC%BB%AC-%EA%B0%9C%EB%B0%9C%ED%99%98%EA%B2%BD-%EC%84%B8%ED%8C%85">
        <img src="https://img.shields.io/badge/Setup-⚙️-blue?style=for-the-badge" alt="Setup" />
      </a>
    </td>
    <td>
      <a href="https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_BE/wiki/BranchRule">
        <img src="https://img.shields.io/badge/Strategy-🌳-green?style=for-the-badge" alt="Strategy" />
      </a>
    </td>
    <td>
      <a href="https://www.notion.so/35d3550b7b55811a912dca65f0d0fedd#35d3550b7b5581619fdef191421a3252">
        <img src="https://img.shields.io/badge/Convention-✅-orange?style=for-the-badge" alt="Convention" />
      </a>
    </td>
    <td>
      <a href="./docs/frontend/folder-structure.md">
        <img src="https://img.shields.io/badge/Structure-📂-purple?style=for-the-badge" alt="Structure" />
      </a>
    </td>
    <td>
      <a href="./docs/README.md">
        <img src="https://img.shields.io/badge/Docs-📚-black?style=for-the-badge" alt="Docs" />
      </a>
    </td>
  </tr>
  <tr align="center">
    <td><a href="https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_FE/wiki/FE%E2%80%90%EB%A1%9C%EC%BB%AC-%EA%B0%9C%EB%B0%9C%ED%99%98%EA%B2%BD-%EC%84%B8%ED%8C%85"><strong>개발환경 세팅</strong></a></td>
    <td><a href="https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_BE/wiki/BranchRule"><strong>브랜치 전략</strong></a></td>
    <td><a href="https://www.notion.so/35d3550b7b55811a912dca65f0d0fedd#35d3550b7b5581619fdef191421a3252"><strong>팀 컨벤션</strong></a></td>
    <td><a href="./docs/frontend/folder-structure.md"><strong>폴더 구조</strong></a></td>
    <td><a href="./docs/README.md"><strong>공식 문서</strong></a></td>
  </tr>
</table>

<h2 align="center"> 📚 Stacks </h2>

<table align="center">
  <thead>
    <tr align="center">
      <th>구분</th>
      <th>기술</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Language</td>
      <td>TypeScript 6.0.3</td>
    </tr>
    <tr>
      <td>Framework</td>
      <td>React 18.3.1</td>
    </tr>
    <tr>
      <td>Build Tool</td>
      <td>Vite 8.0.14</td>
    </tr>
    <tr>
      <td>Routing</td>
      <td>React Router 7.15.1</td>
    </tr>
    <tr>
      <td>HTTP Client</td>
      <td>Axios 1.16.1</td>
    </tr>
    <tr>
      <td>Styling</td>
      <td>Tailwind CSS 4.3.0</td>
    </tr>
    <tr>
      <td>Runtime</td>
      <td>Node.js 24.13.0</td>
    </tr>
  </tbody>
</table>

<h2 align="center"> 🛠️ Features </h2>

<table align="center">
  <thead>
    <tr align="center">
      <th>기능</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>로그인 / 온보딩</td>
      <td>사용자 인증 이후 선호 스타일과 기본 프로필을 입력하는 화면을 제공합니다.</td>
    </tr>
    <tr>
      <td>홈 추천</td>
      <td>취향 기반 상품 추천, 유사 상품 추천, 옷장 기반 어울리는 옷 추천을 화면에 표시합니다.</td>
    </tr>
    <tr>
      <td>디지털 옷장</td>
      <td>보유한 옷과 미보유 관심 상품을 탭으로 구분해 조회하고 관리합니다.</td>
    </tr>
    <tr>
      <td>옷 등록</td>
      <td>사진 기반 등록과 구매내역 기반 등록 흐름을 제공합니다.</td>
    </tr>
    <tr>
      <td>프로필 / 스타일</td>
      <td>사용자 정보와 선호 스타일을 확인하고 수정하는 화면을 제공합니다.</td>
    </tr>
    <tr>
      <td>룩피드</td>
      <td>코디 기반 게시글, 좋아요, 댓글, 저장, 팔로우 기능 화면을 제공합니다.</td>
    </tr>
    <tr>
      <td>공통 상태 처리</td>
      <td>로딩, 에러, 빈 상태, 이미지 skeleton 등 공통 UI 상태를 관리합니다.</td>
    </tr>
  </tbody>
</table>

<h2 align="center"> 🧪 Local Development </h2>

<p align="center">
  이 프로젝트는 <strong>Node.js v24.13.0</strong>을 사용합니다.
</p>

```bash
nvm install
nvm use
node -v
```

<p align="center">
  레포지토리를 클론한 뒤 의존성을 설치합니다.
</p>

```bash
git clone https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_FE.git
cd AIBE5_FinalProject_Team4_FE
npm ci
```

<p align="center">
  환경변수 파일을 생성하고 백엔드 API 주소를 확인합니다.
</p>

```bash
cp .env.example .env.local
```

```text
VITE_API_BASE_URL=http://localhost:8080
```

<p align="center">
  개발 서버를 실행합니다.
</p>

```bash
npm run dev
```

<p align="center">
  브라우저에서 아래 주소로 접속합니다.
</p>

```text
http://localhost:5173
```

<p align="center">
  백엔드가 <code>localhost:8080</code>에서 실행 중이면 <code>/api/*</code> 요청이 자동으로 프록시됩니다.
</p>

<h2 align="center"> 📁 Project Structure </h2>

```text
src/
├── api/            # Axios 인스턴스 및 API 호출 함수
├── assets/         # 이미지, 폰트 등 정적 자원
├── components/     # 화면 및 재사용 컴포넌트
│   └── common/     # 공통 UI 컴포넌트
├── hooks/          # 커스텀 훅
├── pages/          # 라우트별 페이지 컴포넌트
│   └── error/      # 공통 에러 페이지
├── types/          # TypeScript 공통 타입 정의
└── utils/          # 순수 유틸리티 함수
```

<h2 align="center"> 🔗 Path Alias </h2>

<p align="center">
  <code>@/</code>는 <code>src/</code>를 가리키는 절대경로 alias입니다.
</p>

```ts
// 상대경로 대신 절대경로를 사용합니다.
import Button from '@/components/common/Button';
```

<h2 align="center"> 📜 Scripts </h2>

<table align="center">
  <thead>
    <tr align="center">
      <th>명령어</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>npm run dev</code></td>
      <td>개발 서버 실행</td>
    </tr>
    <tr>
      <td><code>npm run build</code></td>
      <td>프로덕션 빌드</td>
    </tr>
    <tr>
      <td><code>npm run lint</code></td>
      <td>ESLint 코드 검사</td>
    </tr>
    <tr>
      <td><code>npm run preview</code></td>
      <td>빌드 결과물 로컬 미리보기</td>
    </tr>
  </tbody>
</table>

<h2 align="center"> 🔐 Environment Variables </h2>

<table align="center">
  <thead>
    <tr align="center">
      <th>변수명</th>
      <th>설명</th>
      <th>예시</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>VITE_API_BASE_URL</code></td>
      <td>백엔드 API 주소</td>
      <td><code>http://localhost:8080</code></td>
    </tr>
  </tbody>
</table>

<p align="center">
  <code>VITE_</code> 접두사가 붙은 환경변수만 브라우저에서 접근할 수 있습니다.<br />
  민감한 정보에는 <code>VITE_</code> 접두사를 사용하지 않습니다.
</p>

<h2 align="center"> 🦖 "Team 우주 최강 공룡" 🚀</h2>

<table align="center">
  <tr align="center">
    <td><strong>류태우</strong></td>
    <td><strong>이석민</strong></td>
    <td><strong>김세준</strong></td>
    <td><strong>최준영</strong></td>
    <td><strong>홍가현</strong></td>
  </tr>
  <tr align="center">
    <td>
      <a href="https://github.com/taeaeuu">
        <img src="https://avatars.githubusercontent.com/u/222783261?v=4" width="120px;" alt="류태우" />
      </a>
    </td>
    <td>
      <a href="https://github.com/seokminseok">
        <img src="https://avatars.githubusercontent.com/u/183383691?v=4" width="120px;" alt="이석민" />
      </a>
    </td>
    <td>
      <a href="https://github.com/warcat12">
        <img src="https://avatars.githubusercontent.com/u/252306343?v=4" width="120px;" alt="김세준" />
      </a>
    </td>
    <td>
      <a href="https://github.com/jychoi0831">
        <img src="https://avatars.githubusercontent.com/u/252291780?v=4" width="120px;" alt="최준영" />
      </a>
    </td>
    <td>
      <a href="https://github.com/devken65">
        <img src="https://avatars.githubusercontent.com/u/71168366?v=4" width="120px;" alt="홍가현" />
      </a>
    </td>
  </tr>
  <tr align="center">
    <td><a href="https://github.com/taeaeuu">@taeaeuu</a></td>
    <td><a href="https://github.com/seokminseok">@seokminseok</a></td>
    <td><a href="https://github.com/warcat12">@warcat12</a></td>
    <td><a href="https://github.com/jychoi0831">@jychoi0831</a></td>
    <td><a href="https://github.com/devken65">@devken65</a></td>
  </tr>
  <tr align="center">
    <td>🧠 <b>팀장</b></td>
    <td>👤 <b>팀원</b></td>
    <td>👤 <b>팀원</b></td>
    <td>👤 <b>팀원</b></td>
    <td>👤 <b>팀원</b></td>
  </tr>
</table>
