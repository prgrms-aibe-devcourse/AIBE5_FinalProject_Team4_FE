#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "deploy/.env 가 없습니다."
  echo "  cp deploy/env.prod.example deploy/.env"
  echo "  # 값 입력 후 다시 실행"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${VITE_API_BASE_URL:-}" ]]; then
  echo "VITE_API_BASE_URL 이 비어 있습니다. deploy/.env 를 확인하세요."
  exit 1
fi

cd "$ROOT_DIR"
npm ci
npm run build

echo "빌드 완료: $ROOT_DIR/dist/"
echo "  VITE_API_BASE_URL=$VITE_API_BASE_URL"
