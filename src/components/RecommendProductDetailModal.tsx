import { useEffect, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import BrandDisplay from '@/components/common/BrandDisplay'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { getGarmentStyleLabel } from '@/data/garmentStyles'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'


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
    onSelect?: () => void
    selectLabel?: string
    zIndex?: 100 | 110 | 120 | 130
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
                                                        userId: _userId,
                                                        wishlisted = false,
                                                        wishlistSubmitting = false,
                                                        onWishlistToggle,
                                                        onExclude: _onExclude,
                                                        onDislike,
                                                        dislikeSubmitting = false,
                                                        onPurchaseConfirm,
                                                        purchaseConfirmSubmitting = false,
                                                        onSelect,
                                                        selectLabel,
                                                        zIndex = 100,
                                                    }: RecommendProductDetailModalProps) {
    const [purchaseOpened, setPurchaseOpened] = useState(false)

    useEffect(() => {
        if (!open || !item) setPurchaseOpened(false)
    }, [open, item])

    if (!open || !item) return null

    const categoryLabel = item.categoryLabel
        ?? ({ Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발' } as const)[item.category]
    const styles = Array.from(new Set([
        ...(item.styles || []),
        ...(item.style && item.style !== '-' && item.style !== '—' ? [item.style] : [])
    ])).filter(s => s && s.trim().length > 0)

    const allColors: RecommendColorChip[] = []
    const colorMap = new Map<string, string | undefined>()

    if (item.color && item.color !== '-' && item.color !== '—') {
        colorMap.set(item.color, item.colorHex)
    }
    if (item.secondaryColors) {
        item.secondaryColors.forEach(c => {
            if (c.label && c.label !== '-' && c.label !== '—') {
                if (!colorMap.has(c.label)) {
                    colorMap.set(c.label, c.hex)
                }
            }
        })
    }
    colorMap.forEach((hex, label) => {
        allColors.push({ label, hex })
    })

    const hasStyles = styles.length > 0
    const hasColors = allColors.length > 0
    const canToggleWishlist = !item.isAnchor && Boolean(onWishlistToggle)

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
            zIndex={zIndex}
            closeOnBackdrop
            panelClassName="max-h-[92vh]"
        >
            <ModalHeader
                title="상품 상세"
                titleId="recommend-product-detail-title"
                className="[&_h3]:text-lg [&_h3]:font-black"
                onClose={onClose}
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

                <div className="px-5 py-4">
                    <div className="mb-4">
                        <h4 className="text-xl font-black text-slate-900 leading-tight">{item.title}</h4>
                    </div>
                    {item.brandLabel && (
                        <DetailRow label="브랜드">
                            <BrandDisplay label={item.brandLabel} logoUrl={item.brandLogoUrl ?? null} />
                        </DetailRow>
                    )}
                    <DetailRow label="카테고리">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{categoryLabel}</p>
                            {item.itemTypeLabel ? <p className="text-xs font-bold text-slate-500">{item.itemTypeLabel}</p> : null}
                        </div>
                    </DetailRow>
                    <DetailRow label="스타일">
                        <div className="flex flex-wrap gap-1.5">
                            {hasStyles ? (
                                styles.map((style, idx) => (
                                    <span key={`${style}-${idx}`} className="inline-flex rounded-lg bg-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-bold">
                                        {getGarmentStyleLabel(style)}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm font-black text-slate-900">-</span>
                            )}
                        </div>
                    </DetailRow>
                    {hasColors ? (
                        <DetailRow label="컬러">
                            <div className="flex flex-wrap gap-1.5">
                                {allColors.map((color, index) => (
                                    <ColorSwatch key={`${color.label}-${index}`} color={color} />
                                ))}
                            </div>
                        </DetailRow>
                    ) : (
                        <DetailRow label="컬러">
                            <span className="text-sm font-black text-slate-900">-</span>
                        </DetailRow>
                    )}
                </div>
            </ModalBody>

            <ModalFooter className="px-5 py-4 space-y-2">
                {onSelect && (
                    <button
                        type="button"
                        onClick={() => {
                            onSelect()
                            onClose()
                        }}
                        className="flex w-full h-11 items-center justify-center rounded-2xl bg-[#111827] text-white text-sm font-black hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        {selectLabel || '이 제품으로 교체'}
                    </button>
                )}

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

                {canToggleWishlist && (
                    <button
                        type="button"
                        onClick={onWishlistToggle}
                        disabled={wishlistSubmitting}
                        className="flex w-full h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm font-black"
                    >
                        {wishlisted ? '위시리스트에서 해제' : '위시리스트에 추가'}
                    </button>
                )}

                {onDislike && (
                    <button
                        type="button"
                        onClick={onDislike}
                        disabled={dislikeSubmitting}
                        className="flex w-full h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm font-black hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-60"
                    >
                        {dislikeSubmitting ? '처리 중...' : '마음에 들지 않아요'}
                    </button>
                )}
            </ModalFooter>
        </Modal>
    )
}
