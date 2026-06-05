import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthenticatedImageSrc } from '@/utils/authenticatedImageUrl'
import {
  getPurchaseAnalysisFailureMessage,
  isPurchaseAnalysisFailed,
  resolvePurchaseAnalysisDraft,
  saveGarmentFromPurchaseCapture,
  uploadPurchaseCapture,
} from '@/api/purchaseCaptureRegistration'
import type { Garment } from '@/types'
import { mapClothesToGarment } from '@/utils/clothesMapper'
import { extractApiErrorMessage } from '@/utils/apiError'
import { validateGarmentImageFile } from '@/utils/imageFileValidation'
import {
  buildPurchaseSavePayload,
  extractPurchaseCaptureItems,
  mapPurchaseItemToRegisterDraft,
} from '@/utils/purchaseCaptureDraftMapper'
import {
  createEmptyPurchaseRegisterDraft,
  hasPurchaseFormErrors,
  validatePurchaseRegisterDraft,
  type PurchaseFormFieldErrors,
  type PurchaseRegisterDraft,
} from '@/utils/purchaseRegisterValidation'

export type PurchaseRegisterStep =
  | 'upload'
  | 'analyzing'
  | 'item-select'
  | 'form'
  | 'saving'

export type PurchasePendingItem = {
  itemIndex: number
  draft: PurchaseRegisterDraft
  status: 'pending' | 'saved' | 'skipped'
  /** 상품별 썸네일 (BE가 제공하는 경우) */
  itemImageUrl?: string | null
}

export function usePurchaseGarmentRegister(userId: number | null) {
  const [step, setStep] = useState<PurchaseRegisterStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [captureId, setCaptureId] = useState<number | null>(null)
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null)
  const [pendingItems, setPendingItems] = useState<PurchasePendingItem[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<PurchaseRegisterDraft>(createEmptyPurchaseRegisterDraft())
  const [fieldErrors, setFieldErrors] = useState<PurchaseFormFieldErrors>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [aiFailed, setAiFailed] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    revokePreview()
    setStep('upload')
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaptureId(null)
    setServerImageUrl(null)
    setPendingItems([])
    setActiveItemIndex(null)
    setDraft(createEmptyPurchaseRegisterDraft())
    setFieldErrors({})
    setUploadError(null)
    setGlobalError(null)
    setAiFailed(false)
    setSuccessMessage(null)
  }, [revokePreview])

  useEffect(() => () => revokePreview(), [revokePreview])

  const selectFile = useCallback(
    (file: File | null) => {
      setUploadError(null)
      setGlobalError(null)
      setAiFailed(false)
      setFieldErrors({})
      setSuccessMessage(null)
      setPendingItems([])
      setActiveItemIndex(null)

      if (!file) {
        revokePreview()
        setSelectedFile(null)
        setPreviewUrl(null)
        return
      }

      const validationError = validateGarmentImageFile(file)
      if (validationError) {
        revokePreview()
        setSelectedFile(null)
        setPreviewUrl(null)
        setCaptureId(null)
        setUploadError(validationError)
        return
      }

      revokePreview()
      const objectUrl = URL.createObjectURL(file)
      previewRef.current = objectUrl
      setSelectedFile(file)
      setPreviewUrl(objectUrl)
      setCaptureId(null)
      setStep('upload')
    },
    [revokePreview],
  )

  const applyAnalysisResult = useCallback((beDraft: Awaited<ReturnType<typeof resolvePurchaseAnalysisDraft>>) => {
    if (isPurchaseAnalysisFailed(beDraft)) {
      setAiFailed(true)
      setGlobalError(getPurchaseAnalysisFailureMessage(beDraft))
      setPendingItems([])
      setActiveItemIndex(0)
      setDraft(createEmptyPurchaseRegisterDraft())
      setStep('form')
      return
    }

    const extracted = extractPurchaseCaptureItems(beDraft)
    if (extracted.length === 0) {
      setAiFailed(true)
      setGlobalError('분석된 상품을 찾지 못했습니다. 직접 입력해 주세요.')
      setPendingItems([])
      setActiveItemIndex(0)
      setDraft(createEmptyPurchaseRegisterDraft())
      setStep('form')
      return
    }

    const nextPending: PurchasePendingItem[] = extracted.map((item) => ({
      itemIndex: item.itemIndex ?? 0,
      draft: mapPurchaseItemToRegisterDraft(item),
      status: 'pending' as const,
      itemImageUrl: item.imageUrl ?? item.thumbnailUrl ?? null,
    }))

    setPendingItems(nextPending)
    setAiFailed(false)
    setGlobalError(null)

    if (nextPending.length > 1) {
      setActiveItemIndex(null)
      setDraft(createEmptyPurchaseRegisterDraft())
      setStep('item-select')
      return
    }

    setActiveItemIndex(nextPending[0].itemIndex)
    setDraft(nextPending[0].draft)
    setStep('form')
  }, [])

  const runAnalyze = useCallback(async () => {
    if (!userId) {
      setGlobalError('로그인이 필요합니다. 다시 로그인해 주세요.')
      return
    }
    if (!selectedFile) {
      setUploadError('구매내역 캡처 이미지를 먼저 선택해 주세요.')
      return
    }

    setUploadError(null)
    setGlobalError(null)
    setAiFailed(false)
    setFieldErrors({})
    setStep('analyzing')

    let uploadedCaptureId: number | null = null

    try {
      const uploaded = await uploadPurchaseCapture(userId, selectedFile)
      uploadedCaptureId = uploaded.captureId
      setCaptureId(uploaded.captureId)
      if (uploaded.imageUrl) setServerImageUrl(uploaded.imageUrl)

      try {
        const beDraft = await resolvePurchaseAnalysisDraft(userId, uploaded.captureId)
        if (beDraft.imageUrl) setServerImageUrl(beDraft.imageUrl)
        applyAnalysisResult(beDraft)
      } catch (analyzeError) {
        setAiFailed(true)
        setGlobalError(extractApiErrorMessage(analyzeError))
        setPendingItems([])
        setActiveItemIndex(0)
        setDraft(createEmptyPurchaseRegisterDraft())
        setStep('form')
      }
    } catch (error) {
      const message = extractApiErrorMessage(error, '캡처 업로드 또는 분석에 실패했습니다.')
      if (uploadedCaptureId != null) {
        setAiFailed(true)
        setGlobalError(message)
        setPendingItems([])
        setActiveItemIndex(0)
        setDraft(createEmptyPurchaseRegisterDraft())
        setStep('form')
      } else {
        setGlobalError(message)
        setUploadError(message)
        setStep('upload')
      }
    }
  }, [applyAnalysisResult, selectedFile, userId])

  const selectPendingItem = useCallback(
    (itemIndex: number) => {
      const target = pendingItems.find((item) => item.itemIndex === itemIndex)
      if (!target || target.status !== 'pending') return
      setActiveItemIndex(itemIndex)
      setDraft(target.draft)
      setFieldErrors({})
      setGlobalError(null)
      setSuccessMessage(null)
      setStep('form')
    },
    [pendingItems],
  )

  const skipPendingItem = useCallback((itemIndex: number) => {
    setPendingItems((prev) =>
      prev.map((item) =>
        item.itemIndex === itemIndex ? { ...item, status: 'skipped' } : item,
      ),
    )
    setSuccessMessage('상품을 건너뛰었습니다.')
    setStep('item-select')
    setActiveItemIndex(null)
  }, [])

  const backToItemSelect = useCallback(() => {
    if (pendingItems.length <= 1) return
    setFieldErrors({})
    setGlobalError(null)
    setActiveItemIndex(null)
    setStep('item-select')
  }, [pendingItems.length])

  const updateDraft = useCallback((patch: Partial<PurchaseRegisterDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch }
      if (activeItemIndex != null) {
        setPendingItems((items) =>
          items.map((item) =>
            item.itemIndex === activeItemIndex ? { ...item, draft: next } : item,
          ),
        )
      }
      return next
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch) as (keyof PurchaseRegisterDraft)[]) {
        const fieldMap: Partial<
          Record<keyof PurchaseRegisterDraft, keyof PurchaseFormFieldErrors>
        > = {
          name: 'name',
          category: 'category',
          itemType: 'itemType',
          mainColor: 'mainColor',
          mainStyle: 'mainStyle',
          brandName: 'brandName',
          size: 'size',
          season: 'season',
          productCode: 'productCode',
          externalSource: 'externalSource',
        }
        const field = fieldMap[key]
        if (field) delete next[field]
      }
      return next
    })
  }, [activeItemIndex])

  const remainingPendingCount = pendingItems.filter((item) => item.status === 'pending').length
  const hasMultipleItems = pendingItems.length > 1

  const saveToCloset = useCallback(async (): Promise<{
    garment: Garment
    hasMorePending: boolean
  } | null> => {
    if (!userId) {
      setGlobalError('로그인이 필요합니다. 다시 로그인해 주세요.')
      return null
    }
    if (captureId == null) {
      setGlobalError('캡처 업로드 후 저장할 수 있습니다.')
      return null
    }

    const errors = validatePurchaseRegisterDraft(draft)
    setFieldErrors(errors)
    if (hasPurchaseFormErrors(errors)) {
      setGlobalError('입력값을 확인해 주세요.')
      return null
    }

    setStep('saving')
    setGlobalError(null)

    const itemIndex = activeItemIndex ?? 0

    try {
      const saved = await saveGarmentFromPurchaseCapture(
        userId,
        captureId,
        buildPurchaseSavePayload(draft, { itemIndex, captureId }),
      )
      const garment = mapClothesToGarment(saved)

      setPendingItems((prev) =>
        prev.map((item) =>
          item.itemIndex === itemIndex ? { ...item, status: 'saved' } : item,
        ),
      )

      const remaining = pendingItems.filter(
        (item) => item.status === 'pending' && item.itemIndex !== itemIndex,
      ).length
      const hasMorePending = hasMultipleItems && remaining > 0

      if (hasMorePending) {
        setSuccessMessage(`"${garment.name}" 저장 완료. 남은 상품 ${remaining}개를 이어서 등록할 수 있습니다.`)
        setActiveItemIndex(null)
        setDraft(createEmptyPurchaseRegisterDraft())
        setStep('item-select')
      } else {
        setSuccessMessage(`"${garment.name}" 옷이 옷장에 등록되었습니다.`)
      }

      return { garment, hasMorePending }
    } catch (error) {
      setGlobalError(extractApiErrorMessage(error, '옷장 저장에 실패했습니다.'))
      setStep('form')
      return null
    }
  }, [activeItemIndex, captureId, draft, hasMultipleItems, pendingItems, userId])

  const authenticatedServerImageUrl = useAuthenticatedImageSrc(serverImageUrl)
  const displayImageUrl = previewUrl ?? authenticatedServerImageUrl

  const activeItemImageUrl =
    activeItemIndex != null
      ? (pendingItems.find((item) => item.itemIndex === activeItemIndex)?.itemImageUrl ?? null)
      : null

  return {
    step,
    selectedFile,
    previewUrl,
    displayImageUrl,
    activeItemImageUrl,
    captureId,
    pendingItems,
    activeItemIndex,
    hasMultipleItems,
    remainingPendingCount,
    draft,
    setDraft: updateDraft,
    fieldErrors,
    uploadError,
    globalError,
    aiFailed,
    successMessage,
    selectFile,
    runAnalyze,
    selectPendingItem,
    skipPendingItem,
    backToItemSelect,
    saveToCloset,
    reset,
  }
}
