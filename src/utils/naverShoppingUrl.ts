const INVALID_EXTERNAL_URL = new Set(['', 'NONE', 'none'])

function isValidExternalProductUrl(url: string | null | undefined): url is string {
  if (!url || INVALID_EXTERNAL_URL.has(url.trim())) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/** 상품 상세 URL 우선, 없으면 네이버쇼핑 검색으로 fallback */
export function resolveNaverShoppingPurchaseUrl(
  productName: string,
  externalProductUrl?: string | null,
): string {
  if (isValidExternalProductUrl(externalProductUrl)) {
    return externalProductUrl
  }

  const query = productName.trim()
  if (!query) {
    return 'https://shopping.naver.com/'
  }

  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}`
}

export function isDirectNaverProductUrl(
  externalProductUrl?: string | null,
): boolean {
  return isValidExternalProductUrl(externalProductUrl)
}
