import { useEffect, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import BrandDisplay from '@/components/common/BrandDisplay'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Heart } from '@/components/icons'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'
import { useToast } from './Toast'
import { postRecommendationFeedback, RecommendationFeedbackType } from '@/api/recommendations'
import { createWishlistClothes } from '@/api/wardrobe'
import { buildWishlistPayloadFromRecommendedItem } from '@/utils/recommendWishlistPayload'


interface RecommendProductDetailModalProps {
    open: boolean
    item: RecommendCardItem | null
    onClose: () => void
    userId: number | null
    wishlisted?: boolean
    wishlistSubmitting?: boolean
    onWishlistToggle?: () => void
    onExclude?: () => void
    onDislike?: () => void
    dislikeSubmitting?: boolean
    onPurchaseConfirm?: () => Promise<boolean>
    purchaseConfirmSubmitting?: boolean
}

function ColorSwatch({ color }: { color: RecommendColorChip }) {
    const hex = color.hex ?? '#E2E8F0'
    const lightBorder = hex.toUpperCase() === '#FFFFFF'
        || hex.toUpperCase() === '#FDD835'
        || hex.toUpperCase() === '#D2B48C'
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1">
      <span
          className={`w-3.5 h-3.5 rounded-full shrink-0 ${lightBorder ? 'border border-slate-200' : ''}`}
          style={{ backgroundColor: hex }}
          aria-hidden
      />
      <span className="text-xs font-bold text-slate-700">{color.label}</span>
    </span>
    )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
            <span className="w-16 shrink-0 text-xs font-black text-slate-400 pt-0.5">{label}</span>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    )
}

export default function RecommendProductDetailModal({
                                                        open,
                                                        item,
                                                        onClose,
                                                        userId,
                                                        wishlisted = false,
                                                        wishlistSubmitting = false,
                                                        onWishlistToggle,
                                                        onExclude,
                                                        onDislike,
                                                        dislikeSubmitting = false,
                                                        onPurchaseConfirm,
                                                        purchaseConfirmSubmitting = false,
                                                    }: RecommendProductDetailModalProps) {
    const { showToast } = useToast()
    const [purchaseOpened, setPurchaseOpened] = useState(false)

    useEffect(() => {
        if (!open || !item) setPurchaseOpened(false)
    }, [open, item?.id])

    if (!open || !item) return null

    const categoryLabel = item.categoryLabel
        ?? ({ Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발' } as const)[item.category]
    const styles = item.styles.length > 0 ? item.styles : item.style !== '-' ? [item.style] : []
    const allColors: RecommendColorChip[] = [
        { label: item.color, hex: item.colorHex },
        ...item.secondaryColors,
    ]
    const canToggleWishlist = !item.isAnchor && Boolean(onWishlistToggle)

    const handleFeedback = async (type: RecommendationFeedbackType) => {
        const uid = userId
        if (!uid) {
            showToast('error', '로그인이 필요한 작업입니다.')
            return
        }
        try {
            if (type === 'SAVED') {
                if (onWishlistToggle) {
                    await onWishlistToggle()
                } else {
                    if (!item.source) {
                        await postRecommendationFeedback(uid, { feedbackType: type, clothesId: item.clothesId ?? undefined })
                        showToast('success', '추천을 저장했습니다.')
                    } else {
                        await createWishlistClothes(uid, buildWishlistPayloadFromRecommendedItem(item.source))
                        showToast('success', '위시리스트에 저장했습니다.')
                    }
                }
                if (!onWishlistToggle) onClose()
            } else if (type === 'EXCLUDE') {
                if (onExclude) {
                    await onExclude()
                } else {
                    await postRecommendationFeedback(uid, { feedbackType: type, clothesId: item.clothesId ?? undefined })
                    showToast('success', '해당 상품을 추천에서 제외했습니다.')
                }
                onClose()
            }
        } catch {
            showToast('error', '요청에 실패했습니다.')
        }
    }

    const handlePurchaseClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        window.open(item.purchaseUrl!, '_blank', 'noopener,noreferrer')
        if (onPurchaseConfirm) setPurchaseOpened(true)
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            titleId="recommend-product-detail-title"
            size="sm"
            placement="sheet"
            zIndex={100}
            closeOnBackdrop
            panelClassName="max-h-[92vh]"
        >
            <ModalHeader
                eyebrow={<span className="text-[11px] font-black text-slate-900">{item.brandLabel}</span>}
                title="상품 상세"
                titleId="recommend-product-detail-title"
                className="[&_h3]:text-lg [&_h3]:font-black"
                trailing={
                    canToggleWishlist ? (
                        <button
                            type="button"
                            onClick={onWishlistToggle}
                            disabled={wishlistSubmitting}
                            aria-pressed={wishlisted}
                            aria-label={wishlisted ? '위시리스트에서 빼기' : '위시리스트에 추가'}
                            className={`p-2 rounded-full border bg-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                wishlisted
                                    ? 'border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300'
                                    : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${wishlisted ? 'text-rose-500 fill-rose-500' : ''}`} />
                        </button>
                    ) : null
                }
            />

            <ModalBody>
                <div className="aspect-square bg-slate-50 border-b border-slate-100">
                    <AuthenticatedImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-contain p-4"
                        fallback={
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                                이미지 없음
                            </div>
                        }
                    />
                </div>

                <div className="px-5 py-2">
                    <div className="mb-3">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{item.title}</h4>
                    </div>
                    <DetailRow label="카테고리">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{categoryLabel}</p>
                            {item.itemTypeLabel ? <p className="text-xs font-bold text-slate-500">{item.itemTypeLabel}</p> : null}
                        </div>
                    </DetailRow>
                    <DetailRow label="스타일">
                        {styles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {styles.map((style) => (
                                    <span key={style} className="inline-flex rounded-full bg-[#F3E8FF] text-[#1E3A8A] px-2.5 py-1 text-xs font-black">
                    {style}
                  </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-slate-400">-</p>
                        )}
                    </DetailRow>
                    <DetailRow label="컬러">
                        <div className="flex flex-wrap gap-1.5">
                            {allColors.map((color, index) => (
                                <ColorSwatch key={`${color.label}-${index}`} color={color} />
                            ))}
                        </div>
                    </DetailRow>
                </div>
            </ModalBody>

            <ModalFooter className="px-5 py-4 space-y-2">
                {item.hasDirectPurchaseUrl && item.purchaseUrl && item.purchaseUrl !== '#' && (
                    <a
                        href={item.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handlePurchaseClick}
                        className={`flex w-full h-11 items-center justify-center rounded-2xl bg-[#03C75A] text-white text-sm font-black hover:bg-[#02b351] transition-colors cursor-pointer ${purchaseConfirmSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {purchaseConfirmSubmitting ? '처리 중...' : '네이버쇼핑에서 구매하기'}
                    </a>
                )}

                {purchaseOpened && onPurchaseConfirm && (
                    <button
                        type="button"
                        onClick={() => { void onPurchaseConfirm(); setPurchaseOpened(false) }}
                        disabled={purchaseConfirmSubmitting}
                        className="w-full h-11 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                        {purchaseConfirmSubmitting ? '처리 중...' : '좋아요! 옷장에 추가하기' }
                    </button>
                )}

                {onDislike && (
                    <button
                        type="button"
                        onClick={onDislike}
                        disabled={dislikeSubmitting}
                        className="flex w-full h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm font-black hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-60"
                    >
                        {dislikeSubmitting ? '처리 중...' : '이런 추천 싫어요'}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                >
                    닫기
                </button>
            </ModalFooter>
        </Modal>
    )
}
