import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { postRecommendationFeedback } from '@/api/recommendations'
import { getBaseClothesForSimilarProducts, getSimilarProducts } from '@/api/similarProducts'
import { connectWishlistClothes, createWishlistClothes } from '@/api/wardrobe'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Check, Heart } from '@/components/icons'
import RecommendProductDetailModal from '@/components/RecommendProductDetailModal'
import { useToast } from './Toast'
import {
  BE_CATEGORY_TO_UI,
  CATEGORY_ITEM_TYPES,
  UI_CATEGORY_TO_BE,
  resolveUiCategory,
  type BeCategoryCode,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { resolveClothesGender } from '@/data/garmentGender'
import {
  GARMENT_COLORS,
  getGarmentColor,
  getGarmentColorLabel,
  resolveGarmentColorCode,
} from '@/data/garmentColors'
import {
  GARMENT_STYLES,
  getGarmentStyleLabel,
  resolveGarmentStyleCode,
} from '@/data/garmentStyles'
import type { ClothesResponse } from '@/types/be'
import type { Garment } from '@/types'
import type {
  NaverShoppingProduct,
  SimilarProductRecommendation,
  SimilarProductSaveForm,
} from '@/types/similarProducts'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'

interface SimilarProductRecommendationsProps {
  userId: number | null
  existingGarments: Garment[]
  onWishlistAdded?: () => void
  onGoToCloset?: () => void
}

type BaseClothesFilter = 'all' | 'owned' | 'wishlist'
type BaseClothesCategoryFilter = 'all' | UiCategory

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

const baseClothesStatusLabel = (item: ClothesResponse) =>
  item.ownershipStatus === 'OWNED' ? '보유' : '위시리스트'

function inferProductCategory(product: NaverShoppingProduct): BeCategoryCode {
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

function mapSimilarProductToCard(
  product: NaverShoppingProduct,
  styles: string[] = [],
  color?: RecommendColorChip,
  secondaryColors: RecommendColorChip[] = [],
): RecommendCardItem {
  const category = inferProductCategory(product)
  const uiCategory = BE_CATEGORY_TO_UI[category]
  const itemTypeLabel = product.category4 || product.category3 || CATEGORY_ITEM_TYPES[uiCategory][0].label
  const brandLabel = product.brand || product.mallName || (
    product.candidateSource === 'INTERNAL' ? '서비스 상품' : '네이버쇼핑'
  )
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
    style: styles[0] ?? '—',
    styles,
    color: color?.label ?? '—',
    colorHex: color?.hex,
    secondaryColors,
    matchRate: 0,
    imageUrl: product.image,
    reason: product.candidateSource === 'INTERNAL'
      ? '서비스에 등록된 유사 상품입니다.'
      : '네이버쇼핑에서 찾은 유사 상품입니다.',
    purchaseUrl: product.link,
    hasDirectPurchaseUrl: product.link.trim().length > 0,
  }
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

function defaultSaveForm(base: ClothesResponse): SimilarProductSaveForm {
  const category = (base.category in BE_CATEGORY_TO_UI
    ? base.category
    : UI_CATEGORY_TO_BE[resolveUiCategory(base.category)]) as BeCategoryCode
  const uiCategory = BE_CATEGORY_TO_UI[category]
  const itemType = CATEGORY_ITEM_TYPES[uiCategory].some(
    (item) => item.code === base.itemType,
  )
    ? base.itemType
    : CATEGORY_ITEM_TYPES[uiCategory][0].code

  return {
    category,
    itemType,
    gender: resolveClothesGender(base.gender),
    primaryColor: resolveGarmentColorCode(base.primaryColor),
    styles: base.styles.length
      ? base.styles.map((style) => resolveGarmentStyleCode(style.code))
      : ['CASUAL'],
    size: 'FREE',
    season: base.season ?? '',
  }
}

export default function SimilarProductRecommendations({
  userId,
  existingGarments,
  onWishlistAdded,
  onGoToCloset,
}: SimilarProductRecommendationsProps) {
  const { showToast } = useToast() || { showToast: () => {} }
  const [baseClothes, setBaseClothes] = useState<ClothesResponse[]>([])
  const [baseClothesLoading, setBaseClothesLoading] = useState(true)
  const [baseClothesError, setBaseClothesError] = useState<string | null>(null)
  const [selectedClothesId, setSelectedClothesId] = useState<number | null>(null)
  const [recommendation, setRecommendation] =
    useState<SimilarProductRecommendation | null>(null)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [savedProductKeys, setSavedProductKeys] = useState<Set<string>>(new Set())
  const [clothesPickerOpen, setClothesPickerOpen] = useState(false)
  const [baseClothesFilter, setBaseClothesFilter] =
    useState<BaseClothesFilter>('all')
  const [baseClothesCategoryFilter, setBaseClothesCategoryFilter] =
    useState<BaseClothesCategoryFilter>('all')
  const [detailProduct, setDetailProduct] =
    useState<NaverShoppingProduct | null>(null)
  const [saveForm, setSaveForm] = useState<SimilarProductSaveForm | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedbackSubmittingKey, setFeedbackSubmittingKey] = useState<string | null>(null)

  const loadBaseClothes = useCallback(async () => {
    if (userId == null) {
      setBaseClothes([])
      setBaseClothesLoading(false)
      setBaseClothesError('로그인 후 유사 상품 추천을 이용할 수 있어요.')
      return
    }

    setBaseClothesLoading(true)
    setBaseClothesError(null)
    try {
      const items = await getBaseClothesForSimilarProducts(userId)
      setBaseClothes(items)
      setSelectedClothesId((current) =>
        current != null && !items.some((item) => item.clothesId === current)
          ? null
          : current,
      )
    } catch (error) {
      setBaseClothes([])
      setBaseClothesError(
        extractApiErrorMessage(error, '기준 옷 목록을 불러오지 못했습니다.'),
      )
    } finally {
      setBaseClothesLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadBaseClothes()
  }, [loadBaseClothes])

  const requestSimilarProducts = async (clothesId: number) => {
    if (userId == null || recommendLoading) return
    setSelectedClothesId(clothesId)
    setRecommendLoading(true)
    setRecommendError(null)
    setRecommendation(null)
    setSelectedProducts(new Set())

    try {
      const result = await getSimilarProducts(userId, clothesId)
      setRecommendation(result)
    } catch (error) {
      setRecommendError(
        extractApiErrorMessage(error, '유사 상품 추천을 불러오지 못했습니다.'),
      )
    } finally {
      setRecommendLoading(false)
    }
  }

  const selectedItems = useMemo(() => {
    if (!recommendation) return []
    return recommendation.products.filter((product) =>
      selectedProducts.has(productKey(product)) &&
      !savedProductKeys.has(productKey(product)),
    )
  }, [recommendation, savedProductKeys, selectedProducts])

  const selectedNaverItems = useMemo(
    () => selectedItems.filter((product) => product.candidateSource === 'NAVER'),
    [selectedItems],
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

  const selectedClothes = useMemo(
    () =>
      baseClothes.find((item) => item.clothesId === selectedClothesId) ?? null,
    [baseClothes, selectedClothesId],
  )

  const getProductCard = (product: NaverShoppingProduct) => {
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
          : product.candidateSource === 'NAVER'
            ? selectedClothes?.styles.map((style) => style.name || getGarmentStyleLabel(style.code)) ?? []
            : []
    const fallbackColorCode = internalGarment?.be?.primaryColorCode
    const productColorCode = product.primaryColor ??
      fallbackColorCode ??
      (product.candidateSource === 'NAVER' ? selectedClothes?.primaryColor : null)
    const primaryColorDisplay = product.candidateSource === 'NAVER'
      ? selectedClothes?.primaryColorDisplay
      : null
    const colorChip: RecommendColorChip | undefined = productColorCode
      ? {
          label: primaryColorDisplay?.name ?? getGarmentColorLabel(productColorCode),
          hex: primaryColorDisplay?.hex ?? getGarmentColor(productColorCode)?.hex,
        }
      : internalGarment
      ? {
          label: internalGarment.color,
          hex: undefined,
        }
      : undefined
    const secondaryColors = uniqueSecondaryColors(
      colorChip,
      internalGarment?.be?.secondaryColorCodes?.map(colorCodeToChip) ??
        (product.candidateSource === 'NAVER'
          ? selectedClothes?.secondaryColors.map((color) => ({
              label: color.colorDisplay?.name ?? getGarmentColorLabel(color.code),
              hex: color.colorDisplay?.hex ?? getGarmentColor(color.code)?.hex,
            })) ?? []
          : []),
    )

    return mapSimilarProductToCard(product, styleLabels, colorChip, secondaryColors)
  }

  const filteredBaseClothes = useMemo(() => {
    return baseClothes.filter((item) => {
      const matchesOwnership =
        baseClothesFilter === 'all' ||
        (baseClothesFilter === 'owned'
          ? item.ownershipStatus === 'OWNED'
          : item.ownershipStatus === 'WISHLIST')
      const matchesCategory =
        baseClothesCategoryFilter === 'all' ||
        resolveUiCategory(item.category) === baseClothesCategoryFilter
      return matchesOwnership && matchesCategory
    })
  }, [baseClothes, baseClothesCategoryFilter, baseClothesFilter])

  const selectBaseClothes = (clothesId: number) => {
    setClothesPickerOpen(false)
    void requestSimilarProducts(clothesId)
  }

  const openSaveModal = () => {
    if (!recommendation || selectedItems.length === 0) return
    if (selectedNaverItems.length === 0) {
      void saveSelectedProducts()
      return
    }
    setSaveForm(defaultSaveForm(recommendation.baseClothes))
    setSaveOpen(true)
  }

  const saveFromDetail = (product: NaverShoppingProduct) => {
    if (isProductSaved(product)) return
    const key = productKey(product)
    setSelectedProducts((prev) => new Set(prev).add(key))
    setDetailProduct(null)
    if (product.candidateSource === 'INTERNAL') {
      window.setTimeout(() => void saveSelectedProducts([product]), 0)
      return
    }
    window.setTimeout(() => {
      if (!recommendation) return
      setSaveForm(defaultSaveForm(recommendation.baseClothes))
      setSaveOpen(true)
    }, 0)
  }

  const handleDislike = async (product: NaverShoppingProduct) => {
    if (userId == null) return
    if (product.clothesId == null) {
      showToast('error', '저장 전 네이버 상품은 추천 피드백을 보낼 수 없어요.')
      return
    }
    const key = productKey(product)
    setFeedbackSubmittingKey(key)
    try {
      await postRecommendationFeedback(userId, {
        feedbackType: 'DISLIKE',
        clothesId: product.clothesId,
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
    const uiCategory = BE_CATEGORY_TO_UI[category]
    setSaveForm((prev) =>
      prev
        ? {
            ...prev,
            category,
            itemType: CATEGORY_ITEM_TYPES[uiCategory][0].code,
          }
        : prev,
    )
  }

  const saveSelectedProducts = async (items = selectedItems) => {
    if (userId == null || items.length === 0) return
    const hasNaverItems = items.some((product) => product.candidateSource === 'NAVER')
    if (hasNaverItems && !saveForm) return
    setSaving(true)

    const results = await Promise.allSettled(
      items.map((product) => {
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
      .map(productKey)
    const successCount = savedKeys.length
    const failedCount = results.length - savedKeys.length
    setSavedProductKeys((current) => new Set([...current, ...savedKeys]))
    setSaving(false)
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

  if (baseClothesLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-52 lg:h-72 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (baseClothesError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
        <p className="text-sm font-black text-red-700">{baseClothesError}</p>
        <button
          type="button"
          onClick={() => void loadBaseClothes()}
          className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (baseClothes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
        <p className="text-sm font-black text-slate-700">
          유사한 상품을 찾으려면 먼저 보유 옷이나 위시리스트를 추가해 주세요.
        </p>
        <button
          type="button"
          onClick={onGoToCloset}
          className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
        >
          옷 등록하러 가기
        </button>
      </div>
    )
  }

  const uiCategory = saveForm
    ? BE_CATEGORY_TO_UI[saveForm.category]
    : ('Top' as UiCategory)

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          disabled={recommendLoading}
          onClick={() => setClothesPickerOpen(true)}
          className="w-full min-h-20 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
        >
          {selectedClothes ? (
            <>
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <AuthenticatedImage
                  src={selectedClothes.userImageUrl || selectedClothes.imageUrl}
                  alt={selectedClothes.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400">현재 기준 옷</p>
                <p className="mt-0.5 text-sm font-black text-slate-900 truncate">
                  {selectedClothes.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5 min-w-0">
                  <span
                    className={`shrink-0 h-5 px-2 rounded-full text-[10px] font-black grid place-items-center ${
                      selectedClothes.ownershipStatus === 'OWNED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {baseClothesStatusLabel(selectedClothes)}
                  </span>
                  <p className="text-[11px] font-bold text-slate-400 truncate">
                    {selectedClothes.brandName || selectedClothes.category}
                  </p>
                </div>
              </div>
              <span className="shrink-0 h-8 px-3 rounded-full bg-[#111827] text-white text-[11px] font-black grid place-items-center">
                옷 변경
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center text-xl">
                +
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">
                  유사 상품을 찾을 옷을 선택해 주세요
                </p>
              </div>
              <span className="shrink-0 h-8 px-3 rounded-full bg-[#111827] text-white text-[11px] font-black grid place-items-center">
                옷 선택
              </span>
            </>
          )}
        </button>
      </div>

      {!selectedClothesId && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm font-black text-slate-600">위에서 기준 옷을 선택해 주세요.</p>
        </div>
      )}

      {recommendLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-52 lg:h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {recommendError && !recommendLoading && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
          <p className="text-sm font-black text-red-700">{recommendError}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadBaseClothes()}
              className="h-9 px-4 rounded-full border border-slate-200 bg-white text-xs font-black"
            >
              옷 목록 새로고침
            </button>
            <button
              type="button"
              onClick={() =>
                selectedClothesId != null &&
                void requestSimilarProducts(selectedClothesId)
              }
              className="h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
            >
              추천 다시 시도
            </button>
          </div>
        </div>
      )}

      {recommendation && !recommendLoading && (
        <>
          {recommendation.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-700">
                비슷한 상품을 찾지 못했어요.
              </p>
              <p className="mt-1 text-xs text-slate-400 font-bold">
                다른 옷을 선택해 다시 시도해 주세요.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-500">
                  최대 50개 결과 · {recommendation.products.length}개
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendation.products.map((product) => {
                  const key = productKey(product)
                  const card = getProductCard(product)
                  const storageStatus = getProductStorageStatus(product)
                  const wishlisted = storageStatus === 'saved'
                  const canWishlist = storageStatus !== 'owned'
                  return (
                    <article
                      key={key}
                      className="group relative rounded-[24px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] active:scale-[0.99] cursor-pointer border-slate-100 bg-slate-50"
                    >
                      <button
                        type="button"
                        onClick={() => setDetailProduct(product)}
                        className="block w-full cursor-pointer text-left"
                      >
                        <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                          <AuthenticatedImage
                            src={card.imageUrl}
                            alt={card.title}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>}
                          />
                          <div className="absolute left-0 bottom-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col items-start">
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
                            if (!wishlisted) saveFromDetail(product)
                          }}
                          disabled={saving}
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
            </>
          )}
        </>
      )}

      {selectedItems.length > 0 && (
        <div className="fixed left-0 right-0 bottom-16 z-40 px-4 pb-3 pointer-events-none">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-[0_-8px_30px_rgba(17,24,39,0.12)] pointer-events-auto">
            <button
              type="button"
              onClick={openSaveModal}
              className="w-full h-11 rounded-xl bg-[#111827] text-white text-sm font-black transition active:scale-[0.98]"
            >
              선택 {selectedItems.length}개 저장
            </button>
          </div>
        </div>
      )}

      <Modal
        open={clothesPickerOpen}
        onClose={() => setClothesPickerOpen(false)}
        size="lg"
        placement="sheet"
        closeOnBackdrop
      >
        <ModalHeader
          title="기준 옷 선택"
          onClose={() => setClothesPickerOpen(false)}
        />
        <ModalBody className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
            {[
              ['all', '전체'],
              ['owned', '보유'],
              ['wishlist', '위시리스트'],
            ].map(([value, label]) => {
              const active = baseClothesFilter === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBaseClothesFilter(value as BaseClothesFilter)}
                  className={`h-10 rounded-xl text-[12px] font-black transition ${
                    active
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
            {(['all', 'Top', 'Bottom', 'Outer', 'Shoes'] as const).map((category) => {
              const labels: Record<BaseClothesCategoryFilter, string> = {
                all: '전체',
                Top: '상의',
                Bottom: '하의',
                Outer: '아우터',
                Shoes: '신발',
              }
              const active = baseClothesCategoryFilter === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setBaseClothesCategoryFilter(category)}
                  aria-pressed={active}
                  className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {labels[category]}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-2.5 gap-y-4">
            {filteredBaseClothes.map((item) => {
              const selected = selectedClothesId === item.clothesId
              const owned = item.ownershipStatus === 'OWNED'
              return (
                <button
                  key={item.clothesId}
                  type="button"
                  onClick={() => selectBaseClothes(item.clothesId)}
                  className="min-w-0 text-left group"
                  aria-pressed={selected}
                >
                  <div
                    className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${
                      selected
                        ? 'border-[#111827] ring-2 ring-[#C4B5FD]'
                        : 'border-transparent'
                    }`}
                  >
                    <AuthenticatedImage
                      src={item.userImageUrl || item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <div className="w-full h-full grid place-items-center px-1 text-center text-[10px] text-slate-400">
                          이미지 없음
                        </div>
                      }
                    />
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#111827] text-white grid place-items-center shadow">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span
                      className={`absolute left-1.5 top-1.5 h-5 px-2 rounded-full text-[10px] font-black shadow-sm inline-flex items-center justify-center ${
                        owned
                          ? 'bg-emerald-500 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {owned ? '보유' : '위시리스트'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-black text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">
                    {item.brandName || item.category}
                  </p>
                </button>
              )
            })}
          </div>
          {filteredBaseClothes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-black text-slate-600">
                해당 상태의 기준 옷이 없습니다.
              </p>
            </div>
          )}
        </ModalBody>
      </Modal>

      <RecommendProductDetailModal
        open={detailProduct != null}
        item={detailProduct ? getProductCard(detailProduct) : null}
        userId={userId}
        onClose={() => setDetailProduct(null)}
        wishlisted={detailProduct ? getProductStorageStatus(detailProduct) === 'saved' : false}
        wishlistSubmitting={saving}
        onWishlistToggle={
          detailProduct && getProductStorageStatus(detailProduct) !== 'owned'
            ? () => {
                if (!isProductSaved(detailProduct)) saveFromDetail(detailProduct)
              }
            : undefined
        }
        onDislike={
          detailProduct?.clothesId != null
            ? () => { void handleDislike(detailProduct) }
            : undefined
        }
        dislikeSubmitting={detailProduct ? feedbackSubmittingKey === productKey(detailProduct) : false}
      />

      <Modal
        open={saveOpen}
        onClose={() => !saving && setSaveOpen(false)}
        preventClose={saving}
        size="md"
        placement="sheet"
      >
        <ModalHeader
          title="상품 정보 확인"
          subtitle={`선택한 네이버 상품 ${selectedNaverItems.length}개에 공통으로 적용됩니다.`}
          onClose={() => setSaveOpen(false)}
          closeDisabled={saving}
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
                    setSaveForm((prev) => prev ? { ...prev, itemType: event.target.value } : prev)
                  }
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold bg-white"
                >
                  {CATEGORY_ITEM_TYPES[uiCategory].map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700">대표 색상</span>
                <select
                  value={saveForm.primaryColor}
                  onChange={(event) =>
                    setSaveForm((prev) => prev ? { ...prev, primaryColor: event.target.value } : prev)
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
                          setSaveForm((prev) => {
                            if (!prev) return prev
                            const styles = selected
                              ? prev.styles.filter((code) => code !== style.code)
                              : [...prev.styles, style.code]
                            return { ...prev, styles: styles.length ? styles : [style.code] }
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
                      setSaveForm((prev) => prev ? { ...prev, size: event.target.value } : prev)
                    }
                    maxLength={50}
                    className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold"
                    placeholder="FREE"
                  />
                </label>
                <label>
                  <span className="text-xs font-black text-slate-700">계절</span>
                  <select
                    value={saveForm.season}
                    onChange={(event) =>
                      setSaveForm((prev) => prev ? { ...prev, season: event.target.value } : prev)
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
            disabled={saving || !saveForm?.size.trim() || !saveForm?.styles.length}
            onClick={() => void saveSelectedProducts()}
            className="w-full h-11 rounded-xl bg-[#111827] text-white text-sm font-black disabled:opacity-40"
          >
            {saving ? '저장 중…' : `${selectedItems.length}개 위시리스트로 저장`}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
