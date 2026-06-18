import { useEffect, useRef, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import {
  CATEGORY_ITEM_TYPES,
  resolveItemTypeForCategory,
  type UiCategory,
} from '@/data/categoryItemTypes'
import {
  GARMENT_COLORS,
  getGarmentColor,
  isGarmentColorCode,
  needsLightColorBorder,
} from '@/data/garmentColors'
import { GARMENT_STYLES } from '@/data/garmentStyles'
import {
  GARMENT_NAME_MAX_LENGTH,
  BRAND_NAME_MAX_LENGTH,
  GARMENT_SIZE_MAX_LENGTH,
  getSizeOptionsByCategory,
  type GarmentFormFieldErrors,
  type GarmentRegisterDraft,
} from '@/utils/garmentRegisterValidation'

export type GarmentEditDraft = GarmentRegisterDraft & {
  productCode: string
  /** 저장 시 BE에 보낼 이미지 URL (기존 또는 업로드 후) */
  imageUrl: string
}

interface GarmentEditModalProps {
  open: boolean
  saving: boolean
  draft: GarmentEditDraft
  imagePreviewUrl: string | null
  imageError: string | null
  fieldErrors: GarmentFormFieldErrors
  sizeOnly?: boolean
  ownedEdit?: boolean
  onDraftChange: (patch: Partial<GarmentEditDraft>) => void
  onImageFileSelect: (file: File | null) => void
  onSave: () => void
  onClose: () => void
}

export default function GarmentEditModal({
  open,
  saving,
  draft,
  imagePreviewUrl,
  imageError,
  fieldErrors,
  sizeOnly = false,
  ownedEdit = false,
  onDraftChange,
  onImageFileSelect,
  onSave,
  onClose,
}: GarmentEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subCategoryOpen, setSubCategoryOpen] = useState(true)
  const [mainColorOpen, setMainColorOpen] = useState(false)
  const [secondaryColorOpen, setSecondaryColorOpen] = useState(false)
  const [mainStyleOpen, setMainStyleOpen] = useState(false)
  const [secondaryStyleOpen, setSecondaryStyleOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setSubCategoryOpen(true)
      setMainColorOpen(false)
      setSecondaryColorOpen(false)
      setMainStyleOpen(false)
      setSecondaryStyleOpen(false)
    }
  }, [open, draft.category])

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="garment-edit-title"
      ariaDescribedBy="garment-edit-description"
      zIndex={110}
      closeOnBackdrop
      preventClose={saving}
      panelClassName="max-h-[92vh] rounded-[24px] border border-slate-100 shadow-xl"
    >
      <ModalHeader
        title="옷 정보 수정"
        titleId="garment-edit-title"
        subtitle={
          <span id="garment-edit-description">
            {sizeOnly
              ? '외부 상품은 사이즈만 수정할 수 있습니다.'
              : ownedEdit
              ? '의상명, 사진, 사이즈, 시즌을 수정할 수 있습니다.'
              : '카테고리, 색상, 스타일 등 옷 정보를 수정할 수 있습니다.'}
          </span>
        }
        onClose={onClose}
        closeDisabled={saving}
        className="px-6"
      />

      <ModalBody className="px-6 py-4 space-y-3">
          {sizeOnly ? (
            /* 외부 상품: 사이즈만 */
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">
                사이즈 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {getSizeOptionsByCategory(draft.category).map(({ code, label }) => {
                  const active = draft.size === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onDraftChange({ size: active ? '' : code })}
                      className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${
                        active
                          ? 'bg-[#1E3A8A] text-white border-transparent'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                value={draft.size}
                maxLength={GARMENT_SIZE_MAX_LENGTH}
                onChange={(e) => onDraftChange({ size: e.target.value })}
                placeholder="직접 입력"
                className={`w-full h-9 px-3 rounded-lg border text-sm bg-white ${
                  fieldErrors.size ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {fieldErrors.size && (
                <p className="text-xs text-red-600">{fieldErrors.size}</p>
              )}
            </div>
          ) : ownedEdit ? (
            /* 옷장 등록 옷: 사진·의상명·사이즈·시즌 */
            <>
              {/* 사진 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">옷 사진</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden min-h-[10rem] max-h-48">
                  {imagePreviewUrl ? (
                    imagePreviewUrl.startsWith('blob:') ? (
                      <img src={imagePreviewUrl} alt={draft.name || '옷 사진'} className="w-full h-full max-h-48 object-contain" />
                    ) : (
                      <AuthenticatedImage src={imagePreviewUrl} alt={draft.name || '옷 사진'} className="w-full h-full max-h-48 object-contain" />
                    )
                  ) : (
                    <span className="text-xs text-slate-400 py-8">등록된 사진 없음</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => { const file = e.target.files?.[0] ?? null; onImageFileSelect(file); e.target.value = '' }} />
                <button type="button" disabled={saving} onClick={() => fileInputRef.current?.click()}
                  className="w-full h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  사진 변경
                </button>
                {imageError && <p className="text-xs text-red-600">{imageError}</p>}
              </div>
              {/* 의상명 */}
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-500">의상명 <span className="text-red-500">*</span></label>
                <input value={draft.name} maxLength={GARMENT_NAME_MAX_LENGTH}
                  onChange={(e) => onDraftChange({ name: e.target.value })}
                  className={`w-full h-10 px-3 rounded-lg border text-sm bg-white ${fieldErrors.name ? 'border-red-400' : 'border-slate-200'}`} />
                {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
              </div>
              {/* 사이즈 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">사이즈 <span className="text-slate-400 font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {getSizeOptionsByCategory(draft.category).map(({ code, label }) => {
                    const active = draft.size === code
                    return (
                      <button key={code} type="button" onClick={() => onDraftChange({ size: active ? '' : code })}
                        className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${active ? 'bg-[#1E3A8A] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
                <input type="text" value={draft.size} maxLength={GARMENT_SIZE_MAX_LENGTH}
                  onChange={(e) => onDraftChange({ size: e.target.value })} placeholder="직접 입력"
                  className={`w-full h-9 px-3 rounded-lg border text-sm bg-white ${fieldErrors.size ? 'border-red-400' : 'border-slate-200'}`} />
                {fieldErrors.size && <p className="text-xs text-red-600">{fieldErrors.size}</p>}
              </div>
            </>
          ) : (
            /* 기존 전체 수정 모드 (외부 상품 아닌 경우 - 현재는 미사용) */
            <div className="hidden" />
          )}
      </ModalBody>

      <ModalFooter className="px-6 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || (!sizeOnly && !draft.name.trim())}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#1E3A8A] text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 cursor-pointer disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}
