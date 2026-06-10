import { useCallback, useEffect, useRef, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import GarmentEditModal, { type GarmentEditDraft } from '@/components/GarmentEditModal'
import type { Garment } from '@/types'
import { UI_CATEGORY_TO_BE } from '@/data/categoryItemTypes'
import { uploadGarmentPhoto } from '@/api/photoRegistration'
import {
  fetchClothesDetail,
  updateClothes,
  deleteClothes,
} from '@/api/wardrobe'
import { extractApiErrorMessage } from '@/utils/apiError'
import { validateGarmentImageFile } from '@/utils/imageFileValidation'
import {
  hasFormErrors,
  validateGarmentRegisterDraft,
  validateGarmentSizeOnlyEdit,
  type GarmentFormFieldErrors,
} from '@/utils/garmentRegisterValidation'
import { isExternalProductGarment } from '@/utils/garmentEditRules'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

interface ClosetGarmentDetailProps {
  garment: Garment | null
  userId: number
  onGarmentChange: (garment: Garment | null) => void
  onGarmentUpdated: (garment: Garment) => void
  onGarmentDeleted: (clothesId: string) => void
  onToast: (message: string) => void
}

function resolveGarmentImageUrl(g: Garment): string {
  return (
    resolveClothesDisplayImageUrl({
      userImageUrl: g.userImageUrl,
      imageUrl: g.be?.imageUrl,
    }) ??
    g.thumbnailUrl ??
    ''
  )
}

function garmentToEditDraft(g: Garment): GarmentEditDraft {
  const be = g.be!
  const styleCodes = be.styleCodes
  return {
    name: g.name,
    brandName: be.brandName,
    productCode: g.productCode ?? '',
    imageUrl: resolveGarmentImageUrl(g),
    category: g.category,
    itemType: be.itemTypeCode,
    gender: be.genderCode,
    mainColor: be.primaryColorCode,
    secondaryColors: [...be.secondaryColorCodes],
    mainStyle: styleCodes[0] ?? '',
    secondaryStyles: styleCodes.slice(1),
    size: g.size ?? '',
    season: g.season ?? '',
  }
}

export default function ClosetGarmentDetail({
  garment,
  userId,
  onGarmentChange,
  onGarmentUpdated,
  onGarmentDeleted,
  onToast,
}: ClosetGarmentDetailProps) {
  const [detail, setDetail] = useState<Garment | null>(garment)
  const [loading, setLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDraft, setEditDraft] = useState<GarmentEditDraft | null>(null)
  const [fieldErrors, setFieldErrors] = useState<GarmentFormFieldErrors>({})
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const previewBlobRef = useRef<string | null>(null)

  const revokePreviewBlob = useCallback(() => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
  }, [])

  useEffect(() => () => revokePreviewBlob(), [revokePreviewBlob])

  useEffect(() => {
    if (!garment) {
      setDetail(null)
      setEditModalOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchClothesDetail(Number(garment.id))
      .then((fetched) => {
        if (!cancelled) {
          setDetail(fetched)
          onGarmentChange(fetched)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(garment)
          onToast('상세 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment?.id, onToast])

  const resetImageEditState = useCallback(
    (g: Garment) => {
      revokePreviewBlob()
      setPendingImageFile(null)
      setImageError(null)
      setImagePreviewUrl(resolveGarmentImageUrl(g) || null)
    },
    [revokePreviewBlob],
  )

  const openEditModal = () => {
    if (!detail?.be) {
      onToast('수정할 수 없는 데이터입니다. 다시 선택해 주세요.')
      return
    }
    setEditDraft(garmentToEditDraft(detail))
    resetImageEditState(detail)
    setFieldErrors({})
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (!saving) {
      setEditModalOpen(false)
      setEditDraft(null)
      setFieldErrors({})
      revokePreviewBlob()
      setPendingImageFile(null)
      setImagePreviewUrl(null)
      setImageError(null)
    }
  }

  const handleImageFileSelect = (file: File | null) => {
    setImageError(null)
    if (!file) return

    const validationError = validateGarmentImageFile(file)
    if (validationError) {
      setImageError(validationError)
      return
    }

    revokePreviewBlob()
    const objectUrl = URL.createObjectURL(file)
    previewBlobRef.current = objectUrl
    setPendingImageFile(file)
    setImagePreviewUrl(objectUrl)
  }

  const handleDraftChange = (patch: Partial<GarmentEditDraft>) => {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev))
    setFieldErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch) as (keyof GarmentEditDraft)[]) {
        const fieldMap: Partial<
          Record<keyof GarmentEditDraft, keyof GarmentFormFieldErrors>
        > = {
          name: 'name',
          category: 'category',
          itemType: 'itemType',
          gender: 'gender',
          mainColor: 'mainColor',
          mainStyle: 'mainStyle',
          brandName: 'brandName',
          size: 'size',
          season: 'season',
        }
        const field = fieldMap[key]
        if (field) delete next[field]
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!detail || !editDraft) return

    const sizeOnly = isExternalProductGarment(detail)
    const errors = sizeOnly
      ? validateGarmentSizeOnlyEdit(editDraft.size)
      : validateGarmentRegisterDraft(editDraft, { skipGender: true })
    setFieldErrors(errors)
    if (hasFormErrors(errors)) {
      onToast('입력값을 확인해 주세요.')
      return
    }

    setSaving(true)
    setImageError(null)

    try {
      if (sizeOnly) {
        const updated = await updateClothes(Number(detail.id), detail, {
          size: editDraft.size.trim() || 'FREE',
        })
        setDetail(updated)
        onGarmentUpdated(updated)
        setEditModalOpen(false)
        setEditDraft(null)
        onToast('사이즈가 수정되었습니다.')
        return
      }

      let imageUrl = editDraft.imageUrl.trim()

      if (pendingImageFile) {
        const uploaded = await uploadGarmentPhoto(userId, pendingImageFile)
        imageUrl = uploaded.imageUrl ?? uploaded.previewUrl ?? ''
        if (!imageUrl) {
          setImageError('이미지 업로드에 실패했습니다. 다시 시도해 주세요.')
          onToast('이미지 업로드에 실패했습니다.')
          return
        }
      }

      if (!imageUrl) {
        setImageError('옷 사진 URL이 없습니다. 사진을 다시 선택해 주세요.')
        onToast('저장할 옷 사진이 없습니다.')
        return
      }

      const styles = [
        editDraft.mainStyle,
        ...editDraft.secondaryStyles.filter((s) => s !== editDraft.mainStyle),
      ]
      const updated = await updateClothes(Number(detail.id), detail, {
        name: editDraft.name.trim(),
        brandName: editDraft.brandName.trim(),
        productCode: editDraft.productCode.trim() || detail.productCode || 'UNKNOWN',
        category: UI_CATEGORY_TO_BE[editDraft.category],
        itemType: editDraft.itemType,
        primaryColor: editDraft.mainColor,
        secondaryColors: editDraft.secondaryColors,
        styles,
        size: editDraft.size.trim() || 'FREE',
        season: editDraft.season.trim() || undefined,
        imageUrl,
      })
      setDetail(updated)
      onGarmentUpdated(updated)
      setEditModalOpen(false)
      setEditDraft(null)
      revokePreviewBlob()
      setPendingImageFile(null)
      onToast('옷 정보가 수정되었습니다.')
    } catch (error) {
      const message = extractApiErrorMessage(error, '수정에 실패했습니다.')
      onToast(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!detail || detail.isWishlist) return
    const confirmed = window.confirm(
      `"${detail.name}"을(를) 보유 옷장에서 삭제할까요?\n삭제 후에는 목록에서 제거됩니다.`,
    )
    if (!confirmed) return

    try {
      await deleteClothes(Number(detail.id))
      onGarmentDeleted(detail.id)
      onGarmentChange(null)
      setDetail(null)
      setEditModalOpen(false)
      onToast('삭제되었습니다.')
    } catch (err) {
      console.error('[ClosetGarmentDetail] deleteClothes failed:', err)
      onToast('삭제에 실패했습니다.')
    }
  }

  const handleRemoveFromWishlist = async () => {
    if (!detail || !detail.isWishlist) return
    const confirmed = window.confirm(
      `"${detail.name}"을(를) 위시리스트에서 빼시겠어요?`,
    )
    if (!confirmed) return

    try {
      await deleteClothes(Number(detail.id))
      onGarmentDeleted(detail.id)
      onGarmentChange(null)
      setDetail(null)
      onToast('위시리스트에서 제거했어요')
    } catch (err) {
      console.error('[ClosetGarmentDetail] removeFromWishlist failed:', err)
      onToast('위시리스트에서 빼지 못했습니다.')
    }
  }

  if (!garment) {
    return (
      <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 flex flex-col justify-center items-center min-h-[17rem] select-none">
        <span className="text-4xl block mb-2">👚</span>
        <h4 className="text-xs font-bold text-slate-700">의상 분석 상세 정보</h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
          좌측 컬렉션에서 의상을 선택하면 상세 정보가 표시됩니다.
        </p>
      </div>
    )
  }

  if (loading && !detail) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs font-bold min-h-[17rem] flex items-center justify-center">
        상세 정보 불러오는 중...
      </div>
    )
  }

  const g = detail ?? garment
  const statusLabel = g.isWishlist ? '미보유 (위시리스트)' : '보유'
  const sizeOnlyEdit = isExternalProductGarment(g)

  return (
    <>
      {editDraft && (
        <GarmentEditModal
          open={editModalOpen}
          saving={saving}
          draft={editDraft}
          imagePreviewUrl={imagePreviewUrl}
          imageError={imageError}
          fieldErrors={fieldErrors}
          sizeOnly={sizeOnlyEdit}
          onDraftChange={handleDraftChange}
          onImageFileSelect={handleImageFileSelect}
          onSave={() => void handleSave()}
          onClose={closeEditModal}
        />
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-2xs text-left space-y-3.5">
          {g.thumbnailUrl && (
            <div className="w-full aspect-square rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden">
              <AuthenticatedImage
                src={g.thumbnailUrl}
                alt={g.name}
                className="w-full h-full object-contain p-2"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
              {statusLabel}
            </span>
            {g.isFavorite && (
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-rose-100 text-rose-700">
                즐겨찾기
              </span>
            )}
          </div>
          <h4 className="text-lg font-black text-slate-900 leading-snug">{g.name}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            브랜드: {g.be?.brandName ?? g.fabricMaterial} · 코드: {g.productCode ?? '—'}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            카테고리: {g.category} · 타입: {g.fitType}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            색상: {g.color} · 스타일: {g.style}
          </p>
          {(g.size || g.season) && (
            <p className="text-sm text-slate-600 leading-relaxed">
              사이즈: {g.size ?? '—'} · 시즌: {g.season ?? '—'}
            </p>
          )}
        </div>

        {g.isWishlist ? (
          <button
            type="button"
            onClick={() => void handleRemoveFromWishlist()}
            className="w-full h-12 rounded-xl text-sm font-black bg-orange-50 text-orange-900 border border-orange-200 cursor-pointer transition hover:bg-orange-100 active:scale-[0.98]"
          >
            위시리스트에서 빼기
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={openEditModal}
              disabled={!g.be}
              className="h-12 rounded-xl text-sm font-black bg-[#1E3A8A] text-white disabled:opacity-40 cursor-pointer transition hover:bg-[#1E3A8A]/90 active:scale-[0.98]"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="h-12 rounded-xl text-sm font-black bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer transition hover:bg-rose-200 active:scale-[0.98]"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </>
  )
}
