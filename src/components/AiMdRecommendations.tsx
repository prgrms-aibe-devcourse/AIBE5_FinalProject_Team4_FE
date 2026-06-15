import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  fetchAiMdOutfits,
  fetchAiMdProducts,
  fetchAiMds,
  saveAiMdOutfit,
  toAiMdOutfitSaveRequest,
} from '@/api/aiMd'
import { createWishlistClothes } from '@/api/wardrobe'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Check, ShoppingBag, Sparkles } from '@/components/icons'
import {
  BE_CATEGORY_TO_UI,
  CATEGORY_ITEM_TYPES,
  type BeCategoryCode,
} from '@/data/categoryItemTypes'
import type { ClothesGender } from '@/data/garmentGender'
import { GARMENT_COLORS } from '@/data/garmentColors'
import { GARMENT_STYLES } from '@/data/garmentStyles'
import type {
  AiMd,
  AiMdId,
  AiMdOutfitRecommendation,
  AiMdProductRecommendation,
} from '@/types/aiMd'
import type { NaverShoppingProduct, SimilarProductSaveForm } from '@/types/similarProducts'
import type { Garment } from '@/types'
import type { UserGender } from '@/utils/genderClothesFilter'
import { extractApiErrorMessage } from '@/utils/apiError'

interface AiMdRecommendationsProps {
  userId: number | null
  gender: UserGender
  existingGarments: Garment[]
  onWishlistAdded?: () => void
}

type RecommendationMode = 'outfits' | 'products'

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

export default function AiMdRecommendations({
  userId,
  gender,
  existingGarments,
  onWishlistAdded,
}: AiMdRecommendationsProps) {
  const [mds, setMds] = useState<AiMd[]>([])
  const [selectedMdId, setSelectedMdId] = useState<AiMdId | null>(null)
  const [mode, setMode] = useState<RecommendationMode>('outfits')
  const [mdLoading, setMdLoading] = useState(true)
  const [mdError, setMdError] = useState<string | null>(null)
  const [recommendLoading, setRecommendLoading] = useState(false)
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
  const [toast, setToast] = useState<string | null>(null)

  const selectedMd = useMemo(
    () => mds.find((md) => md.id === selectedMdId) ?? null,
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

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

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

  const changeMode = (nextMode: RecommendationMode) => {
    if (recommendLoading || mode === nextMode) return
    setMode(nextMode)
    resetResults()
  }

  const requestRecommendations = async () => {
    if (userId == null || !selectedMdId || recommendLoading) return
    setRecommendLoading(true)
    setRecommendError(null)
    setSelectedOutfits(new Set())
    setSelectedProducts(new Set())
    setSavedOutfits(new Set())

    try {
      if (mode === 'outfits') {
        const result = await fetchAiMdOutfits(userId, selectedMdId)
        setOutfits(result.outfits)
        setProducts([])
      } else {
        const result = await fetchAiMdProducts(userId, selectedMdId)
        setProducts(result.products)
        setOutfits([])
      }
    } catch (error) {
      setRecommendError(
        extractApiErrorMessage(error, 'AI MD 추천을 불러오지 못했습니다.'),
      )
    } finally {
      setRecommendLoading(false)
    }
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

  const toggleProduct = (product: NaverShoppingProduct) => {
    if (isProductSaved(product)) return
    const key = productKey(product)
    setSelectedProducts((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
    setToast(
      failedCount
        ? `${savedKeys.length}개 저장, ${failedCount}개는 저장하지 못했어요.`
        : `${savedKeys.length}개 코디를 저장했어요.`,
    )
  }

  const openProductSave = (items = chosenProducts) => {
    if (!selectedMd || items.length === 0) return
    setSaveForm(createProductSaveForm(items[0].product, gender, selectedMd))
    setSaveOpen(true)
  }

  const saveFromDetail = (item: AiMdProductRecommendation) => {
    if (isProductSaved(item.product)) return
    setSelectedProducts(new Set([productKey(item.product)]))
    setDetailProduct(null)
    window.setTimeout(() => openProductSave([item]), 0)
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

  const saveChosenProducts = async () => {
    if (userId == null || !saveForm || chosenProducts.length === 0) return
    setSavingProducts(true)

    const results = await Promise.allSettled(
      chosenProducts.map(({ product }) =>
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

    const savedKeys = chosenProducts
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
    setToast(
      failedCount
        ? `${successCount}개 저장, ${failedCount}개는 저장하지 못했어요.`
        : `${successCount}개 상품을 미보유 옷으로 저장했어요.`,
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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black text-slate-500 mb-3">나와 맞는 MD 선택</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mds.map((md) => {
            const selected = md.id === selectedMdId
            return (
              <button
                key={md.id}
                type="button"
                disabled={recommendLoading}
                onClick={() => selectMd(md.id)}
                className={`min-h-28 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  selected
                    ? 'border-[#111827] bg-[#111827] text-white ring-2 ring-[#C4B5FD]'
                    : 'border-slate-100 bg-slate-50 text-slate-800 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm font-black">{md.name}</strong>
                  {selected && <Check className="w-4 h-4 text-[#C4B5FD]" />}
                </div>
                <p className={`mt-2 text-[10px] font-bold leading-relaxed line-clamp-2 ${
                  selected ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {md.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {md.styleNames.slice(0, 3).map((style) => (
                    <span
                      key={style}
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                        selected ? 'bg-white/10 text-white/80' : 'bg-white text-slate-500'
                      }`}
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
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
                className={`rounded-2xl border overflow-hidden bg-white transition ${
                  selected
                    ? 'border-[#111827] ring-2 ring-[#C4B5FD]'
                    : saved
                      ? 'border-emerald-200'
                      : 'border-slate-100'
                }`}
              >
                <button
                  type="button"
                  disabled={saved || savingOutfits}
                  onClick={() => toggleOutfit(key)}
                  className="w-full text-left disabled:cursor-default"
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
                    <span className={`absolute top-2 right-2 min-w-8 h-8 px-2 rounded-full grid place-items-center text-[10px] font-black shadow ${
                      saved
                        ? 'bg-emerald-500 text-white'
                        : selected
                          ? 'bg-[#111827] text-white'
                          : 'bg-white/90 text-slate-500'
                    }`}>
                      {saved ? '저장됨' : <Check className="w-4 h-4" />}
                    </span>
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
              </article>
            )
          })}
        </div>
      )}

      {!recommendLoading && mode === 'products' && products.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((item) => {
            const { product } = item
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
                onClick={() => setDetailProduct(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setDetailProduct(item)
                  }
                }}
                className={`group rounded-2xl border overflow-hidden bg-slate-50 transition hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                  saved
                    ? 'border-emerald-200'
                    : selected
                    ? 'border-[#111827] ring-2 ring-[#C4B5FD]'
                    : 'border-slate-100'
                }`}
              >
                <div className="relative h-44 sm:h-52 lg:h-72 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={stripHtml(product.title)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    disabled={saved}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleProduct(product)
                    }}
                    className={`absolute top-2 right-2 ${saved ? 'w-12' : 'w-8'} h-8 rounded-full grid place-items-center border shadow-sm ${
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
                    <h3 className="text-sm font-black line-clamp-2 leading-snug">
                      {stripHtml(product.title)}
                    </h3>
                    <strong className="block mt-1 text-sm">
                      {formatPrice(product.lowestPrice)}
                    </strong>
                  </div>
                </div>
              </article>
            )
          })}
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

      <Modal
        open={detailProduct != null}
        onClose={() => setDetailProduct(null)}
        size="md"
        placement="sheet"
      >
        {detailProduct && (
          <>
            <ModalHeader
              title="추천 상품"
              eyebrow={detailProduct.product.brand || detailProduct.product.mallName || '네이버쇼핑'}
              onClose={() => setDetailProduct(null)}
            />
            <ModalBody className="p-5 sm:p-6">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white">
                <img
                  src={detailProduct.product.image}
                  alt={stripHtml(detailProduct.product.title)}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950 leading-snug">
                {stripHtml(detailProduct.product.title)}
              </h3>
              <strong className="block mt-3 text-xl text-slate-950">
                {formatPrice(detailProduct.product.lowestPrice)}
              </strong>
              <div className="mt-4 rounded-2xl bg-[#F3E8FF]/60 border border-[#DDD6FE] p-4">
                <p className="text-[10px] font-black text-[#6D28D9]">AI MD 추천 이유</p>
                <p className="mt-1 text-xs font-bold text-slate-700 leading-relaxed">
                  {detailProduct.reason}
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="p-4 grid grid-cols-2 gap-2">
              <a
                href={detailProduct.product.link}
                target="_blank"
                rel="noreferrer"
                className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-black flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                구매 페이지
              </a>
              <button
                type="button"
                disabled={isProductSaved(detailProduct.product)}
                onClick={() => saveFromDetail(detailProduct)}
                className="h-11 rounded-xl bg-[#111827] text-white text-sm font-black disabled:bg-emerald-500"
              >
                {getProductStorageStatus(detailProduct.product) === 'owned'
                  ? '보유 중'
                  : isProductSaved(detailProduct.product)
                    ? '저장됨'
                    : '저장하기'}
              </button>
            </ModalFooter>
          </>
        )}
      </Modal>

      <Modal
        open={saveOpen}
        onClose={() => !savingProducts && setSaveOpen(false)}
        preventClose={savingProducts}
        size="md"
        placement="sheet"
      >
        <ModalHeader
          title="상품 정보 확인"
          subtitle={`선택한 ${chosenProducts.length}개 상품에 공통으로 적용됩니다.`}
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
              : `${chosenProducts.length}개 미보유 옷으로 저장`}
          </button>
        </ModalFooter>
      </Modal>

      {toast && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-50 rounded-full bg-[#111827] text-white px-4 py-2.5 text-xs font-black shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
