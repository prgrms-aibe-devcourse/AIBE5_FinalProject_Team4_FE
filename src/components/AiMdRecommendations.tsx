import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
  fetchAiMdOutfits,
  fetchAiMdProducts,
  fetchAiMds,
  saveAiMdOutfit,
  toAiMdOutfitSaveRequest,
} from '@/api/aiMd'
import { postRecommendationFeedback } from '@/api/recommendations'
import { connectWishlistClothes, createWishlistClothes } from '@/api/wardrobe'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import ExitConfirmModal from '@/components/common/ExitConfirmModal'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Check, ChevronLeft, ChevronRight, Heart, Sparkles, X } from '@/components/icons'
import RecommendProductDetailModal from '@/components/RecommendProductDetailModal'
import {
  BE_CATEGORY_TO_UI,
  CATEGORY_ITEM_TYPES,
  type BeCategoryCode,
} from '@/data/categoryItemTypes'
import type { ClothesGender } from '@/data/garmentGender'
import { GARMENT_COLORS, getGarmentColor, getGarmentColorLabel } from '@/data/garmentColors'
import { GARMENT_STYLES, getGarmentStyleLabel } from '@/data/garmentStyles'
import type {
  AiMd,
  AiMdId,
  AiMdOutfitRecommendation,
  AiMdProductRecommendation,
} from '@/types/aiMd'
import type { OutfitModalItem } from '@/components/OutfitDetailModal'
import type { NaverShoppingProduct, SimilarProductSaveForm } from '@/types/similarProducts'
import type { Garment } from '@/types'
import type { UserGender } from '@/utils/genderClothesFilter'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'
import { useToast } from './Toast'

interface AiMdRecommendationsProps {
  userId: number | null
  gender: UserGender
  existingGarments: Garment[]
  onWishlistAdded?: () => void
  onOutfitOpen?: (combination: {
    top?: OutfitModalItem | null
    bottom?: OutfitModalItem | null
    outer?: OutfitModalItem | null
    shoes?: OutfitModalItem | null
    weatherLabel?: string
    bookId?: number | null
    title?: string
    description?: string
    situation?: string
    season?: string
    saveDisabledMessage?: string
    saveOverride?: () => Promise<void>
    saveSuccessMessage?: string
    saveButtonLabel?: string
    hideFavoriteAction?: boolean
  }) => void
}

type RecommendationMode = 'outfits' | 'products'

const MAX_AI_MD_PRODUCTS = 40

const AI_MD_CHARACTER_IMAGES = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/ai-md/*.png', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, src]) => [
    path.split('/').pop()?.replace(/\.png$/, ''),
    src,
  ]),
) as Partial<Record<AiMdId, string>>

const seasonOptions = [
  { code: '', label: '선택 안 함' },
  { code: 'SPRING', label: '봄' },
  { code: 'SUMMER', label: '여름' },
  { code: 'FALL', label: '가을' },
  { code: 'WINTER', label: '겨울' },
]

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim()

const productKey = (product: NaverShoppingProduct) =>
  product.candidateSource === 'INTERNAL' && product.clothesId != null
    ? `internal-${product.clothesId}`
    : `naver-${product.productId || product.link}`

const isAlreadySavedError = (reason: unknown) =>
  axios.isAxiosError(reason) && reason.response?.status === 409

function inferCategory(product: NaverShoppingProduct): BeCategoryCode {
  const text = [
    product.title,
    product.category2,
    product.category3,
    product.category4,
  ].join(' ')

  if (/신발|운동화|스니커즈|로퍼|부츠|샌들|슬리퍼|구두/.test(text)) return 'SHOES'
  if (/바지|팬츠|데님|슬랙스|스커트|치마|반바지/.test(text)) return 'BOTTOM'
  if (/아우터|재킷|자켓|점퍼|코트|패딩|블레이저|가디건/.test(text)) return 'OUTER'
  return 'TOP'
}

function colorCodeToChip(code: string): RecommendColorChip {
  return {
    label: getGarmentColorLabel(code),
    hex: getGarmentColor(code)?.hex,
  }
}

function uniqueSecondaryColors(
  primary: RecommendColorChip | undefined,
  colors: RecommendColorChip[],
): RecommendColorChip[] {
  const seen = new Set<string>()
  if (primary) seen.add(primary.label)
  return colors.filter((color) => {
    const key = color.label
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function inferProductColors(product: NaverShoppingProduct): RecommendColorChip[] {
  const text = `${product.title} ${product.category3} ${product.category4}`
  const colorPatterns: Array<[RegExp, string]> = [
    [/핑크|PINK/i, 'PINK'],
    [/레드|빨강|RED/i, 'RED'],
    [/오렌지|ORANGE/i, 'ORANGE'],
    [/베이지|BEIGE/i, 'BEIGE'],
    [/옐로우|노랑|YELLOW/i, 'YELLOW'],
    [/그린|초록|GREEN/i, 'GREEN'],
    [/라이트.?블루|소라|LIGHT.?BLUE/i, 'LIGHT_BLUE'],
    [/네이비|NAVY/i, 'NAVY'],
    [/퍼플|보라|PURPLE/i, 'PURPLE'],
    [/브라운|갈색|BROWN/i, 'BROWN'],
    [/그레이|회색|GRAY/i, 'GRAY'],
    [/화이트|흰색|WHITE/i, 'WHITE'],
    [/블랙|검정|BLACK/i, 'BLACK'],
  ]
  const codes = colorPatterns
    .filter(([pattern]) => pattern.test(text))
    .map(([, code]) => code)
  return (codes.length ? codes : ['BLACK']).map(colorCodeToChip)
}

function mapAiMdProductToCard(
  item: AiMdProductRecommendation,
  styles: string[] = [],
  color?: RecommendColorChip,
  secondaryColors: RecommendColorChip[] = [],
): RecommendCardItem {
  const { product } = item
  const category = inferCategory(product)
  const uiCategory = BE_CATEGORY_TO_UI[category]
  const itemTypeLabel = product.category4 || product.category3 || CATEGORY_ITEM_TYPES[uiCategory][0].label
  const brandLabel = product.brand || product.mallName || (
    product.candidateSource === 'INTERNAL' ? '서비스 상품' : '네이버쇼핑'
  )
  const showProductMetadata = product.candidateSource !== 'NAVER'

  return {
    id: productKey(product),
    clothesId: product.clothesId,
    title: stripHtml(product.title),
    brandLabel,
    brandLogoUrl: null,
    category: uiCategory,
    categoryLabel: category === 'TOP'
      ? '상의'
      : category === 'BOTTOM'
        ? '하의'
        : category === 'OUTER'
          ? '아우터'
          : '신발',
    itemTypeCode: product.category4 || product.category3 || CATEGORY_ITEM_TYPES[uiCategory][0].code,
    itemTypeLabel,
    style: showProductMetadata ? styles[0] ?? '—' : '—',
    styles: showProductMetadata ? styles : [],
    color: showProductMetadata ? color?.label ?? '—' : '—',
    colorHex: showProductMetadata ? color?.hex : undefined,
    secondaryColors: showProductMetadata ? secondaryColors : [],
    matchRate: 0,
    imageUrl: product.image,
    reason: item.reason,
    purchaseUrl: product.link,
    hasDirectPurchaseUrl: product.link.trim().length > 0,
  }
}

function createProductSaveForm(
  product: NaverShoppingProduct,
  gender: UserGender,
  md: AiMd,
): SimilarProductSaveForm {
  const category = inferCategory(product)
  return {
    category,
    itemType: CATEGORY_ITEM_TYPES[BE_CATEGORY_TO_UI[category]][0].code,
    gender: (gender === 'Male'
      ? 'MALE'
      : gender === 'Female'
        ? 'FEMALE'
        : 'UNISEX') as ClothesGender,
    primaryColor: 'BLACK',
    styles: md.styleCodes.length ? md.styleCodes : ['CASUAL'],
    size: 'FREE',
    season: '',
  }
}

function outfitKey(outfit: AiMdOutfitRecommendation, index: number) {
  return `${index}-${outfit.title}`
}

function categoryToRole(category: string | null | undefined): 'top' | 'bottom' | 'outer' | 'shoes' {
  const value = (category ?? '').toUpperCase()
  if (value === 'BOTTOM') return 'bottom'
  if (value === 'OUTER') return 'outer'
  if (value === 'SHOES') return 'shoes'
  return 'top'
}

function AiMdLoadingSpinner({
  message,
  subMessage,
}: {
  message: string
  subMessage?: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-[#111827] animate-spin" />
      <p className="mt-5 text-sm font-black text-slate-900">{message}</p>
      {subMessage ? (
        <p className="mt-2 text-xs font-bold text-slate-400">{subMessage}</p>
      ) : null}
    </div>
  )
}

export default function AiMdRecommendations({
  userId,
  gender,
  existingGarments,
  onWishlistAdded,
  onOutfitOpen,
}: AiMdRecommendationsProps) {
  const { showToast } = useToast() || { showToast: () => {} }
  const [mds, setMds] = useState<AiMd[]>([])
  const [selectedMdId, setSelectedMdId] = useState<AiMdId | null>(null)
  const [mode, setMode] = useState<RecommendationMode>('outfits')
  const [mdLoading, setMdLoading] = useState(true)
  const [mdError, setMdError] = useState<string | null>(null)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [showRecommendCancelConfirm, setShowRecommendCancelConfirm] = useState(false)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [outfits, setOutfits] = useState<AiMdOutfitRecommendation[]>([])
  const [products, setProducts] = useState<AiMdProductRecommendation[]>([])
  const [selectedOutfits, setSelectedOutfits] = useState<Set<string>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [savedProductKeys, setSavedProductKeys] = useState<Set<string>>(new Set())
  const [savedOutfits, setSavedOutfits] = useState<Set<string>>(new Set())
  const [savingOutfits, setSavingOutfits] = useState(false)
  const [detailProduct, setDetailProduct] = useState<AiMdProductRecommendation | null>(null)
  const [saveForm, setSaveForm] = useState<SimilarProductSaveForm | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [savingProducts, setSavingProducts] = useState(false)
  const [feedbackSubmittingKey, setFeedbackSubmittingKey] = useState<string | null>(null)
  const mdCarouselRef = useRef<HTMLDivElement | null>(null)
  const recommendRequestIdRef = useRef(0)

  const selectedMd = useMemo(
    () => mds.find((md) => md.id === selectedMdId) ?? null,
    [mds, selectedMdId],
  )
  const selectedMdIndex = useMemo(
    () => mds.findIndex((md) => md.id === selectedMdId),
    [mds, selectedMdId],
  )

  const chosenOutfits = useMemo(
    () =>
      outfits
        .map((outfit, index) => ({ outfit, key: outfitKey(outfit, index) }))
        .filter(({ key }) => selectedOutfits.has(key)),
    [outfits, selectedOutfits],
  )

  const chosenProducts = useMemo(
    () =>
      products.filter(({ product }) =>
        selectedProducts.has(productKey(product)) &&
        !savedProductKeys.has(productKey(product)),
      ),
    [products, savedProductKeys, selectedProducts],
  )

  const chosenNaverProducts = useMemo(
    () => chosenProducts.filter(({ product }) => product.candidateSource === 'NAVER'),
    [chosenProducts],
  )

  const existingOwnedProductKeys = useMemo(
    () =>
      new Set(
        existingGarments
          .filter((garment) => !garment.isWishlist && garment.productCode)
          .map((garment) => garment.productCode as string),
      ),
    [existingGarments],
  )

  const existingWishlistProductKeys = useMemo(
    () =>
      new Set(
        existingGarments
          .filter((garment) => garment.isWishlist && garment.productCode)
          .map((garment) => garment.productCode as string),
      ),
    [existingGarments],
  )

  const getProductStorageStatus = (
    product: NaverShoppingProduct,
  ): 'owned' | 'saved' | null => {
    const key = productKey(product)
    if (product.candidateSource === 'INTERNAL' && product.clothesId != null) {
      const clothesId = String(product.clothesId)
      if (existingGarments.some((garment) => !garment.isWishlist && garment.id === clothesId)) {
        return 'owned'
      }
      if (
        savedProductKeys.has(key) ||
        existingGarments.some((garment) => garment.isWishlist && garment.id === clothesId)
      ) {
        return 'saved'
      }
      return null
    }
    if (product.productId && existingOwnedProductKeys.has(product.productId)) {
      return 'owned'
    }
    if (
      savedProductKeys.has(key) ||
      Boolean(
        product.productId &&
          existingWishlistProductKeys.has(product.productId),
      )
    ) {
      return 'saved'
    }
    return null
  }

  const isProductSaved = (product: NaverShoppingProduct) =>
    getProductStorageStatus(product) != null

  const getProductCard = (item: AiMdProductRecommendation) => {
    const { product } = item
    const internalGarment = product.clothesId != null
      ? existingGarments.find((garment) => garment.id === String(product.clothesId))
      : undefined
    const productStyleLabel = product.primaryStyle
      ? getGarmentStyleLabel(product.primaryStyle)
      : null
    const internalStyleLabels = internalGarment?.be?.styleCodes
      ?.map(getGarmentStyleLabel)
      .filter(Boolean)
    const styleLabels = productStyleLabel
      ? [productStyleLabel]
      : internalStyleLabels?.length
        ? internalStyleLabels
        : internalGarment?.style
          ? [internalGarment.style]
          : selectedMd?.styleNames ?? selectedMd?.styleCodes.map(getGarmentStyleLabel) ?? []
    const fallbackColorCode = internalGarment?.be?.primaryColorCode
    const productColorCode = product.primaryColor ?? fallbackColorCode
    const inferredColors = product.candidateSource === 'NAVER'
      ? inferProductColors(product)
      : []
    const colorChip: RecommendColorChip | undefined = productColorCode
      ? {
          label: getGarmentColorLabel(productColorCode),
          hex: getGarmentColor(productColorCode)?.hex,
        }
      : internalGarment
      ? {
          label: internalGarment.color,
          hex: undefined,
        }
      : product.candidateSource === 'NAVER'
        ? inferredColors[0]
        : undefined
    const secondaryColors = uniqueSecondaryColors(
      colorChip,
      internalGarment?.be?.secondaryColorCodes?.map(colorCodeToChip) ??
        (product.candidateSource === 'NAVER' ? inferredColors.slice(colorChip ? 1 : 0) : []),
    )

    return mapAiMdProductToCard(item, styleLabels, colorChip, secondaryColors)
  }

  useEffect(() => {
    if (userId == null) {
      setMdLoading(false)
      setMdError('로그인 후 AI MD 추천을 이용할 수 있어요.')
      return
    }

    let cancelled = false
    setMdLoading(true)
    setMdError(null)
    void fetchAiMds(userId)
      .then((items) => {
        if (cancelled) return
        setMds(items)
        setSelectedMdId((current) =>
          current && items.some((md) => md.id === current)
            ? current
            : items[0]?.id ?? null,
        )
      })
      .catch((error) => {
        if (!cancelled) {
          setMdError(extractApiErrorMessage(error, 'AI MD 목록을 불러오지 못했습니다.'))
        }
      })
      .finally(() => {
        if (!cancelled) setMdLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const resetResults = () => {
    setOutfits([])
    setProducts([])
    setSelectedOutfits(new Set())
    setSelectedProducts(new Set())
    setSavedOutfits(new Set())
    setRecommendError(null)
  }

  const selectMd = (mdId: AiMdId) => {
    if (recommendLoading) return
    setSelectedMdId(mdId)
    resetResults()
  }

  const scrollMdCarousel = (direction: -1 | 1) => {
    if (recommendLoading || mds.length === 0) return
    const currentIndex = selectedMdIndex >= 0 ? selectedMdIndex : 0
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), mds.length - 1)
    const nextMd = mds[nextIndex]
    if (!nextMd || nextIndex === currentIndex) return
    selectMd(nextMd.id)
    window.requestAnimationFrame(() => {
      const card = mdCarouselRef.current?.children.item(nextIndex)
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    })
  }

  const changeMode = (nextMode: RecommendationMode) => {
    if (recommendLoading || mode === nextMode) return
    setMode(nextMode)
    resetResults()
  }

  const requestRecommendations = async () => {
    if (userId == null || !selectedMdId || recommendLoading) return
    const requestId = recommendRequestIdRef.current + 1
    recommendRequestIdRef.current = requestId
    setRecommendLoading(true)
    setShowRecommendCancelConfirm(false)
    setRecommendError(null)
    setSelectedOutfits(new Set())
    setSelectedProducts(new Set())
    setSavedOutfits(new Set())

    try {
      if (mode === 'outfits') {
        const result = await fetchAiMdOutfits(userId, selectedMdId)
        if (recommendRequestIdRef.current !== requestId) return
        setOutfits(result.outfits)
        setProducts([])
      } else {
        const result = await fetchAiMdProducts(userId, selectedMdId)
        if (recommendRequestIdRef.current !== requestId) return
        setProducts(result.products.slice(0, MAX_AI_MD_PRODUCTS))
        setOutfits([])
      }
    } catch (error) {
      if (recommendRequestIdRef.current !== requestId) return
      setRecommendError(
        extractApiErrorMessage(error, 'AI MD 추천을 불러오지 못했습니다.'),
      )
    } finally {
      if (recommendRequestIdRef.current === requestId) {
        setRecommendLoading(false)
        setShowRecommendCancelConfirm(false)
      }
    }
  }

  const cancelRecommendationRequest = () => {
    recommendRequestIdRef.current += 1
    setRecommendLoading(false)
    setShowRecommendCancelConfirm(false)
  }

  const toggleOutfit = (key: string) => {
    if (savedOutfits.has(key)) return
    setSelectedOutfits((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const openOutfitDetail = (outfit: AiMdOutfitRecommendation, key: string) => {
    const combination: {
      top?: OutfitModalItem | null
      bottom?: OutfitModalItem | null
      outer?: OutfitModalItem | null
      shoes?: OutfitModalItem | null
      weatherLabel?: string
      title?: string
      description?: string
      situation?: string
      season?: string
      saveDisabledMessage?: string
      saveOverride?: () => Promise<void>
      saveSuccessMessage?: string
      saveButtonLabel?: string
      hideFavoriteAction?: boolean
    } = {
      top: null,
      bottom: null,
      outer: null,
      shoes: null,
      title: outfit.title,
      description: outfit.description,
      situation: outfit.situation,
      season: outfit.season,
      weatherLabel: outfit.reason || outfit.stylingTip,
      saveOverride: async () => {
        if (userId == null || !selectedMdId) {
          throw new Error('AI MD 추천 정보를 찾을 수 없습니다.')
        }
        await saveAiMdOutfit(
          userId,
          selectedMdId,
          toAiMdOutfitSaveRequest(outfit),
        )
        setSavedOutfits((current) => new Set([...current, key]))
        setSelectedOutfits((current) => {
          const next = new Set(current)
          next.delete(key)
          return next
        })
      },
      saveSuccessMessage: 'AI MD 추천 코디를 저장했어요.',
      saveButtonLabel: '코디 저장하기',
      hideFavoriteAction: true,
    }

    outfit.ownedItems.forEach((item) => {
      const role = categoryToRole(item.category)
      if (combination[role]) return
      combination[role] = {
        clothesId: item.clothesId,
        name: item.name,
        brand: item.brandName,
        imageUrl: item.imageUrl,
        userImageUrl: item.userImageUrl ?? undefined,
        category: item.category,
      }
    })

    outfit.externalProducts.forEach((product) => {
      const role = categoryToRole(inferCategory(product))
      if (combination[role]) return
      combination[role] = {
        name: stripHtml(product.title),
        brand: product.brand || product.mallName,
        imageUrl: product.image,
        category: inferCategory(product),
      }
    })

    onOutfitOpen?.(combination)
  }

  const saveChosenOutfits = async () => {
    if (userId == null || !selectedMdId || chosenOutfits.length === 0) return
    setSavingOutfits(true)

    const results = await Promise.allSettled(
      chosenOutfits.map(({ outfit }) =>
        saveAiMdOutfit(
          userId,
          selectedMdId,
          toAiMdOutfitSaveRequest(outfit),
        ),
      ),
    )

    const savedKeys = chosenOutfits
      .filter((_, index) => results[index].status === 'fulfilled')
      .map(({ key }) => key)
    const failedCount = results.length - savedKeys.length

    setSavedOutfits((current) => new Set([...current, ...savedKeys]))
    setSelectedOutfits((current) => {
      const next = new Set(current)
      savedKeys.forEach((key) => next.delete(key))
      return next
    })
    setSavingOutfits(false)
    showToast(
      'success',
      failedCount
        ? `${savedKeys.length}개 저장, ${failedCount}개는 저장하지 못했어요.`
        : `${savedKeys.length}개 코디를 저장했어요.`,
    )
  }

  const openProductSave = (items = chosenProducts) => {
    if (!selectedMd || items.length === 0) return
    const naverItems = items.filter(({ product }) => product.candidateSource === 'NAVER')
    if (naverItems.length === 0) {
      void saveChosenProducts(items)
      return
    }
    setSaveForm(createProductSaveForm(naverItems[0].product, gender, selectedMd))
    setSaveOpen(true)
  }

  const saveFromDetail = (item: AiMdProductRecommendation) => {
    if (isProductSaved(item.product)) return
    setSelectedProducts(new Set([productKey(item.product)]))
    setDetailProduct(null)
    if (item.product.candidateSource === 'INTERNAL') {
      window.setTimeout(() => void saveChosenProducts([item]), 0)
      return
    }
    window.setTimeout(() => openProductSave([item]), 0)
  }

  const handleDislike = async (item: AiMdProductRecommendation) => {
    if (userId == null) return
    if (item.product.clothesId == null) {
      showToast('error', '저장 전 네이버 상품은 추천 피드백을 보낼 수 없어요.')
      return
    }
    const key = productKey(item.product)
    setFeedbackSubmittingKey(key)
    try {
      await postRecommendationFeedback(userId, {
        feedbackType: 'DISLIKE',
        clothesId: item.product.clothesId,
      })
      showToast('success', '이런 추천을 줄일게요.')
      setDetailProduct(null)
    } catch {
      showToast('error', '요청에 실패했습니다.')
    } finally {
      setFeedbackSubmittingKey(null)
    }
  }

  const updateCategory = (category: BeCategoryCode) => {
    setSaveForm((current) =>
      current
        ? {
            ...current,
            category,
            itemType: CATEGORY_ITEM_TYPES[BE_CATEGORY_TO_UI[category]][0].code,
          }
        : current,
    )
  }

  const saveChosenProducts = async (items = chosenProducts) => {
    if (userId == null || items.length === 0) return
    const hasNaverItems = items.some(({ product }) => product.candidateSource === 'NAVER')
    if (hasNaverItems && !saveForm) return
    setSavingProducts(true)

    const results = await Promise.allSettled(
      items.map(({ product }) => {
        if (product.candidateSource === 'INTERNAL' && product.clothesId != null) {
          return connectWishlistClothes(userId, product.clothesId)
        }

        if (!saveForm) {
          throw new Error('상품 정보 확인이 필요합니다.')
        }

        return createWishlistClothes(userId, {
          name: stripHtml(product.title),
          brandName: (product.brand || product.mallName || 'UNKNOWN').slice(0, 100),
          productCode: product.productId,
          imageUrl: product.image,
          category: saveForm.category,
          itemType: saveForm.itemType,
          gender: saveForm.gender,
          primaryColor: saveForm.primaryColor,
          secondaryColors: [],
          styles: saveForm.styles,
          size: saveForm.size.trim() || 'FREE',
          season: saveForm.season || undefined,
          externalSource: 'NAVER_SHOPPING',
          externalProductId: product.productId,
          externalProductUrl: product.link,
        })
      }),
    )

    const savedKeys = items
      .filter((_, index) => {
        const result = results[index]
        return result.status === 'fulfilled' || isAlreadySavedError(result.reason)
      })
      .map(({ product }) => productKey(product))
    const successCount = savedKeys.length
    const failedCount = results.length - savedKeys.length
    setSavedProductKeys((current) => new Set([...current, ...savedKeys]))
    setSavingProducts(false)
    setSaveOpen(false)
    setSelectedProducts(new Set())
    showToast(
      failedCount ? 'error' : 'success',
      failedCount
        ? `${successCount}개 저장, ${failedCount}개는 저장하지 못했어요.`
        : `${successCount}개 상품을 위시리스트로 저장했어요.`,
    )
    if (successCount > 0) onWishlistAdded?.()
  }

  if (mdLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (mdError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
        <p className="text-sm font-black text-red-700">{mdError}</p>
      </div>
    )
  }

  const recommendationLoadingMessage = `${selectedMd?.name ?? 'AI'} MD가 ${
    mode === 'outfits' ? '코디를' : '상품을'
  } 추천해주고 있습니다.`

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-black text-slate-500">AI MD 선택</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={recommendLoading || selectedMdIndex <= 0}
              onClick={() => scrollMdCarousel(-1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-950 disabled:opacity-30"
              aria-label="이전 MD"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={recommendLoading || selectedMdIndex < 0 || selectedMdIndex >= mds.length - 1}
              onClick={() => scrollMdCarousel(1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-950 disabled:opacity-30"
              aria-label="다음 MD"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={mdCarouselRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none"
        >
          {mds.map((md) => {
            const selected = md.id === selectedMdId
            const characterImage = AI_MD_CHARACTER_IMAGES[md.id]
            return (
              <button
                key={md.id}
                type="button"
                disabled={recommendLoading}
                onClick={() => selectMd(md.id)}
                className={`min-h-44 w-[82%] shrink-0 snap-center rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-[44%] lg:w-[31%] ${
                  selected
                    ? 'border-[#111827] bg-[#111827] text-white ring-2 ring-[#C4B5FD]'
                    : 'border-slate-100 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-2">
                  <img
                    src={characterImage}
                    alt=""
                    className="h-36 w-auto object-contain object-bottom bg-transparent"
                  />
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm font-black">{md.name}</strong>
                      {selected && <Check className="h-4 w-4 shrink-0 text-[#C4B5FD]" />}
                    </div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${
                      selected ? 'bg-white/10 text-white/70' : 'bg-white text-slate-400'
                    }`}>
                      {md.gender === 'MALE' ? '남자 MD' : '여자 MD'}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {md.styleNames.slice(0, 3).map((style) => (
                        <span
                          key={style}
                          className={`max-w-full rounded-full px-1.5 py-0.5 text-[9px] font-black leading-tight ${
                            selected ? 'bg-white/10 text-white/80' : 'bg-white text-slate-500'
                          }`}
                          title={style}
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className={`mt-3 text-[9px] font-bold leading-relaxed line-clamp-2 ${
                  selected ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {md.description}
                </p>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {mds.map((md, index) => (
            <button
              key={md.id}
              type="button"
              disabled={recommendLoading}
              onClick={() => {
                selectMd(md.id)
                mdCarouselRef.current?.children
                  .item(index)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
              }}
              className={`h-1.5 rounded-full transition ${
                md.id === selectedMdId ? 'w-5 bg-slate-950' : 'w-1.5 bg-slate-300'
              }`}
              aria-label={`${md.name} 선택`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
        <div className="grid grid-cols-2 gap-1">
          {([
            ['outfits', '코디 추천'],
            ['products', '상품 추천'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={recommendLoading}
              onClick={() => changeMode(value)}
              className={`h-10 rounded-xl text-xs font-black transition ${
                mode === value
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!selectedMdId || recommendLoading}
          onClick={() => void requestRecommendations()}
          className="mt-2 w-full h-11 rounded-xl bg-[#111827] text-white text-sm font-black flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-40"
        >
          <Sparkles className={`w-4 h-4 ${recommendLoading ? 'animate-pulse' : ''}`} />
          {recommendLoading
            ? mode === 'outfits'
              ? 'AI MD가 코디를 구성하고 있어요'
              : 'AI MD가 상품을 찾고 있어요'
            : `${selectedMd?.name ?? 'AI MD'}에게 추천받기`}
        </button>
      </div>

      {recommendError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
          <p className="text-sm font-black text-red-700">{recommendError}</p>
          <button
            type="button"
            onClick={() => void requestRecommendations()}
            className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
          >
            다시 시도
          </button>
        </div>
      )}

      {recommendLoading && (
        <div className={`grid gap-4 ${mode === 'outfits' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
          {Array.from({ length: mode === 'outfits' ? 4 : 6 }).map((_, index) => (
            <div key={index} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      <Modal
        open={recommendLoading}
        onClose={() => {}}
        preventClose
        closeOnBackdrop={false}
        closeOnEscape={false}
        size="sm"
        placement="center"
        zIndex={120}
        panelClassName="max-w-xs"
      >
        <ModalBody className="relative px-6 py-8">
          <button
            type="button"
            onClick={() => setShowRecommendCancelConfirm(true)}
            className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200"
            aria-label="MD 추천 취소"
          >
            <X className="h-4 w-4" />
          </button>
          <AiMdLoadingSpinner
            message={recommendationLoadingMessage}
            subMessage="잠시만 기다려 주세요."
          />
        </ModalBody>
      </Modal>

      <ExitConfirmModal
        open={showRecommendCancelConfirm}
        title="MD 추천을 취소하시겠습니까?"
        description="추천 요청을 취소하고 이전 화면으로 돌아갑니다."
        confirmText="추천 취소"
        cancelText="계속 기다리기"
        onConfirm={cancelRecommendationRequest}
        onCancel={() => setShowRecommendCancelConfirm(false)}
      />

      {!recommendLoading && mode === 'outfits' && outfits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {outfits.map((outfit, index) => {
            const key = outfitKey(outfit, index)
            const selected = selectedOutfits.has(key)
            const saved = savedOutfits.has(key)
            const items = [
              ...outfit.ownedItems.map((item) => ({
                image: item.userImageUrl || item.imageUrl,
                name: item.name,
                owned: true,
              })),
              ...outfit.externalProducts.map((product) => ({
                image: product.image,
                name: stripHtml(product.title),
                owned: false,
              })),
            ]

            return (
              <article
                key={key}
                className={`relative rounded-2xl border overflow-hidden bg-white transition hover:-translate-y-0.5 hover:shadow-md ${
                  selected
                    ? 'border-[#111827] ring-2 ring-[#C4B5FD]'
                    : saved
                      ? 'border-emerald-200'
                      : 'border-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openOutfitDetail(outfit, key)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="relative grid grid-cols-2 h-48 bg-slate-100">
                    {items.slice(0, 4).map((item, itemIndex) => (
                      <div key={`${item.name}-${itemIndex}`} className="relative overflow-hidden border border-white">
                        {item.owned ? (
                          <AuthenticatedImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className={`absolute left-1.5 bottom-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                          item.owned
                            ? 'bg-white/90 text-slate-800'
                            : 'bg-[#C4B5FD] text-[#312E81]'
                        }`}>
                          {item.owned ? '내 옷' : '추천 상품'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                        {outfit.situation}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                        {outfit.season}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-black text-slate-950">
                      {outfit.title}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-500 leading-relaxed">
                      {outfit.description}
                    </p>
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                        <strong className="text-slate-950">추천 이유</strong> · {outfit.reason}
                      </p>
                      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                        <strong className="text-slate-950">스타일링 팁</strong> · {outfit.stylingTip}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={saved || savingOutfits}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleOutfit(key)
                  }}
                  aria-pressed={selected || saved}
                  aria-label={saved ? '저장된 코디' : selected ? '코디 선택 해제' : '코디 선택'}
                  className={`absolute top-2 right-2 z-10 min-w-8 h-8 px-2 rounded-full grid place-items-center text-[10px] font-black shadow transition disabled:cursor-default ${
                    saved
                      ? 'bg-emerald-500 text-white'
                      : selected
                        ? 'bg-[#111827] text-white'
                        : 'bg-white/90 text-slate-500 hover:bg-white hover:text-[#111827]'
                  }`}
                >
                  {saved ? '저장됨' : <Check className="w-4 h-4" />}
                </button>
              </article>
            )
          })}
        </div>
      )}

      {!recommendLoading && mode === 'products' && products.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-500">
            최대 {MAX_AI_MD_PRODUCTS}개 상품 · {products.length}개
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((item) => {
              const { product } = item
              const key = productKey(product)
              const card = getProductCard(item)
              const storageStatus = getProductStorageStatus(product)
              const wishlisted = storageStatus === 'saved'
              const canWishlist = storageStatus !== 'owned'
              return (
                <article
                  key={key}
                  className="group relative rounded-[24px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-xl active:scale-[0.99] cursor-pointer border-slate-100 bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => setDetailProduct(item)}
                    className="block w-full cursor-pointer text-left"
                  >
                    <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                      <AuthenticatedImage
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>}
                      />
                      <div className="absolute left-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col items-start max-w-[66%]">
                        {card.brandLabel ? <div className="text-[11px] font-bold text-white/90 uppercase tracking-wide truncate">{card.brandLabel}</div> : null}
                        <h3 className="text-sm md:text-base font-black truncate mt-1 leading-tight">{card.title}</h3>
                      </div>
                    </div>
                  </button>

                  {canWishlist ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!wishlisted) saveFromDetail(item)
                      }}
                      disabled={savingProducts}
                      aria-pressed={wishlisted}
                      aria-label={wishlisted ? '위시리스트에서 빼기' : '위시리스트에 추가'}
                      className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full border bg-white/95 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        wishlisted
                          ? 'border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300'
                          : 'border-slate-200/90 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white/95'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      )}

      {!recommendLoading &&
        !recommendError &&
        ((mode === 'outfits' && outfits.length === 0) ||
          (mode === 'products' && products.length === 0)) && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-black text-slate-600">
              MD와 추천 종류를 선택한 뒤 추천받기 버튼을 눌러 주세요.
            </p>
          </div>
        )}

      {(chosenOutfits.length > 0 || chosenProducts.length > 0) && (
        <div className="fixed left-0 right-0 bottom-16 z-40 px-4 pb-3 pointer-events-none">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-[0_-8px_30px_rgba(17,24,39,0.12)] pointer-events-auto">
            <button
              type="button"
              disabled={savingOutfits || savingProducts}
              onClick={() =>
                mode === 'outfits'
                  ? void saveChosenOutfits()
                  : openProductSave()
              }
              className="w-full h-11 rounded-xl bg-[#111827] text-white text-sm font-black disabled:opacity-50"
            >
              {savingOutfits
                ? '코디 저장 중…'
                : `선택 ${mode === 'outfits' ? chosenOutfits.length : chosenProducts.length}개 저장`}
            </button>
          </div>
        </div>
      )}

      <RecommendProductDetailModal
        open={detailProduct != null}
        item={detailProduct ? getProductCard(detailProduct) : null}
        userId={userId}
        onClose={() => setDetailProduct(null)}
        wishlisted={detailProduct ? getProductStorageStatus(detailProduct.product) === 'saved' : false}
        wishlistSubmitting={savingProducts}
        onWishlistToggle={
          detailProduct && getProductStorageStatus(detailProduct.product) !== 'owned'
            ? () => {
                if (!isProductSaved(detailProduct.product)) saveFromDetail(detailProduct)
              }
            : undefined
        }
        onDislike={
          detailProduct?.product.clothesId != null
            ? () => { void handleDislike(detailProduct) }
            : undefined
        }
        dislikeSubmitting={detailProduct ? feedbackSubmittingKey === productKey(detailProduct.product) : false}
      />

      <Modal
        open={saveOpen}
        onClose={() => !savingProducts && setSaveOpen(false)}
        preventClose={savingProducts}
        size="md"
        placement="sheet"
      >
        <ModalHeader
          title="상품 정보 확인"
          subtitle={`선택한 네이버 상품 ${chosenNaverProducts.length}개에 공통으로 적용됩니다.`}
          onClose={() => setSaveOpen(false)}
          closeDisabled={savingProducts}
        />
        <ModalBody className="p-5 sm:p-6 space-y-5">
          {saveForm && (
            <>
              <label className="block">
                <span className="text-xs font-black text-slate-700">카테고리</span>
                <select
                  value={saveForm.category}
                  onChange={(event) => updateCategory(event.target.value as BeCategoryCode)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold bg-white"
                >
                  {Object.entries(BE_CATEGORY_TO_UI).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-700">아이템 종류</span>
                <select
                  value={saveForm.itemType}
                  onChange={(event) =>
                    setSaveForm((current) =>
                      current ? { ...current, itemType: event.target.value } : current,
                    )
                  }
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold bg-white"
                >
                  {CATEGORY_ITEM_TYPES[BE_CATEGORY_TO_UI[saveForm.category]].map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-700">대표 색상</span>
                <select
                  value={saveForm.primaryColor}
                  onChange={(event) =>
                    setSaveForm((current) =>
                      current ? { ...current, primaryColor: event.target.value } : current,
                    )
                  }
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold bg-white"
                >
                  {GARMENT_COLORS.map((color) => (
                    <option key={color.code} value={color.code}>{color.name}</option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-xs font-black text-slate-700">스타일</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GARMENT_STYLES.map((style) => {
                    const selected = saveForm.styles.includes(style.code)
                    return (
                      <button
                        key={style.code}
                        type="button"
                        onClick={() =>
                          setSaveForm((current) => {
                            if (!current) return current
                            const styles = selected
                              ? current.styles.filter((code) => code !== style.code)
                              : [...current.styles, style.code]
                            return {
                              ...current,
                              styles: styles.length ? styles : [style.code],
                            }
                          })
                        }
                        className={`h-8 px-3 rounded-full text-[11px] font-black border ${
                          selected
                            ? 'bg-[#111827] text-white border-[#111827]'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {style.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-black text-slate-700">사이즈</span>
                  <input
                    value={saveForm.size}
                    onChange={(event) =>
                      setSaveForm((current) =>
                        current ? { ...current, size: event.target.value } : current,
                      )
                    }
                    className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"
                  />
                </label>
                <label>
                  <span className="text-xs font-black text-slate-700">계절</span>
                  <select
                    value={saveForm.season}
                    onChange={(event) =>
                      setSaveForm((current) =>
                        current ? { ...current, season: event.target.value } : current,
                      )
                    }
                    className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold bg-white"
                  >
                    {seasonOptions.map((option) => (
                      <option key={option.code} value={option.code}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter className="p-4">
          <button
            type="button"
            disabled={savingProducts || !saveForm?.size.trim() || !saveForm?.styles.length}
            onClick={() => void saveChosenProducts()}
            className="w-full h-11 rounded-xl bg-[#111827] text-white text-sm font-black disabled:opacity-40"
          >
            {savingProducts
              ? '저장 중…'
              : `${chosenProducts.length}개 위시리스트로 저장`}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
