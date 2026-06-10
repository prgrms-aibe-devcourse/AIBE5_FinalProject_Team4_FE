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
  GARMENT_SEASON_OPTIONS,
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
              : '카테고리, 색상, 스타일 등 옷 정보를 수정할 수 있습니다.'}
          </span>
        }
        onClose={onClose}
        closeDisabled={saving}
        className="px-6"
      />

      <ModalBody className="px-6 py-4 space-y-3">
          {sizeOnly ? (
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
          ) : (
            <>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">옷 사진</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden min-h-[10rem] max-h-48">
              {imagePreviewUrl ? (
                imagePreviewUrl.startsWith('blob:') ? (
                  <img
                    src={imagePreviewUrl}
                    alt={draft.name || '옷 사진'}
                    className="w-full h-full max-h-48 object-contain"
                  />
                ) : (
                  <AuthenticatedImage
                    src={imagePreviewUrl}
                    alt={draft.name || '옷 사진'}
                    className="w-full h-full max-h-48 object-contain"
                  />
                )
              ) : (
                <span className="text-xs text-slate-400 py-8">등록된 사진 없음</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                onImageFileSelect(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              사진 변경
            </button>
            {imageError && <p className="text-xs text-red-600">{imageError}</p>}
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-500">
              의상명 <span className="text-red-500">*</span>
            </label>
            <input
              value={draft.name}
              maxLength={GARMENT_NAME_MAX_LENGTH}
              onChange={(e) => onDraftChange({ name: e.target.value })}
              className={`w-full h-10 px-3 rounded-lg border text-sm bg-white ${
                fieldErrors.name ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-500">브랜드</label>
            <input
              value={draft.brandName}
              maxLength={BRAND_NAME_MAX_LENGTH}
              onChange={(e) => onDraftChange({ brandName: e.target.value })}
              className={`w-full h-10 px-3 rounded-lg border text-sm bg-white ${
                fieldErrors.brandName ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {fieldErrors.brandName && (
              <p className="text-xs text-red-600">{fieldErrors.brandName}</p>
            )}
          </div>

          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-500">
              품번 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              value={draft.productCode}
              onChange={(e) => onDraftChange({ productCode: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Top', 'Bottom', 'Outer', 'Shoes'] as UiCategory[]).map((cValue) => {
                const active = draft.category === cValue
                return (
                  <button
                    key={cValue}
                    type="button"
                    onClick={() => {
                      if (active && subCategoryOpen) {
                        setSubCategoryOpen(false)
                        return
                      }
                      setSubCategoryOpen(true)
                      onDraftChange({
                        category: cValue,
                        itemType: resolveItemTypeForCategory(
                          cValue,
                          active ? draft.itemType : undefined,
                        ),
                        size: '',
                      })
                    }}
                    className={`h-9 rounded-lg text-xs font-bold border transition ${
                      active
                        ? 'bg-[#1E3A8A] text-white border-transparent'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {cValue}
                  </button>
                )
              })}
            </div>
            {fieldErrors.category && (
              <p className="text-xs text-red-600">{fieldErrors.category}</p>
            )}
            {subCategoryOpen && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-xs font-bold text-slate-500">
                  세부 카테고리 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_ITEM_TYPES[draft.category].map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onDraftChange({ itemType: code })}
                      className={`h-9 px-2 rounded-lg text-xs font-bold border transition ${
                        draft.itemType === code
                          ? 'bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {fieldErrors.itemType && (
                  <p className="text-xs text-red-600">{fieldErrors.itemType}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              메인 컬러 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setMainColorOpen((v) => !v)}
              className={`w-full h-10 px-3 rounded-lg border flex items-center gap-2 ${
                fieldErrors.mainColor ? 'border-red-400' : 'border-slate-200'
              }`}
            >
              {getGarmentColor(draft.mainColor) ? (
                <span
                  className={`w-7 h-7 rounded-full ${
                    isGarmentColorCode(draft.mainColor) &&
                    needsLightColorBorder(draft.mainColor)
                      ? 'border border-slate-300'
                      : ''
                  }`}
                  style={{
                    backgroundColor: getGarmentColor(draft.mainColor)!.hex,
                  }}
                />
              ) : (
                <span className="w-7 h-7 rounded-full border border-dashed border-slate-300" />
              )}
            </button>
            {mainColorOpen && (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-2">
                {GARMENT_COLORS.map(({ code, hex }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      onDraftChange({
                        mainColor: code,
                        secondaryColors: draft.secondaryColors.filter((c) => c !== code),
                      })
                    }
                    className={`p-1 rounded-lg ${
                      draft.mainColor === code ? 'ring-2 ring-[#1E3A8A]' : ''
                    }`}
                  >
                    <span
                      className={`block w-7 h-7 rounded-full mx-auto ${
                        needsLightColorBorder(code) ? 'border border-slate-300' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  </button>
                ))}
              </div>
            )}
            {fieldErrors.mainColor && (
              <p className="text-xs text-red-600">{fieldErrors.mainColor}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              보조 컬러 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <button
              type="button"
              onClick={() => setSecondaryColorOpen((v) => !v)}
              className="w-full min-h-10 px-3 py-2 rounded-lg border border-slate-200 flex gap-2 flex-wrap"
            >
              {draft.secondaryColors.length > 0 ? (
                draft.secondaryColors.map((code) => {
                  const color = getGarmentColor(code)
                  if (!color) return null
                  return (
                    <span
                      key={code}
                      className={`w-7 h-7 rounded-full ${
                        isGarmentColorCode(code) && needsLightColorBorder(code)
                          ? 'border border-slate-300'
                          : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  )
                })
              ) : (
                <span className="w-7 h-7 rounded-full border border-dashed border-slate-300" />
              )}
            </button>
            {secondaryColorOpen && (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-2">
                {GARMENT_COLORS.filter((c) => c.code !== draft.mainColor).map(
                  ({ code, hex }) => {
                    const active = draft.secondaryColors.includes(code)
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? draft.secondaryColors.filter((c) => c !== code)
                            : [...draft.secondaryColors, code]
                          onDraftChange({ secondaryColors: next })
                        }}
                        className={`p-1 rounded-lg ${active ? 'ring-2 ring-[#BBF7D0]' : ''}`}
                      >
                        <span
                          className={`block w-7 h-7 rounded-full mx-auto ${
                            needsLightColorBorder(code) ? 'border border-slate-300' : ''
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      </button>
                    )
                  },
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              메인 스타일 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setMainStyleOpen((v) => !v)}
              className={`w-full min-h-10 px-3 py-2 rounded-lg border flex gap-2 flex-wrap ${
                fieldErrors.mainStyle ? 'border-red-400' : 'border-slate-200'
              }`}
            >
              {draft.mainStyle ? (
                <span className="px-2 py-0.5 rounded-md bg-[#BBF7D0]/40 text-[#1E3A8A] text-xs font-bold">
                  {GARMENT_STYLES.find((s) => s.code === draft.mainStyle)?.label ??
                    draft.mainStyle}
                </span>
              ) : (
                <span className="text-xs text-slate-400">스타일 선택</span>
              )}
            </button>
            {mainStyleOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {GARMENT_STYLES.map(({ code, label }) => {
                  const active = draft.mainStyle === code
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        onDraftChange({
                          mainStyle: code,
                          secondaryStyles: draft.secondaryStyles.filter((s) => s !== code),
                        })
                        setMainStyleOpen(false)
                      }}
                      className={`h-9 px-2 rounded-lg text-xs font-bold border ${
                        active
                          ? 'bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
            {fieldErrors.mainStyle && (
              <p className="text-xs text-red-600">{fieldErrors.mainStyle}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              보조 스타일 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <button
              type="button"
              onClick={() => setSecondaryStyleOpen((v) => !v)}
              className="w-full min-h-10 px-3 py-2 rounded-lg border border-slate-200 flex gap-2 flex-wrap"
            >
              {draft.secondaryStyles.length > 0 ? (
                draft.secondaryStyles.map((code) => {
                  const style = GARMENT_STYLES.find((s) => s.code === code)
                  return (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded-md bg-[#BBF7D0]/40 text-[#1E3A8A] text-xs font-bold"
                    >
                      {style?.label ?? code}
                    </span>
                  )
                })
              ) : (
                <span className="text-xs text-slate-400">스타일 선택</span>
              )}
            </button>
            {secondaryStyleOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {GARMENT_STYLES.filter((s) => s.code !== draft.mainStyle).map(
                  ({ code, label }) => {
                    const active = draft.secondaryStyles.includes(code)
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? draft.secondaryStyles.filter((s) => s !== code)
                            : [...draft.secondaryStyles, code]
                          onDraftChange({ secondaryStyles: next })
                        }}
                        className={`h-9 px-2 rounded-lg text-xs font-bold border ${
                          active
                            ? 'bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  },
                )}
              </div>
            )}
          </div>

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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">
              시즌 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GARMENT_SEASON_OPTIONS.map(({ code, label }) => {
                const active = draft.season === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onDraftChange({ season: active ? '' : code })}
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
            {fieldErrors.season && (
              <p className="text-xs text-red-600">{fieldErrors.season}</p>
            )}
          </div>
            </>
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
