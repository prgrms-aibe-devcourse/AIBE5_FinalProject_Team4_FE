#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/deploy/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "deploy/.env 가 없습니다. cp deploy/env.prod.example deploy/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for var in EC2_HOST EC2_USER EC2_DEPLOY_PATH EC2_SSH_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "${var} 이 비어 있습니다. deploy/.env 를 확인하세요."
    exit 1
  fi
done

if [[ ! -f "$EC2_SSH_KEY" ]]; then
  echo "EC2_SSH_KEY 파일을 찾을 수 없습니다: $EC2_SSH_KEY"
  exit 1
fi

"$ROOT_DIR/deploy/scripts/build.sh"

SSH_OPTS=(-i "$EC2_SSH_KEY" -o StrictHostKeyChecking=accept-new)
REMOTE="${EC2_USER}@${EC2_HOST}:${EC2_DEPLOY_PATH}/"

echo "rsync → ${REMOTE}"
rsync -avz --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT_DIR/dist/" \
  "$REMOTE"

echo "EC2 배포 완료. Nginx root 가 ${EC2_DEPLOY_PATH} 인지 확인하세요."
