import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Camera, Info, Sparkle, Upload, X } from './icons'
import { usePhotoGarmentRegister } from '@/hooks/usePhotoGarmentRegister'
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
} from '@/utils/garmentRegisterValidation'
import type { Garment } from '@/types'
import { isDuplicateRegisterError } from '@/utils/garmentDuplicateCheck'

interface PhotoGarmentRegisterModalProps {
  open: boolean
  userId: number | null
  existingGarments?: Garment[]
  onClose: () => void
  onBackToMethodSelect?: () => void
  onSaved: (garment: Garment) => void
}

export default function PhotoGarmentRegisterModal({
  open,
  userId,
  existingGarments = [],
  onClose,
  onBackToMethodSelect,
  onSaved,
}: PhotoGarmentRegisterModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subCategoryOpen, setSubCategoryOpen] = useState(false)
  const [mainColorOpen, setMainColorOpen] = useState(false)
  const [secondaryColorOpen, setSecondaryColorOpen] = useState(false)
  const [mainStyleOpen, setMainStyleOpen] = useState(false)
  const [secondaryStyleOpen, setSecondaryStyleOpen] = useState(false)

  const {
    step,
    selectedFile,
    displayImageUrl,
    draft,
    setDraft,
    fieldErrors,
    uploadError,
    globalError,
    duplicateError,
    aiFailed,
    successMessage,
    selectFile,
    runAnalyze,
    saveToCloset,
    reset,
  } = usePhotoGarmentRegister(userId, existingGarments)

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    setSubCategoryOpen(false)
    setMainColorOpen(false)
    setSecondaryColorOpen(false)
    setMainStyleOpen(false)
    setSecondaryStyleOpen(false)
  }, [step, draft.category])

  if (!open) return null

  const canAnalyze = Boolean(selectedFile && userId)
  const analyzeHint = !userId
    ? '로그인 후 AI 분석을 시작할 수 있습니다.'
    : !selectedFile
      ? '사진을 선택하면 AI 분석을 시작할 수 있습니다.'
      : '사진이 준비되었습니다. 아래 버튼을 눌러 분석을 시작하세요.'

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const saved = await saveToCloset()
    if (saved) {
      onSaved(saved)
      handleClose()
    }
  }

  return (
    <div
      id="modal-photo-register"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[45] animate-fade-in p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-[28px] min-h-[720px] max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="space-y-0 text-left leading-tight">
            <h3 className="text-lg font-bold text-[#1E3A8A]">사진 기반 등록</h3>
            <p className="text-sm text-slate-400 mt-1">
              옷 사진을 업로드하면 AI가 분석하고, 확인 후 옷장에 저장합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-7 py-4 space-y-4">
          {globalError &&
            !isDuplicateRegisterError(globalError) &&
            !(aiFailed && (step === 'form' || step === 'saving')) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {globalError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          {/* 업로드 + 미리보기 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">
                의류 사진 업로드 <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={step === 'analyzing' || step === 'saving'}
                className={`w-full min-h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition disabled:opacity-60 ${
                  selectedFile
                    ? 'border-[#1E3A8A]/50 bg-indigo-50/70 hover:border-[#1E3A8A]'
                    : 'border-slate-200 bg-slate-50/60 hover:border-[#1E3A8A]/40'
                }`}
              >
                <Upload
                  className={`w-8 h-8 ${
                    selectedFile ? 'text-[#1E3A8A]' : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    selectedFile ? 'text-[#1E3A8A]' : 'text-slate-500'
                  }`}
                >
                  {selectedFile ? '다른 사진 선택' : '사진 선택'}
                </span>
                <span className="text-xs text-slate-400">jpg · png · webp (최대 10MB)</span>
              </button>
              {uploadError && (
                <p className="text-xs text-red-600 font-medium">{uploadError}</p>
              )}
              {selectedFile && (
                <p className="text-xs font-semibold text-[#1E3A8A] truncate">
                  선택됨 · {selectedFile.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">미리보기</label>
              <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt="업로드한 옷 사진 미리보기"
                    className="w-full h-full max-h-[200px] object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs space-y-1">
                    <Camera className="w-8 h-8 mx-auto opacity-40" />
                    <p>선택한 사진이 여기에 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {step === 'upload' && (
            <>
              <p
                className={`text-xs text-center font-medium ${
                  canAnalyze ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {analyzeHint}
              </p>
              <button
                type="button"
                onClick={() => void runAnalyze()}
                disabled={!canAnalyze}
                aria-disabled={!canAnalyze}
                className={`w-full h-12 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  canAnalyze
                    ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/25 hover:bg-[#172e6e] active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Sparkle
                  className={`w-4 h-4 ${canAnalyze ? 'text-[#BBF7D0]' : 'text-slate-300'}`}
                />
                AI 분석 시작
              </button>
              {onBackToMethodSelect && (
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    onBackToMethodSelect()
                  }}
                  className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                >
                  뒤로가기 · 등록 방식 다시 선택
                </button>
              )}
            </>
          )}

          {step === 'analyzing' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#1E3A8A] animate-spin" />
              <p className="text-sm font-bold text-[#1E3A8A]">AI가 옷 사진을 분석하는 중…</p>
              <p className="text-xs text-slate-400">카테고리, 색상, 스타일을 판별하고 있습니다</p>
            </div>
          )}

          {(step === 'form' || step === 'saving') && (
            <>
              {aiFailed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-1">
                  <p>AI 분석에 실패했습니다. 아래 항목을 직접 입력한 뒤 저장해 주세요.</p>
                  {globalError && (
                    <p className="text-xs text-amber-800/90">{globalError}</p>
                  )}
                </div>
              )}

              {!aiFailed && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-800">
                    AI 분석 결과가 아래에 채워졌습니다. 필요하면 수정한 후 저장하세요.
                  </p>
                </div>
              )}

              <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)} noValidate>
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-500">
                    의상명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    maxLength={GARMENT_NAME_MAX_LENGTH}
                    onChange={(e) => setDraft({ name: e.target.value })}
                    className={`w-full h-11 px-3 rounded-lg border text-sm bg-white outline-hidden ${
                      fieldErrors.name ? 'border-red-400' : 'border-slate-200'
                    }`}
                    required
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600">{fieldErrors.name}</p>
                  )}
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
                            setDraft({
                              category: cValue,
                              itemType: resolveItemTypeForCategory(
                                cValue,
                                active ? draft.itemType : undefined,
                              ),
                              size: '',
                            })
                          }}
                          className={`h-10 rounded-lg text-sm font-bold border transition ${
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
                            onClick={() => setDraft({ itemType: code })}
                            className={`h-10 px-2 rounded-lg text-xs font-bold border transition ${
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

                {/* 메인 컬러 */}
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
                            setDraft({
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

                {/* 보조 컬러 */}
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
                                setDraft({ secondaryColors: next })
                              }}
                              className={`p-1 rounded-lg ${
                                active ? 'ring-2 ring-[#BBF7D0]' : ''
                              }`}
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
                              setDraft({
                                mainStyle: code,
                                secondaryStyles: draft.secondaryStyles.filter(
                                  (s) => s !== code,
                                ),
                              })
                              setMainStyleOpen(false)
                            }}
                            className={`h-10 px-2 rounded-lg text-xs font-bold border ${
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
                                setDraft({ secondaryStyles: next })
                              }}
                              className={`h-10 px-2 rounded-lg text-xs font-bold border ${
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

                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-500">
                    브랜드{' '}
                    <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={draft.brandName}
                    maxLength={BRAND_NAME_MAX_LENGTH}
                    onChange={(e) => setDraft({ brandName: e.target.value })}
                    placeholder="예: 무신사 스탠다드 (모를 경우 비워두세요)"
                    className={`w-full h-11 px-3 rounded-lg border text-sm bg-white ${
                      fieldErrors.brandName ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.brandName && (
                    <p className="text-xs text-red-600">{fieldErrors.brandName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">
                    사이즈{' '}
                    <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {getSizeOptionsByCategory(draft.category).map(({ code, label }) => {
                      const active = draft.size === code
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setDraft({ size: active ? '' : code })}
                          className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${
                            active
                              ? 'bg-[#1E3A8A] text-white border-transparent'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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
                    onChange={(e) => setDraft({ size: e.target.value })}
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
                    시즌{' '}
                    <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GARMENT_SEASON_OPTIONS.map(({ code, label }) => {
                      const active = draft.season === code
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setDraft({ season: active ? '' : code })}
                          className={`h-8 px-3 rounded-lg text-xs font-bold border transition ${
                            active
                              ? 'bg-[#1E3A8A] text-white border-transparent'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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

                {duplicateError && (
                  <p className="text-sm font-bold text-red-600 text-center py-1">
                    {duplicateError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={step === 'saving'}
                  className="w-full h-11 bg-[#1E3A8A] text-[#BBF7D0] disabled:opacity-60 rounded-xl font-bold text-sm transition"
                >
                  {step === 'saving' ? '저장 중…' : '옷장에 저장하기'}
                </button>
                {onBackToMethodSelect && (
                  <button
                    type="button"
                    onClick={() => {
                      reset()
                      onBackToMethodSelect()
                    }}
                    className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                  >
                    뒤로가기 · 등록 방식 다시 선택
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
