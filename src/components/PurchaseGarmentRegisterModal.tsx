import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FileText, Info, Sparkle, Upload } from './icons'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalHeader } from '@/components/common/Modal'
import { EXTERNAL_SOURCES, getExternalSourceLogoUrl } from '@/data/externalSources'
import { usePurchaseGarmentRegister } from '@/hooks/usePurchaseGarmentRegister'
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
import { CLOTHES_GENDER_OPTIONS } from '@/data/garmentGender'
import {
  GARMENT_NAME_MAX_LENGTH,
  BRAND_NAME_MAX_LENGTH,
  getSizeOptionsByCategory,
  GARMENT_SEASON_OPTIONS,
} from '@/utils/garmentRegisterValidation'
import { PRODUCT_CODE_MAX_LENGTH } from '@/utils/purchaseRegisterValidation'
import type { Garment } from '@/types'
import type { ExternalSourceCode } from '@/data/externalSources'
import { isDuplicateRegisterError } from '@/utils/garmentDuplicateCheck'
import { useToast } from '@/components/Toast'

const UNSAVED_GARMENT_LEAVE_MESSAGE = '현재 저장하지 않은 옷이 있습니다. 나가시겠습니까?'

interface PurchaseGarmentRegisterModalProps {
  open: boolean
  userId: number | null
  existingGarments?: Garment[]
  onClose: () => void
  onBackToMethodSelect?: () => void
  onSaved: (garment: Garment, options?: { finished: boolean }) => void
}

export default function PurchaseGarmentRegisterModal({
  open,
  userId,
  existingGarments = [],
  onClose,
  onBackToMethodSelect,
  onSaved,
}: PurchaseGarmentRegisterModalProps) {
  const { showConfirm } = useToast()
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
    activeItemImageUrl,
    resolveItemImageUrl,
    pendingItems,
    activeItemIndex,
    hasMultipleItems,
    remainingPendingCount,
    captureId,
    draft,
    setDraft,
    fieldErrors,
    uploadError,
    globalError,
    duplicateError,
    aiFailed,
    successMessage,
    isSubmitting,
    selectFile,
    runAnalyze,
    selectPendingItem,
    skipPendingItem,
    backToItemSelect,
    saveToCloset,
    reset,
  } = usePurchaseGarmentRegister(userId, existingGarments)

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  useEffect(() => {
    setSubCategoryOpen(false)
    setMainColorOpen(false)
    setSecondaryColorOpen(false)
    setMainStyleOpen(false)
    setSecondaryStyleOpen(false)
  }, [step, draft.category, activeItemIndex])

  if (!open) return null

  const canAnalyze = Boolean(selectedFile && userId)
  const analyzeHint = !userId
    ? '로그인 후 AI 분석을 시작할 수 있습니다.'
    : !selectedFile
      ? '구매내역 캡처를 선택하거나 붙여넣으세요.'
      : '캡처가 준비되었습니다. 아래 버튼을 눌러 분석을 시작하세요.'

  const hasUnsavedWork =
    Boolean(selectedFile)
    || captureId != null
    || pendingItems.length > 0
    || step === 'analyzing'
    || step === 'item-select'
    || step === 'form'

  const forceClose = () => {
    reset()
    onClose()
  }

  const tryClose = () => {
    if (step === 'saving' || isSubmitting) return
    if (!hasUnsavedWork) {
      forceClose()
      return
    }
    showConfirm(
      UNSAVED_GARMENT_LEAVE_MESSAGE,
      forceClose,
      { confirmLabel: '나가기', cancelLabel: '취소', variant: 'default' },
    )
  }

  const tryBackToMethodSelect = () => {
    if (!onBackToMethodSelect) return
    if (step === 'saving' || isSubmitting) return
    const leave = () => {
      reset()
      onBackToMethodSelect()
    }
    if (!hasUnsavedWork) {
      leave()
      return
    }
    showConfirm(
      UNSAVED_GARMENT_LEAVE_MESSAGE,
      leave,
      { confirmLabel: '나가기', cancelLabel: '취소', variant: 'default' },
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await saveToCloset()
    if (result) {
      onSaved(result.garment, { finished: !result.hasMorePending })
      if (!result.hasMorePending) {
        forceClose()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files[0]
    if (file?.type.startsWith('image/')) {
      e.preventDefault()
      selectFile(file)
    }
  }

  return (
    <Modal
      open={open}
      onClose={tryClose}
      id="modal-purchase-register"
      panelClassName="min-h-[720px] relative"
      overlayProps={{ onPaste: handlePaste }}
    >
      <ModalHeader
        title="구매내역 기반 등록"
        subtitle="쇼핑몰 구매내역 캡처를 분석해 옷장에 보유 옷으로 저장합니다."
        onClose={tryClose}
      />

      <ModalBody className="px-7 py-4 space-y-4">
          {globalError &&
            !isDuplicateRegisterError(globalError) &&
            !(aiFailed && (step === 'upload' || step === 'form' || step === 'saving')) &&
            step !== 'item-select' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {globalError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          {(step === 'upload' || step === 'analyzing') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">
                  구매내역 캡처 업로드 <span className="text-red-500">*</span>
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
                  disabled={step === 'analyzing'}
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
                    {selectedFile ? '다른 캡처 선택' : '캡처 선택'}
                  </span>
                  <span className="text-xs text-slate-400">
                    jpg · png · webp (최대 10MB) · Ctrl+V 붙여넣기
                  </span>
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
                    <AuthenticatedImage
                      src={displayImageUrl}
                      alt="구매내역 캡처 미리보기"
                      className="w-full h-full max-h-[200px] object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs space-y-1">
                      <FileText className="w-8 h-8 mx-auto opacity-40" />
                      <p>선택한 캡처가 여기에 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <>
              {aiFailed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-1">
                  <p>
                    AI 분석에 실패했습니다. 다른 캡처를 선택하거나 아래에서 분석을 다시 시도해
                    주세요.
                  </p>
                  {globalError && <p className="text-xs text-amber-800/90">{globalError}</p>}
                </div>
              )}
              <p
                className={`text-xs text-center font-medium ${
                  canAnalyze ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {aiFailed
                  ? '캡처를 바꾸거나 같은 캡처로 분석을 다시 시도할 수 있습니다.'
                  : analyzeHint}
              </p>
              <button
                type="button"
                onClick={() => void runAnalyze()}
                disabled={!canAnalyze}
                className={`w-full h-12 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  canAnalyze
                    ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/25 hover:bg-[#172e6e] active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Sparkle
                  className={`w-4 h-4 ${canAnalyze ? 'text-[#BBF7D0]' : 'text-slate-300'}`}
                />
                {aiFailed ? 'AI 분석 다시 시도' : 'AI 분석 시작'}
              </button>
              {onBackToMethodSelect && (
                <button
                  type="button"
                  onClick={tryBackToMethodSelect}
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
              <p className="text-sm font-bold text-[#1E3A8A]">AI가 구매내역을 분석하는 중…</p>
              <p className="text-xs text-slate-400">상품명, 브랜드, 품번, 옵션을 추출하고 있습니다</p>
            </div>
          )}

          {step === 'item-select' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800">
                  AI가 구매내역에서 {pendingItems.length}개 상품을 찾았습니다. 등록할 상품을
                  선택하세요. 각 상품은 개별로 확인·저장됩니다.
                </p>
              </div>

              <div className="space-y-2">
                {pendingItems.map((item, index) => {
                  const label = item.draft.name.trim() || `상품 ${index + 1}`
                  const meta = [
                    item.draft.brandName,
                    item.draft.productCode,
                    item.draft.optionText,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                  const itemImageUrl = resolveItemImageUrl(item)

                  return (
                    <div
                      key={item.itemIndex}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        {itemImageUrl && (
                          <div className="shrink-0 w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <AuthenticatedImage
                              src={itemImageUrl}
                              alt={label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{label}</p>
                            {meta && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">{meta}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'saved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'skipped'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-[#BBF7D0]/50 text-[#1E3A8A]'
                            }`}
                          >
                            {item.status === 'saved'
                              ? '저장됨'
                              : item.status === 'skipped'
                                ? '건너뜀'
                                : '대기'}
                          </span>
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => selectPendingItem(item.itemIndex)}
                            className="flex-1 h-9 rounded-lg bg-[#1E3A8A] text-[#BBF7D0] text-xs font-bold disabled:opacity-50"
                          >
                            확인·저장
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void skipPendingItem(item.itemIndex)}
                            className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-white disabled:opacity-50"
                          >
                            {isSubmitting ? '처리 중…' : '건너뛰기'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {remainingPendingCount === 0 && (
                <button
                  type="button"
                  onClick={forceClose}
                  className="w-full h-11 bg-[#1E3A8A] text-[#BBF7D0] rounded-xl font-bold text-sm"
                >
                  등록 완료
                </button>
              )}

              {onBackToMethodSelect && (
                <button
                  type="button"
                  onClick={tryBackToMethodSelect}
                  className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                >
                  뒤로가기 · 등록 방식 다시 선택
                </button>
              )}
            </div>
          )}

          {(step === 'form' || step === 'saving') && (
            <>
              {hasMultipleItems && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="text-slate-500 font-medium">
                    상품 {activeItemIndex != null ? activeItemIndex + 1 : '-'} /{' '}
                    {pendingItems.length}
                    {remainingPendingCount > 0 && ` · 남은 ${remainingPendingCount}개`}
                  </p>
                  <button
                    type="button"
                    onClick={backToItemSelect}
                    className="text-[#1E3A8A] font-bold hover:underline"
                  >
                    상품 목록
                  </button>
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

                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-500">
                    품번 <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={draft.productCode}
                    maxLength={PRODUCT_CODE_MAX_LENGTH}
                    onChange={(e) => setDraft({ productCode: e.target.value })}
                    placeholder="구매내역의 상품코드"
                    className={`w-full h-11 px-3 rounded-lg border text-sm bg-white ${
                      fieldErrors.productCode ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.productCode && (
                    <p className="text-xs text-red-600">{fieldErrors.productCode}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">
                    쇼핑몰 <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {EXTERNAL_SOURCES.filter((s) => s.code !== 'CUSTOM').map(({ code, label }) => {
                      const active = draft.externalSource === code
                      const logoUrl = getExternalSourceLogoUrl(code)
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() =>
                            setDraft({
                              externalSource: active ? '' : (code as ExternalSourceCode),
                            })
                          }
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition ${
                            active
                              ? 'bg-[#1E3A8A] text-white border-transparent'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="w-7 h-7 object-contain rounded"
                            />
                          ) : (
                            <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded bg-slate-100">
                              {label.charAt(0)}
                            </span>
                          )}
                          <span className="text-[10px] font-bold leading-tight text-center line-clamp-2">
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {fieldErrors.externalSource && (
                    <p className="text-xs text-red-600">{fieldErrors.externalSource}</p>
                  )}
                </div>

                {activeItemImageUrl && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 p-3">
                    <div className="shrink-0 w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                      <AuthenticatedImage
                        src={activeItemImageUrl}
                        alt={draft.name || '상품 이미지'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      {draft.name && (
                        <p className="text-sm font-bold text-slate-800 truncate">{draft.name}</p>
                      )}
                      {draft.brandName && (
                        <p className="text-xs text-slate-500 truncate">{draft.brandName}</p>
                      )}
                      {draft.optionText && (
                        <p className="text-xs text-slate-400 truncate">{draft.optionText}</p>
                      )}
                    </div>
                  </div>
                )}

                {draft.optionText && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    AI 추출 옵션: {draft.optionText}
                  </p>
                )}

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
                                secondaryStyles: draft.secondaryStyles.filter((s) => s !== code),
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
                    브랜드 <span className="text-slate-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="text"
                    value={draft.brandName}
                    maxLength={BRAND_NAME_MAX_LENGTH}
                    onChange={(e) => setDraft({ brandName: e.target.value })}
                    placeholder="예: 무신사 스탠다드"
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
                    사이즈 <span className="text-slate-400 font-normal">(선택)</span>
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
                    maxLength={50}
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
                  <label className="text-xs font-bold text-slate-500">대상 성별</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CLOTHES_GENDER_OPTIONS.map(({ code, label }) => {
                      const active = draft.gender === code
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setDraft({ gender: code })}
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
                  {fieldErrors.gender && (
                    <p className="text-xs text-red-600">{fieldErrors.gender}</p>
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

                {hasMultipleItems && remainingPendingCount > 1 && (
                  <button
                    type="submit"
                    disabled={step === 'saving'}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 h-12 px-8 bg-[#111827] text-[#BBF7D0] disabled:opacity-60 rounded-full font-black text-sm shadow-2xl shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-black/40 active:scale-95 whitespace-nowrap"
                  >
                    저장하고 다음 상품 →
                  </button>
                )}

                {hasMultipleItems ? (
                  <button
                    type="button"
                    onClick={backToItemSelect}
                    className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                  >
                    상품 목록으로
                  </button>
                ) : (
                  onBackToMethodSelect && (
                    <button
                      type="button"
                      onClick={tryBackToMethodSelect}
                      className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                    >
                      뒤로가기 · 등록 방식 다시 선택
                    </button>
                  )
                )}
              </form>
            </>
          )}
      </ModalBody>
    </Modal>
  )
}
