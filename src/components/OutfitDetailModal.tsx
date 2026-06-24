import React, { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { createOutfit, updateOutfit, deleteOutfit } from '@/api/outfits'
import { postRecommendationFeedback } from '@/api/recommendations'
import { useToast } from './Toast'
import { Shirt, CloudRain, Sparkles, Trash2, RefreshCw } from '@/components/icons'
import ClothesSelectModal from './ClothesSelectModal'
import ExitConfirmModal from '@/components/common/ExitConfirmModal'
import { Garment } from '@/types'

export interface OutfitModalItem {
  clothesId?: number
  name?: string
  brand?: string
  imageUrl?: string
  userImageUrl?: string
  category?: string
}

interface OutfitDetailModalProps {
  open: boolean
  combination: {
    top?: OutfitModalItem | null
    bottom?: OutfitModalItem | null
    outer?: OutfitModalItem | null
    shoes?: OutfitModalItem | null
    totalScore?: number
    weatherLabel?: string
    favorite?: boolean
    outfitId?: number
    bookId?: number
    title?: string
    description?: string
    saveDisabledMessage?: string
    saveOverride?: () => Promise<void>
    saveSuccessMessage?: string
    saveButtonLabel?: string
    hideFavoriteAction?: boolean
  } | null
  onClose: () => void
  onSaved?: () => void
  onFavoriteCreated?: (outfitId: number) => void
  userId?: number | null
  clothes?: Garment[]
}

export default function OutfitDetailModal({
                                            open,
                                            combination,
                                            onClose,
                                            onSaved,
                                            onFavoriteCreated,
                                            userId,
                                            clothes = []
                                          }: OutfitDetailModalProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [disliking, setDisliking] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [editCombo, setEditCombo] = useState<any>(null)
  const [showSelectModal, setShowSelectModal] = useState<{ open: boolean; category: string; title: string }>({
    open: false,
    category: '',
    title: ''
  })

  const { showToast } = useToast()
  const saveDisabledMessage = editCombo?.saveDisabledMessage as string | undefined
  const isSaveDisabled = Boolean(saveDisabledMessage)
  const saveOverride = editCombo?.saveOverride as (() => Promise<void>) | undefined

  // 모달 닫힐 때 isDirty, isEditing 초기화
  useEffect(() => {
    if (!open) {
      setIsDirty(false)
      setIsEditing(false)
    }
  }, [open])

  // 닫기 핸들러 - isDirty 체크
  const handleClose = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      onClose()
    }
  }

  // editCombo 초기화
  useEffect(() => {
    if (open && combination) {
      const augmentItem = (item: any) => {
        if (!item) return item
        const clothesId = item.clothesId ?? null
        if (!clothesId) return item
        const matched = clothes.find((g) => Number(g.id) === Number(clothesId))
        const ownershipStatus = matched ? (matched.isWishlist ? 'WISHLIST' : 'OWNED') : undefined
        return { ...item, ownershipStatus }
      }
      setEditCombo({
        ...combination,
        top: augmentItem(combination.top),
        bottom: augmentItem(combination.bottom),
        outer: augmentItem(combination.outer),
        shoes: augmentItem(combination.shoes),
      })
      setIsDirty(false)
    }
  }, [open, combination, clothes])

  if (!open || !combination || !editCombo) return null

  const handleSave = async () => {
    if (isSaveDisabled) {
      showToast('info', saveDisabledMessage!)
      return
    }
    if (saveOverride) {
      setSaving(true)
      try {
        await saveOverride()
        showToast('success', editCombo.saveSuccessMessage ?? '코디가 저장되었습니다.')
        onSaved?.()
        setIsDirty(false)
        onClose()
      } catch (err) {
        console.error('Failed to save outfit with override', err)
        showToast('error', '코디 저장에 실패했습니다.')
      } finally {
        setSaving(false)
      }
      return
    }
    if (!editCombo.bookId) { showToast('error', '코디북 정보를 불러오지 못했습니다.'); return }
    setSaving(true)
    try {
      const payload = {
        title: editCombo.title || [editCombo.top?.name, editCombo.bottom?.name].filter(Boolean).join(' + ') || '추천 코디',
        description: editCombo.description || editCombo.weatherLabel || '추천 코디',
        thumbnailUrl: editCombo.top?.imageUrl || editCombo.top?.userImageUrl || editCombo.bottom?.imageUrl || editCombo.bottom?.userImageUrl || editCombo.outer?.imageUrl || editCombo.outer?.userImageUrl || '',
        situation: '일상',
        season: 'ALL_SEASON',
        favorite: editCombo.outfitId ? (editCombo.favorite ?? false) : false,
        items: [
          { item: editCombo.top, itemRole: 'TOP', layerOrder: 1 },
          { item: editCombo.bottom, itemRole: 'BOTTOM', layerOrder: 2 },
          { item: editCombo.outer, itemRole: 'OUTER', layerOrder: 3 },
          { item: editCombo.shoes, itemRole: 'SHOES', layerOrder: 4 },
        ]
            .filter(it => it.item != null && it.item?.clothesId != null)
            .map(it => ({ clothesId: it.item!.clothesId as number, itemRole: it.itemRole, layerOrder: it.layerOrder })),
      }
      if (editCombo.outfitId) {
        await updateOutfit(editCombo.bookId, editCombo.outfitId, payload)
        showToast('success', '코디가 수정되었습니다.')
      } else {
        const result = await createOutfit(editCombo.bookId, payload)
        showToast('success', '코디가 저장되었습니다.')
        if (onFavoriteCreated && result?.outfitId) {
          onFavoriteCreated(result.outfitId)
        }
      }
      onSaved?.()
      setIsDirty(false)
      onClose()
    } catch {
      showToast('error', '코디 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!editCombo.bookId || !editCombo.outfitId) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!editCombo.bookId || !editCombo.outfitId) return
    setDeleting(true)
    try {
      await deleteOutfit(editCombo.bookId, editCombo.outfitId)
      showToast('success', '코디가 삭제되었습니다.')
      onSaved?.()
      setIsDirty(false)
      onClose()
    } catch {
      showToast('error', '코디 삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDislike = async () => {
    if (!userId) return
    const clothesIds = [editCombo.top, editCombo.bottom, editCombo.outer, editCombo.shoes]
        .filter(Boolean).map(item => item?.clothesId).filter(Boolean) as number[]
    if (clothesIds.length === 0) return
    setDisliking(true)
    try {
      await Promise.all(clothesIds.map(clothesId =>
          postRecommendationFeedback(userId, { feedbackType: 'DISLIKE', clothesId })
      ))
      showToast('success', '이 코디를 싫어요 처리했습니다.')
      onSaved?.()
      setIsDirty(false)
      onClose()
    } catch {
      showToast('error', '싫어요 처리에 실패했습니다.')
    } finally {
      setDisliking(false)
    }
  }

  const handleItemReplace = (category: string) => {
    if (isSaveDisabled) {
      showToast('info', saveDisabledMessage!)
      return
    }
    if (saveOverride) {
      showToast('info', 'AI MD 추천 코디는 상세에서 아이템을 변경하지 않고 저장해 주세요.')
      return
    }
    const labelMap: Record<string, string> = { TOP: '상의', BOTTOM: '하의', OUTER: '아우터', SHOES: '신발' }
    setShowSelectModal({ open: true, category, title: `${labelMap[category] || category} 변경` })
  }

  const onSelectClothes = (garment: Garment) => {
    const roleKey = showSelectModal.category.toLowerCase()
    setIsDirty(true)
    setEditCombo((prev: any) => ({
      ...prev,
      [roleKey]: {
        clothesId: Number(garment.id),
        name: garment.name,
        brand: garment.be?.brandName,
        imageUrl: garment.thumbnailUrl,
        category: garment.category
      }
    }))
  }

  const handleItemClick = (category: string, _item: OutfitModalItem | null | undefined) => {
    if (!(isSaveDisabled || saveOverride)) {
      handleItemReplace(category)
    }
  }

  const WeatherIcon = (() => {
    const label = (editCombo.weatherLabel || '').toLowerCase()
    if (label.includes('맑') || label.includes('clear') || label.includes('sun')) return Sparkles
    if (label.includes('비') || label.includes('rain')) return CloudRain
    return CloudRain
  })()

  return (
      <>
        <Modal open={open} onClose={handleClose} titleId="outfit-detail-title" size="md" placement="center" zIndex={100} closeOnBackdrop={true}>
          <ModalHeader
              title={editCombo.outfitId ? '코디 편집' : '코디 상세'}
              titleId="outfit-detail-title"
              onClose={handleClose}
          />
          <ModalBody className="p-5">
            <div className="space-y-6">
              {editCombo.outfitId && isEditing && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">코디 이름</label>
                    <input
                        type="text"
                        value={editCombo.title || ''}
                        onChange={e => {
                          setIsDirty(true)
                          setEditCombo({...editCombo, title: e.target.value})
                        }}
                        className="w-full h-11 px-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                        placeholder="코디 이름을 입력하세요"
                    />
                  </div>
              )}

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { role: 'TOP', label: '상의', item: editCombo.top },
                  { role: 'BOTTOM', label: '하의', item: editCombo.bottom },
                  { role: 'OUTER', label: '아우터', item: editCombo.outer },
                  { role: 'SHOES', label: '신발', item: editCombo.shoes }
                ].map(({ role, label, item }) => (
                    <div key={role} className="flex-none w-1/3 text-center">
                      <div className="relative group/item">
                        <div className="relative">
                          <div className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden mb-2 flex items-center justify-center border border-slate-100">
                            {(() => {
                              const img = item?.imageUrl || item?.userImageUrl
                              return img ? (
                                  <AuthenticatedImage src={img} alt={item?.name ?? ''} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="flex flex-col items-center gap-1 text-slate-300">
                                    <Shirt className="w-8 h-8 opacity-40" />
                                    <span className="text-[10px] font-bold">비어있음</span>
                                  </div>
                              )
                            })()}
                          </div>
                          {item?.ownershipStatus === 'OWNED' && (
                              <span className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">보유</span>
                          )}
                          {item?.ownershipStatus === 'WISHLIST' && (
                              <span className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black">위시리스트</span>
                          )}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleItemClick(role, item)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer"
                        >
                          <RefreshCw className="w-6 h-6 text-white" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate px-1">{item?.name ?? '—'}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    {label}
                  </span>
                    </div>
                ))}
              </div>

              {!editCombo.outfitId && (
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#111827]">
                      <WeatherIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">추천 정보</p>
                      <p className="text-sm font-black text-slate-800">{editCombo.weatherLabel ?? '—'}</p>
                    </div>
                  </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="px-5 py-4 space-y-2">
            <button
                type="button"
                onClick={() => {
                  if (editCombo.outfitId && !isEditing) {
                    setIsEditing(true)
                  } else {
                    handleSave()
                  }
                }}
                disabled={saving}
                className={`h-12 w-full flex items-center justify-center rounded-2xl text-sm font-black transition-colors shadow-lg shadow-slate-200 ${
                    isSaveDisabled && (isEditing || !editCombo.outfitId)
                        ? 'bg-slate-200 text-slate-500 hover:bg-slate-200'
                        : 'bg-[#111827] text-white hover:bg-slate-800'
                }`}
            >
              {saving
                  ? '처리 중…'
                  : isSaveDisabled && (isEditing || !editCombo.outfitId)
                      ? '선택 후 저장하기'
                      : editCombo.outfitId
                          ? isEditing ? '코디 저장하기' : '코디 수정하기'
                          : '코디 저장하기'}
            </button>

            {editCombo.outfitId ? (
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-12 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm font-black hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  {deleting ? '삭제 중…' : '코디 삭제'}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleDislike}
                    disabled={disliking || !userId}
                    className="h-12 w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm font-black hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  {disliking ? '싫어요' : '코디 싫어요'}
                </button>
            )}
          </ModalFooter>
        </Modal>

        <ClothesSelectModal
            open={showSelectModal.open}
            onClose={() => setShowSelectModal({ ...showSelectModal, open: false })}
            category={showSelectModal.category}
            title={showSelectModal.title}
            clothes={clothes}
            onSelect={onSelectClothes}
            zIndex={120}
        />

        <Modal
            open={showDeleteConfirm}
            onClose={() => !deleting && setShowDeleteConfirm(false)}
            size="sm"
            placement="center"
            zIndex={130}
            closeOnBackdrop={!deleting}
        >
          <ModalHeader
              title="코디 삭제"
              onClose={() => !deleting && setShowDeleteConfirm(false)}
          />
          <ModalBody className="p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-base font-bold text-slate-900 mb-1">정말 삭제하시겠습니까?</p>
            <p className="text-sm text-slate-500">삭제된 코디는 복구할 수 없습니다.</p>
          </ModalBody>
          <ModalFooter className="p-4 flex gap-2">
            <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
            >
              {deleting ? '삭제 중…' : '삭제하기'}
            </button>
          </ModalFooter>
        </Modal>

        <ExitConfirmModal
            open={showExitConfirm}
            onConfirm={() => { setIsDirty(false); setShowExitConfirm(false); onClose() }}
            onCancel={() => setShowExitConfirm(false)}
            zIndex={130}
        />
      </>
  )
}
