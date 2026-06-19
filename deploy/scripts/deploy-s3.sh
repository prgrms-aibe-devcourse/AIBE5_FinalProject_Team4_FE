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

if [[ -z "${S3_BUCKET:-}" ]]; then
  echo "S3_BUCKET 이 비어 있습니다. deploy/.env 를 확인하세요."
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI(aws)가 필요합니다."
  exit 1
fi

"$ROOT_DIR/deploy/scripts/build.sh"

AWS_REGION="${AWS_REGION:-ap-northeast-2}"
export AWS_DEFAULT_REGION="$AWS_REGION"

echo "S3 sync: s3://${S3_BUCKET}/"
aws s3 sync "$ROOT_DIR/dist/" "s3://${S3_BUCKET}/" --delete

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
  echo "CloudFront invalidation: ${CLOUDFRONT_DISTRIBUTION_ID}"
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"
fi

echo "S3 배포 완료."
