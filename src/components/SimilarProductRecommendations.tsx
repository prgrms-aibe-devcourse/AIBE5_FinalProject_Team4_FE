import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { getOwnedClothesForSimilarProducts, getSimilarProducts } from '@/api/similarProducts'
import { createWishlistClothes } from '@/api/wardrobe'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Check, ShoppingBag } from '@/components/icons'
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
import { GARMENT_COLORS, resolveGarmentColorCode } from '@/data/garmentColors'
import { GARMENT_STYLES, resolveGarmentStyleCode } from '@/data/garmentStyles'
import type { ClothesResponse } from '@/types/be'
import type { Garment } from '@/types'
import type {
  NaverShoppingProduct,
  SimilarProductRecommendation,
  SimilarProductSaveForm,
} from '@/types/similarProducts'
import { extractApiErrorMessage } from '@/utils/apiError'

interface SimilarProductRecommendationsProps {
  userId: number | null
  existingGarments: Garment[]
  onWishlistAdded?: () => void
  onGoToCloset?: () => void
}

const seasonOptions = [
  { code: '', label: '선택 안 함' },
  { code: 'SPRING', label: '봄' },
  { code: 'SUMMER', label: '여름' },
  { code: 'FALL', label: '가을' },
  { code: 'WINTER', label: '겨울' },
]

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim()

const formatPrice = (value: number) =>
  value > 0 ? `${new Intl.NumberFormat('ko-KR').format(value)}원` : '가격 정보 없음'

const productKey = (product: NaverShoppingProduct) =>
  product.productId || product.link

const isAlreadySavedError = (reason: unknown) =>
  axios.isAxiosError(reason) && reason.response?.status === 409

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
  const [ownedClothes, setOwnedClothes] = useState<ClothesResponse[]>([])
  const [ownedLoading, setOwnedLoading] = useState(true)
  const [ownedError, setOwnedError] = useState<string | null>(null)
  const [selectedClothesId, setSelectedClothesId] = useState<number | null>(null)
  const [recommendation, setRecommendation] =
    useState<SimilarProductRecommendation | null>(null)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [savedProductKeys, setSavedProductKeys] = useState<Set<string>>(new Set())
  const [clothesPickerOpen, setClothesPickerOpen] = useState(false)
  const [detailProduct, setDetailProduct] =
    useState<NaverShoppingProduct | null>(null)
  const [saveForm, setSaveForm] = useState<SimilarProductSaveForm | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadOwnedClothes = useCallback(async () => {
    if (userId == null) {
      setOwnedClothes([])
      setOwnedLoading(false)
      setOwnedError('로그인 후 유사 상품 추천을 이용할 수 있어요.')
      return
    }

    setOwnedLoading(true)
    setOwnedError(null)
    try {
      const items = await getOwnedClothesForSimilarProducts(userId)
      setOwnedClothes(items)
      setSelectedClothesId((current) =>
        current != null && !items.some((item) => item.clothesId === current)
          ? null
          : current,
      )
    } catch (error) {
      setOwnedClothes([])
      setOwnedError(
        extractApiErrorMessage(error, '보유 옷 목록을 불러오지 못했습니다.'),
      )
    } finally {
      setOwnedLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadOwnedClothes()
  }, [loadOwnedClothes])

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
      ownedClothes.find((item) => item.clothesId === selectedClothesId) ?? null,
    [ownedClothes, selectedClothesId],
  )

  const selectBaseClothes = (clothesId: number) => {
    setClothesPickerOpen(false)
    void requestSimilarProducts(clothesId)
  }

  const toggleProduct = (product: NaverShoppingProduct) => {
    if (isProductSaved(product)) return
    const key = productKey(product)
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const openSaveModal = () => {
    if (!recommendation || selectedItems.length === 0) return
    setSaveForm(defaultSaveForm(recommendation.baseClothes))
    setSaveOpen(true)
  }

  const saveFromDetail = (product: NaverShoppingProduct) => {
    if (isProductSaved(product)) return
    const key = productKey(product)
    setSelectedProducts((prev) => new Set(prev).add(key))
    setDetailProduct(null)
    window.setTimeout(() => {
      if (!recommendation) return
      setSaveForm(defaultSaveForm(recommendation.baseClothes))
      setSaveOpen(true)
    }, 0)
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

  const saveSelectedProducts = async () => {
    if (userId == null || !saveForm || selectedItems.length === 0) return
    setSaving(true)

    const results = await Promise.allSettled(
      selectedItems.map((product) =>
        createWishlistClothes(userId, {
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
        }),
      ),
    )

    const savedKeys = selectedItems
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
        : `${successCount}개 상품을 미보유 옷으로 저장했어요.`,
    )
    if (successCount > 0) onWishlistAdded?.()
  }

  if (ownedLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-52 lg:h-72 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (ownedError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
        <p className="text-sm font-black text-red-700">{ownedError}</p>
        <button
          type="button"
          onClick={() => void loadOwnedClothes()}
          className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (ownedClothes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
        <p className="text-sm font-black text-slate-700">
          유사한 상품을 찾으려면 먼저 옷장에 옷을 추가해 주세요.
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
        <div className="mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">기준 옷 선택</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-1">
              보유 옷을 선택하면 비슷한 상품을 찾아드려요.
            </p>
          </div>
        </div>

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
                <p className="text-[11px] font-bold text-slate-400 truncate">
                  {selectedClothes.brandName || selectedClothes.category}
                </p>
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
                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  보유 옷 {ownedClothes.length}개
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
              onClick={() => void loadOwnedClothes()}
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
                  최대 10개 결과 · {recommendation.products.length}개
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendation.products.map((product) => {
                  const key = productKey(product)
                  const selected = selectedProducts.has(key)
                  const storageStatus = getProductStorageStatus(product)
                  const saved = storageStatus != null
                  const statusLabel =
                    storageStatus === 'owned' ? '보유 중' : '저장됨'
                  return (
                    <article
                      key={key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetailProduct(product)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setDetailProduct(product)
                        }
                      }}
                      className={`group rounded-2xl border overflow-hidden bg-slate-50 transition-all hover:-translate-y-1 hover:shadow-lg ${
                        saved
                          ? 'border-emerald-200'
                          : selected
                          ? 'border-[#111827] ring-2 ring-[#C4B5FD]'
                          : 'border-slate-100'
                      } cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4B5FD]`}
                    >
                      <div className="relative h-44 sm:h-52 lg:h-72 bg-slate-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={stripHtml(product.title)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                        <button
                          type="button"
                          disabled={saved}
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleProduct(product)
                          }}
                          aria-pressed={selected}
                          className={`absolute top-2 right-2 ${saved ? 'w-12' : 'w-8'} h-8 rounded-full grid place-items-center border shadow-sm transition ${
                            saved
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : selected
                              ? 'bg-[#111827] text-white border-[#111827]'
                              : 'bg-white/90 text-slate-500 border-white'
                          }`}
                          aria-label={saved ? statusLabel : selected ? '선택 해제' : '저장할 상품 선택'}
                        >
                          {saved ? (
                            <span className="text-[9px] font-black">{statusLabel}</span>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                          <p className="text-[10px] font-bold text-white/75 truncate">
                            {product.brand || product.mallName || '네이버쇼핑'}
                          </p>
                          <h4 className="text-sm font-black line-clamp-2 leading-snug">
                            {stripHtml(product.title)}
                          </h4>
                          <strong className="block mt-1 text-sm">
                            {formatPrice(product.lowestPrice)}
                          </strong>
                        </div>
                      </div>
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="h-10 flex items-center justify-center gap-1.5 text-xs font-black text-slate-700 hover:bg-white"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        구매 페이지
                      </a>
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
          subtitle={`보유 옷 ${ownedClothes.length}개`}
          onClose={() => setClothesPickerOpen(false)}
        />
        <ModalBody className="p-4 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-2.5 gap-y-4">
            {ownedClothes.map((item) => {
              const selected = selectedClothesId === item.clothesId
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
        </ModalBody>
      </Modal>

      <Modal
        open={detailProduct != null}
        onClose={() => setDetailProduct(null)}
        size="md"
        placement="sheet"
      >
        {detailProduct && (
          <>
            <ModalHeader
              title="상품 상세"
              eyebrow={detailProduct.brand || detailProduct.mallName || '네이버쇼핑'}
              onClose={() => setDetailProduct(null)}
            />
            <ModalBody className="p-5 sm:p-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={detailProduct.image}
                  alt={stripHtml(detailProduct.title)}
                  className="w-full h-full object-contain bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-5 text-left">
                <p className="text-xs font-black text-slate-400">
                  {detailProduct.mallName || '네이버쇼핑'}
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950 leading-snug">
                  {stripHtml(detailProduct.title)}
                </h3>
                <strong className="block mt-3 text-xl text-slate-950">
                  {formatPrice(detailProduct.lowestPrice)}
                </strong>
                {detailProduct.highestPrice &&
                  detailProduct.highestPrice > detailProduct.lowestPrice && (
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      최고가 {formatPrice(detailProduct.highestPrice)}
                    </p>
                  )}

                <dl className="mt-4 grid grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <dt className="text-[10px] font-black text-slate-400">브랜드</dt>
                    <dd className="mt-1 text-xs font-black text-slate-700 truncate">
                      {detailProduct.brand || '정보 없음'}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <dt className="text-[10px] font-black text-slate-400">판매처</dt>
                    <dd className="mt-1 text-xs font-black text-slate-700 truncate">
                      {detailProduct.mallName || '정보 없음'}
                    </dd>
                  </div>
                </dl>
              </div>
            </ModalBody>
            <ModalFooter className="p-4 grid grid-cols-2 gap-2">
              <a
                href={detailProduct.link}
                target="_blank"
                rel="noreferrer"
                className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-black flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                구매 페이지
              </a>
              <button
                type="button"
                disabled={isProductSaved(detailProduct)}
                onClick={() => saveFromDetail(detailProduct)}
                className="h-11 rounded-xl bg-[#111827] text-white text-sm font-black disabled:bg-emerald-500"
              >
                {getProductStorageStatus(detailProduct) === 'owned'
                  ? '보유 중'
                  : isProductSaved(detailProduct)
                    ? '저장됨'
                    : '저장하기'}
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal
        open={saveOpen}
        onClose={() => !saving && setSaveOpen(false)}
        preventClose={saving}
        size="md"
        placement="sheet"
      >
        <ModalHeader
          title="상품 정보 확인"
          subtitle={`선택한 ${selectedItems.length}개 상품에 공통으로 적용됩니다.`}
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
            {saving ? '저장 중…' : `${selectedItems.length}개 미보유 옷으로 저장`}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
