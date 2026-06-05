export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export const MAX_GARMENT_IMAGE_BYTES = 10 * 1024 * 1024

export function validateGarmentImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const extOk =
      ext &&
      ALLOWED_IMAGE_EXTENSIONS.some((allowed) =>
        allowed.replace('.', '') === ext,
      )
    if (!extOk) {
      return 'jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.'
    }
  }

  if (file.size > MAX_GARMENT_IMAGE_BYTES) {
    return '이미지 용량은 10MB 이하여야 합니다.'
  }

  if (file.size === 0) {
    return '빈 파일은 업로드할 수 없습니다.'
  }

  return null
}
