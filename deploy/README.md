# deploy/

AWS(EC2 / S3 / CloudFront)에 FE 정적 파일을 올리기 위한 **템플릿**입니다.
실제 URL·버킷·키 값은 아직 없어도 파일 구조와 순서만 맞춰 두었습니다.

## 빠른 시작

```bash
cd deploy
cp env.prod.example .env          # 값 입력 (VITE_API_BASE_URL 등)
chmod +x scripts/*.sh
./scripts/build.sh                # dist/ 생성
```

배포 방식은 아래 중 하나를 선택합니다.

| 방식 | 스크립트 | 비고 |
| --- | --- | --- |
| S3 + CloudFront (권장) | `./scripts/deploy-s3.sh` | SPA 정적 호스팅 |
| EC2 + Nginx | `./scripts/deploy-ec2.sh` | BE와 같은 EC2 또는 별도 인스턴스 |

## BE와 맞출 항목

FE는 RDS·S3(DB/이미지)에 직접 연결하지 않습니다. BE `deploy/.env`와 아래만 일치하면 됩니다.

| FE (`deploy/.env`) | BE (`deploy/.env`) |
| --- | --- |
| `VITE_API_BASE_URL` | `APP_BASE_URL` (BE API 공개 URL) |
| (브라우저 접속 origin) | `FE_BASE_URL`, `CORS_ALLOWED_ORIGINS` |

상세 AWS 리소스 생성 순서: [BE docs/deploy/aws-setup.md](https://github.com/prgrms-aibe-devcourse/AIBE5_FinalProject_Team4_BE/blob/develop/docs/deploy/aws-setup.md)

## 파일

| 파일 | 설명 |
| --- | --- |
| `env.prod.example` | 빌드·배포용 `.env` 템플릿 (`.env`는 gitignore) |
| `nginx.conf.example` | EC2 Nginx SPA 설정 예시 |
| `scripts/build.sh` | `deploy/.env` 로드 후 `npm run build` |
| `scripts/deploy-s3.sh` | `dist/` → S3 sync (+ CloudFront invalidation) |
| `scripts/deploy-ec2.sh` | `dist/` → EC2 rsync |

## EC2 + Nginx (스켈레톤)

1. EC2에 Nginx 설치
2. `nginx.conf.example`을 `/etc/nginx/conf.d/closetnangam.conf` 등으로 복사 후 `server_name`, `root` 수정
3. `deploy/.env`에 `EC2_*` 입력 후 `./scripts/deploy-ec2.sh`

## S3 + CloudFront (스켈레톤)

1. FE 전용 S3 버킷 생성 (정적 웹 호스팅 또는 CloudFront origin)
2. CloudFront에서 SPA fallback (`403/404` → `/index.html`) 설정
3. `deploy/.env`에 `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` 입력
4. 로컬 또는 CI에서 AWS CLI 프로필 설정 후 `./scripts/deploy-s3.sh`

## 주의

- `deploy/.env`, `.env.production`은 Git에 올리지 않습니다.
- `VITE_*` 변수는 **빌드 시점**에 번들에 포함됩니다. API URL 변경 시 반드시 재빌드·재배포합니다.
- 로컬 개발은 루트 `.env.local` + `npm run dev`를 사용합니다.
