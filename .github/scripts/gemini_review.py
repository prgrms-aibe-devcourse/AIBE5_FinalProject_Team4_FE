import os
import json
import urllib.request
import urllib.error
import sys
import time

# diff 읽기
with open("pr_diff.txt", "r") as f:
    diff = f.read().strip()

if not diff:
    print("변경된 파일이 없습니다.")
    sys.exit(0)

# diff 크기 제한
MAX_SIZE = 28000
truncated = False
if len(diff) > MAX_SIZE:
    diff = diff[:MAX_SIZE]
    truncated = True

api_key = os.environ["GEMINI_API_KEY"]

MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]

truncated_notice = "\n> ⚠️ diff가 너무 커서 일부만 리뷰했습니다." if truncated else ""

prompt = f"""당신은 숙련된 시니어 프론트엔드 개발자입니다. 아래 PR diff를 코드 리뷰해주세요.

프로젝트 기술 스택: React 18, TypeScript 6, Vite 8, Tailwind CSS 4, React Router v7, Axios

리뷰 기준:
🔴 높음 (반드시 수정)
- API 키, 토큰 등 민감 정보 하드코딩
- XSS 취약점 (dangerouslySetInnerHTML 무분별한 사용 등)
- useEffect 의존성 배열 누락으로 인한 무한 렌더링 위험
- any 타입 무분별한 사용

🟡 중간 (수정 권장)
- useState 과도한 분산 (useReducer 또는 상태 통합 고려)
- props drilling 3단계 이상
- 컴포넌트 단일 책임 원칙 위반 (200줄 초과 등)
- 불필요한 리렌더링 (useMemo, useCallback 미사용)
- 비동기 처리 누락 (로딩/에러 상태 없음)

🟢 낮음 (참고)
- 네이밍 컨벤션 (컴포넌트 PascalCase, 함수 camelCase)
- 절대경로(@/) 미사용
- 주석 없는 복잡한 로직

팀원들이 주니어 개발자이므로 왜 문제인지, 어떻게 고쳐야 하는지 친절하게 설명해주세요.
한국어 마크다운으로 작성하고, 칭찬할 부분도 함께 언급해주세요.
마지막에 APPROVE / NEEDS_CHANGES / CRITICAL 중 하나로 종합 판정을 내려주세요.

PR Diff:
```
{diff}
```
{truncated_notice}
"""

payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 3000},
}

review_text = None

for model in MODELS:
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    url = f"{base_url}/{model}:generateContent?key={api_key}"
    print(f"🔄 모델 시도: {model}")

    for attempt in range(3):
        try:
            if attempt == 0:
                time.sleep(5)

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read())
            review_text = result["candidates"][0]["content"]["parts"][0]["text"]
            print(f"✅ 성공 — 모델: {model}, 시도: {attempt + 1}회")
            break

        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 20 * (2 ** attempt)  # 20s, 40s, 80s
                print(f"⚠️ 429 — {wait}초 대기 후 재시도 ({attempt + 1}/3)")
                time.sleep(wait)
            else:
                print(f"❌ HTTP {e.code}: {e.reason}")
                break

    if review_text:
        break

if not review_text:
    print("❌ 모든 모델 시도 실패.")
    sys.exit(1)

# PR 코멘트 등록
gh_token = os.environ["GH_TOKEN"]
repo = os.environ["GITHUB_REPOSITORY"]
pr_number = os.environ["PR_NUMBER"]

comment_body = (
    "## 🤖 Gemini 코드 리뷰\n\n"
    + review_text
    + "\n\n---\n*이 리뷰는 Gemini AI가 자동으로 작성했습니다. 참고용으로만 활용하세요.*"
)

comment_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
req = urllib.request.Request(
    comment_url,
    data=json.dumps({"body": comment_body}).encode(),
    headers={
        "Authorization": f"Bearer {gh_token}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json",
    },
)
with urllib.request.urlopen(req) as resp:
    print(f"✅ 코드 리뷰 코멘트 등록 완료 (HTTP {resp.status})")
