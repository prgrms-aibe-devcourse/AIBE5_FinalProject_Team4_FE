/** API `brandName`만으로 로고를 매칭합니다. (별도 brandLogoUrl 필드 없음) */
const BRAND_LOGO_DOMAINS: Record<string, string> = {
  // 글로벌
  NIKE: 'nike.com',
  나이키: 'nike.com',
  ADIDAS: 'adidas.com',
  아디다스: 'adidas.com',
  NEWBALANCE: 'newbalance.com',
  'NEW BALANCE': 'newbalance.com',
  뉴발란스: 'newbalance.com',
  CONVERSE: 'converse.com',
  컨버스: 'converse.com',
  PUMA: 'puma.com',
  푸마: 'puma.com',
  VANS: 'vans.com',
  반스: 'vans.com',
  REEBOK: 'reebok.com',
  리복: 'reebok.com',
  ASICS: 'asics.com',
  아식스: 'asics.com',
  FILA: 'fila.com',
  휠라: 'fila.com',
  ZARA: 'zara.com',
  자라: 'zara.com',
  UNIQLO: 'uniqlo.com',
  유니클로: 'uniqlo.com',
  HM: 'hm.com',
  'H&M': 'hm.com',
  GAP: 'gap.com',
  갭: 'gap.com',
  LEVIS: 'levi.com',
  "LEVI'S": 'levi.com',
  리바이스: 'levi.com',
  CALVINKLEIN: 'calvinklein.com',
  'CALVIN KLEIN': 'calvinklein.com',
  캘빈클라인: 'calvinklein.com',
  LACOSTE: 'lacoste.com',
  라코스테: 'lacoste.com',
  RALPHLAUREN: 'ralphlauren.com',
  'RALPH LAUREN': 'ralphlauren.com',
  폴로: 'ralphlauren.com',
  TOMMYHILFIGER: 'tommy.com',
  'TOMMY HILFIGER': 'tommy.com',
  탐미힐피거: 'tommy.com',
  THENORTHFACE: 'thenorthface.com',
  'THE NORTH FACE': 'thenorthface.com',
  노스페이스: 'thenorthface.com',
  COLUMBIA: 'columbia.com',
  컬럼비아: 'columbia.com',
  PATAGONIA: 'patagonia.com',
  파타고니아: 'patagonia.com',
  CHAMPION: 'champion.com',
  챔피온: 'champion.com',
  SUPREME: 'supreme.com',
  슈프림: 'supreme.com',
  STUSSY: 'stussy.com',
  스투시: 'stussy.com',
  CARHARTT: 'carhartt.com',
  칼하트: 'carhartt.com',
  BIRKENSTOCK: 'birkenstock.com',
  버켄스탁: 'birkenstock.com',
  CROCS: 'crocs.com',
  크록스: 'crocs.com',
  TIMBERLAND: 'timberland.com',
  팀버랜드: 'timberland.com',
  DRmartens: 'drmartens.com',
  'DR.MARTENS': 'drmartens.com',
  닥터마틴: 'drmartens.com',
  GUCCI: 'gucci.com',
  구찌: 'gucci.com',
  PRADA: 'prada.com',
  프라다: 'prada.com',
  BURBERRY: 'burberry.com',
  버버리: 'burberry.com',
  COACH: 'coach.com',
  코치: 'coach.com',
  MICHAELKORS: 'michaelkors.com',
  'MICHAEL KORS': 'michaelkors.com',
  // 국내·플랫폼
  MUSINSA: 'musinsa.com',
  무신사: 'musinsa.com',
  MUSINSASTANDARD: 'musinsa.com',
  'MUSINSA STANDARD': 'musinsa.com',
  SPAO: 'spao.com',
  스파오: 'spao.com',
  GIORDANO: 'giordano.co.kr',
  지오다노: 'giordano.co.kr',
  EIGHTSECONDS: '8seconds.co.kr',
  '8SECONDS': '8seconds.co.kr',
  에잇세컨즈: '8seconds.co.kr',
  WHOAU: 'whoau.co.kr',
  후아유: 'whoau.co.kr',
  TOPTEN: 'topten10mall.com',
  탑텐: 'topten10mall.com',
  BEANPOLE: 'beanpole.com',
  빈폴: 'beanpole.com',
  KOLONSPORT: 'kolonsport.com',
  'KOLON SPORT': 'kolonsport.com',
  코오롱스포츠: 'kolonsport.com',
  DISCOVERY: 'discovery-expedition.com',
  'DISCOVERY EXPEDITION': 'discovery-expedition.com',
  디스커버리: 'discovery-expedition.com',
  NEPA: 'nepa.co.kr',
  네파: 'nepa.co.kr',
  BLACKYAK: 'byn.kr',
  'BLACK YAK': 'byn.kr',
  블랙야크: 'byn.kr',
  K2: 'k2korea.com',
  NATIONALGEOGRAPHIC: 'nationalgeographic.co.kr',
  'NATIONAL GEOGRAPHIC': 'nationalgeographic.co.kr',
  내셔널지오그래픽: 'nationalgeographic.co.kr',
  MCM: 'mcmworldwide.com',
  STUDIOTOMBOY: 'studiotomboy.com',
  'STUDIO TOMBOY': 'studiotomboy.com',
  LIE: 'lie.co.kr',
  라이: 'lie.co.kr',
  MIXXO: 'mixxo.com',
  미쏘: 'mixxo.com',
  ROEM: 'roem.com',
  로엠: 'roem.com',
  ZIOZIA: 'ziozia.com',
  지오지아: 'ziozia.com',
  TMAKER: 'tmaker.co.kr',
  'T MAKER': 'tmaker.co.kr',
  ANDZ: 'andz.co.kr',
  앤드지: 'andz.co.kr',
  OLZEN: 'olzen.co.kr',
  올젠: 'olzen.co.kr',
  LLOYDM: 'lloydm.co.kr',
  로드마스터: 'lloydm.co.kr',
}

function normalizeBrandKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.'\-&]/g, '')
}

function resolveBrandLogoDomain(brandName: string): string | null {
  const trimmed = brandName.trim()
  if (!trimmed) return null

  const direct =
    BRAND_LOGO_DOMAINS[trimmed]
    ?? BRAND_LOGO_DOMAINS[trimmed.toUpperCase()]
    ?? BRAND_LOGO_DOMAINS[normalizeBrandKey(trimmed)]
  if (direct) return direct

  const normalized = normalizeBrandKey(trimmed)
  for (const [key, domain] of Object.entries(BRAND_LOGO_DOMAINS)) {
    if (normalizeBrandKey(key) === normalized) return domain
  }

  return null
}

export function formatRecommendBrandLabel(brandName?: string | null): string {
  const trimmed = (brandName ?? '').trim()
  if (!trimmed || trimmed.toUpperCase() === 'UNKNOWN') {
    return '보세'
  }
  return trimmed
}

export function getBrandLogoUrl(brandName?: string | null): string | null {
  const trimmed = (brandName ?? '').trim()
  if (!trimmed || trimmed.toUpperCase() === 'UNKNOWN') {
    return null
  }

  const domain = resolveBrandLogoDomain(trimmed)
  if (!domain) return null

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
