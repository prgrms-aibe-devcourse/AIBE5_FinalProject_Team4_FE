/** API `brandName`만으로 로고를 매칭합니다. (별도 brandLogoUrl 필드 없음) */

/** 신성통상(굿웨어몰) 공식 브랜드 아이콘 CDN — imgp.topten10mall.com 은 404 */
const sstBrandIcon = (slug: string) =>
  `https://img.goodwearmall.com/ost/system/brand/icon/${slug}.png`

/** favicon보다 선명한 공식 PNG가 있는 브랜드 */
const BRAND_LOGO_URLS: Record<string, string> = {
  TOPTEN: sstBrandIcon('topten'),
  TOPTEN10: sstBrandIcon('topten'),
  'TOP TEN': sstBrandIcon('topten'),
  탑텐: sstBrandIcon('topten'),
  탑텐10: sstBrandIcon('topten'),
  TOPTENKIDS: sstBrandIcon('toptenkids'),
  'TOPTEN KIDS': sstBrandIcon('toptenkids'),
  탑텐키즈: sstBrandIcon('toptenkids'),
  POLHAM: sstBrandIcon('polham'),
  폴햄: sstBrandIcon('polham'),
  POLHAMKIDS: sstBrandIcon('polhamkids'),
  'POLHAM KIDS': sstBrandIcon('polhamkids'),
  폴햄키즈: sstBrandIcon('polhamkids'),
  OLZEN: sstBrandIcon('olzen'),
  올젠: sstBrandIcon('olzen'),
  ANDZ: sstBrandIcon('andz'),
  앤드지: sstBrandIcon('andz'),
  ZIOZIA: sstBrandIcon('ziozia'),
  지오지아: sstBrandIcon('ziozia'),
  PROJECTM: sstBrandIcon('projectm'),
  'PROJECT M': sstBrandIcon('projectm'),
  프로젝트엠: sstBrandIcon('projectm'),
  EDITION: sstBrandIcon('edition'),
}

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
  DIOR: 'dior.com',
  디올: 'dior.com',
  BRUNELLOCUCINELLI: 'brunellocucinelli.com',
  'BRUNELLO CUCINELLI': 'brunellocucinelli.com',
  브루넬로쿠치넬리: 'brunellocucinelli.com',
  THEROW: 'therow.com',
  'THE ROW': 'therow.com',
  더로우: 'therow.com',
  GUESS: 'guess.com',
  게스: 'guess.com',
  STONEISLAND: 'stoneisland.com',
  'STONE ISLAND': 'stoneisland.com',
  스톤아일랜드: 'stoneisland.com',
  BENETTON: 'benetton.com',
  베네통: 'benetton.com',
  ROCKPORT: 'rockport.com',
  락포트: 'rockport.com',
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
  TOPTEN10: 'topten10mall.com',
  'TOP TEN': 'topten10mall.com',
  탑텐: 'topten10mall.com',
  탑텐10: 'topten10mall.com',
  TOPTENKIDS: 'topten10mall.com',
  'TOPTEN KIDS': 'topten10mall.com',
  탑텐키즈: 'topten10mall.com',
  POLHAM: 'polham.co.kr',
  폴햄: 'polham.co.kr',
  POLHAMKIDS: 'polham.co.kr',
  'POLHAM KIDS': 'polham.co.kr',
  폴햄키즈: 'polham.co.kr',
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
  // LF·신성·대현·기타 국내 패션 (DB 상위 브랜드)
  HAZZYS: 'hazzys.com',
  헤지스: 'hazzys.com',
  SHEMISS: 'shesmiss.com',
  'SHES MISS': 'shesmiss.com',
  "SHE'S MISS": 'shesmiss.com',
  쉬즈미스: 'shesmiss.com',
  ITMICHAA: 'itmichaa.com',
  'IT MICHAA': 'itmichaa.com',
  잇미샤: 'itmichaa.com',
  OLIVEDESOLIVE: 'odoi.co.kr',
  'OLIVE DES OLIVE': 'odoi.co.kr',
  올리브데올리브: 'odoi.co.kr',
  LIST: 'list.co.kr',
  리스트: 'list.co.kr',
  TANDY: 'tandy.co.kr',
  탠디: 'tandy.co.kr',
  CCCOLLECT: 'daehyuninside.com',
  'CC COLLECT': 'daehyuninside.com',
  씨씨콜렉트: 'daehyuninside.com',
  PROJECTM: 'projectm.co.kr',
  프로젝트엠: 'projectm.co.kr',
  GENERALIDEA: 'generalidea.co.kr',
  'GENERAL IDEA': 'generalidea.co.kr',
  제너럴아이디어: 'generalidea.co.kr',
  MINDBRIDGE: 'mindbridge.co.kr',
  'MIND BRIDGE': 'mindbridge.co.kr',
  마인드브릿지: 'mindbridge.co.kr',
  ELCANTO: 'elcanto.co.kr',
  'EL CANTO': 'elcanto.co.kr',
  엘칸토: 'elcanto.co.kr',
  MISOPE: 'misope.co.kr',
  미소페: 'misope.co.kr',
  SISLEY: 'sisley.co.kr',
  시슬리: 'sisley.co.kr',
  BABARA: 'babara.co.kr',
  BUCKAROO: 'buckaroo.co.kr',
  버커루: 'buckaroo.co.kr',
  ZOOC: 'zooc.co.kr',
  JJJIGOTT: 'jjjigott.com',
  'JJ JIGOTT': 'jjjigott.com',
  JJ지고트: 'jjjigott.com',
  LEE: 'lee.co.kr',
  DEWL: 'dewl.co.kr',
  듀엘: 'dewl.co.kr',
  DAKS: 'daks.co.kr',
  닥스: 'daks.co.kr',
  SODA: 'soda.co.kr',
  소다: 'soda.co.kr',
  BELLISIMO: 'bellisimo.co.kr',
  벨리시앙: 'bellisimo.co.kr',
  THEEDGE: 'lfmall.co.kr',
  'THE EDGE': 'lfmall.co.kr',
  더엣지: 'lfmall.co.kr',
  OLIVIALOREN: 'olivialoren.co.kr',
  'OLIVIA LOREN': 'olivialoren.co.kr',
  올리비아로렌: 'olivialoren.co.kr',
  DUNST: 'dunst.co.kr',
  던스트: 'dunst.co.kr',
  NINESIXNY: 'ninesixny.com',
  'NINE SIX NY': 'ninesixny.com',
  'NINE SIX NEW YORK': 'ninesixny.com',
  나인식스뉴욕: 'ninesixny.com',
  PLAIN: 'plain.co.kr',
  프렐린: 'plain.co.kr',
  GUYROVER: 'guyrover.co.kr',
  가이거: 'guyrover.co.kr',
  UNDERARMOUR: 'underarmour.com',
  'UNDER ARMOUR': 'underarmour.com',
  언더아머: 'underarmour.com',
  DESCENTE: 'descente.com',
  데상트: 'descente.com',
  MIZUNO: 'mizuno.com',
  미즈노: 'mizuno.com',
  COVERNAT: 'covernat.co.kr',
  커버낫: 'covernat.co.kr',
  MAISONKITSUNE: 'maisonkitsune.com',
  'MAISON KITSUNE': 'maisonkitsune.com',
  메종키츠네: 'maisonkitsune.com',
  OFFWHITE: 'off---white.com',
  'OFF-WHITE': 'off---white.com',
  'OFF WHITE': 'off---white.com',
  오프화이트: 'off---white.com',
  MONCLER: 'moncler.com',
  몽클레어: 'moncler.com',
  CANADAGOOSE: 'canadagoose.com',
  'CANADA GOOSE': 'canadagoose.com',
  캐나다구스: 'canadagoose.com',
  MOOSEKNUCKLES: 'mooseknuckles.com',
  'MOOSE KNUCKLES': 'mooseknuckles.com',
  무스너클: 'mooseknuckles.com',
  WOOYOUNGMI: 'wooyoungmi.com',
  우영미: 'wooyoungmi.com',
  TOMFORD: 'tomford.com',
  'TOM FORD': 'tomford.com',
  톰포드: 'tomford.com',
  CPCompany: 'cpcompany.com',
  'CP COMPANY': 'cpcompany.com',
  CP컴퍼니: 'cpcompany.com',
  ERNO: 'herno.com',
  에르노: 'herno.com',
  PROSPECS: 'prospecs.com',
  프로스펙스: 'prospecs.com',
  AIDER: 'eider.co.kr',
  아이더: 'eider.co.kr',
  MONBELL: 'montbell.co.kr',
  몽벨: 'montbell.co.kr',
  SACAI: 'sacai.jp',
  ARCTERYX: 'arcteryx.com',
  'ARC TERYX': 'arcteryx.com',
  아크테릭스: 'arcteryx.com',
  SALOMON: 'salomon.com',
  살로몬: 'salomon.com',
  BOSS: 'hugoboss.com',
  휴고보스: 'hugoboss.com',
  HUGOBoss: 'hugoboss.com',
  'HUGO BOSS': 'hugoboss.com',
}

function normalizeBrandKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.'\-&]/g, '')
}

function resolveBrandLogoUrl(brandName: string): string | null {
  const trimmed = brandName.trim()
  if (!trimmed) return null

  const direct =
    BRAND_LOGO_URLS[trimmed]
    ?? BRAND_LOGO_URLS[trimmed.toUpperCase()]
    ?? BRAND_LOGO_URLS[normalizeBrandKey(trimmed)]
  if (direct) return direct

  const normalized = normalizeBrandKey(trimmed)
  for (const [key, logoUrl] of Object.entries(BRAND_LOGO_URLS)) {
    if (normalizeBrandKey(key) === normalized) return logoUrl
  }

  return null
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

  const logoUrl = resolveBrandLogoUrl(trimmed)
  if (logoUrl) return logoUrl

  const domain = resolveBrandLogoDomain(trimmed)
  if (!domain) return null

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
