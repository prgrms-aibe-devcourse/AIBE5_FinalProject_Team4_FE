import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthenticatedImageSrc } from '@/utils/authenticatedImageUrl'
import {
  getPhotoAnalysisFailureMessage,
  isPhotoAnalysisFailed,
  resolvePhotoAnalysisDraft,
  saveGarmentFromPhoto,
  uploadGarmentPhoto,
} from '@/api/photoRegistration'
import type { Garment } from '@/types'
import { mapClothesToGarment } from '@/utils/clothesMapper'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  buildDuplicateRegisterError,
  normalizeDuplicateRegisterError,
} from '@/utils/garmentDuplicateCheck'
import {
  hasFormErrors,
  validateGarmentRegisterDraft,
  type GarmentFormFieldErrors,
  type GarmentRegisterDraft,
} from '@/utils/garmentRegisterValidation'
import { validateGarmentImageFile } from '@/utils/imageFileValidation'
import {
  buildPhotoSavePayload,
  createEmptyRegisterDraft,
  mapPhotoDraftToRegisterDraft,
} from '@/utils/photoDraftMapper'

export type PhotoRegisterStep = 'upload' | 'analyzing' | 'form' | 'saving'

export function usePhotoGarmentRegister(
  userId: number | null,
  existingGarments: Garment[] = [],
) {
  const [step, setStep] = useState<PhotoRegisterStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [photoId, setPhotoId] = useState<number | null>(null)
  const [serverImageUrl, setServerImageUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<GarmentRegisterDraft>(createEmptyRegisterDraft())
  const [fieldErrors, setFieldErrors] = useState<GarmentFormFieldErrors>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
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
    setPhotoId(null)
    setServerImageUrl(null)
    setDraft(createEmptyRegisterDraft())
    setFieldErrors({})
    setUploadError(null)
    setGlobalError(null)
    setDuplicateError(null)
    setAiFailed(false)
    setSuccessMessage(null)
  }, [revokePreview])

  useEffect(() => () => revokePreview(), [revokePreview])

  const selectFile = useCallback(
    (file: File | null) => {
      setUploadError(null)
      setGlobalError(null)
      setDuplicateError(null)
      setAiFailed(false)
      setFieldErrors({})
      setSuccessMessage(null)

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
        setPhotoId(null)
        setUploadError(validationError)
        return
      }

      revokePreview()
      const objectUrl = URL.createObjectURL(file)
      previewRef.current = objectUrl
      setSelectedFile(file)
      setPreviewUrl(objectUrl)
      setPhotoId(null)
      setStep('upload')
    },
    [revokePreview],
  )

  const runAnalyze = useCallback(async () => {
    if (!userId) {
      setGlobalError('로그인이 필요합니다. 다시 로그인해 주세요.')
      return
    }
    if (!selectedFile) {
      setUploadError('옷 사진을 먼저 선택해 주세요.')
      return
    }

    setUploadError(null)
    setGlobalError(null)
    setDuplicateError(null)
    setAiFailed(false)
    setFieldErrors({})
    setStep('analyzing')

    let uploadedPhotoId: number | null = null

    try {
      const uploaded = await uploadGarmentPhoto(userId, selectedFile)
      uploadedPhotoId = uploaded.photoId
      setPhotoId(uploaded.photoId)
      if (uploaded.imageUrl) setServerImageUrl(uploaded.imageUrl)

      try {
        const beDraft = await resolvePhotoAnalysisDraft(userId, uploaded.photoId)
        if (isPhotoAnalysisFailed(beDraft)) {
          setAiFailed(true)
          setGlobalError(getPhotoAnalysisFailureMessage(beDraft))
          setDraft(createEmptyRegisterDraft())
        } else {
          setDraft(mapPhotoDraftToRegisterDraft(beDraft))
          if (beDraft.imageUrl) setServerImageUrl(beDraft.imageUrl)
          setAiFailed(false)
        }
      } catch (analyzeError) {
        setAiFailed(true)
        setGlobalError(extractApiErrorMessage(analyzeError))
        setDraft(createEmptyRegisterDraft())
      }

      setStep('form')
    } catch (error) {
      const message = extractApiErrorMessage(error, '사진 업로드 또는 분석에 실패했습니다.')
      if (uploadedPhotoId != null) {
        setAiFailed(true)
        setGlobalError(message)
        setDraft(createEmptyRegisterDraft())
        setStep('form')
      } else {
        setGlobalError(message)
        setUploadError(message)
        setStep('upload')
      }
    }
  }, [selectedFile, userId])

  const updateDraft = useCallback(
    (patch: Partial<GarmentRegisterDraft>) => {
      setDraft((prev) => ({ ...prev, ...patch }))
      setDuplicateError(null)
      setFieldErrors((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(patch) as (keyof GarmentRegisterDraft)[]) {
          const fieldMap: Partial<Record<keyof GarmentRegisterDraft, keyof GarmentFormFieldErrors>> = {
            name: 'name',
            category: 'category',
            itemType: 'itemType',
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
    },
    [],
  )

  const saveToCloset = useCallback(async (): Promise<Garment | null> => {
    if (!userId) {
      setGlobalError('로그인이 필요합니다. 다시 로그인해 주세요.')
      return null
    }
    if (photoId == null) {
      setGlobalError('사진 업로드 후 저장할 수 있습니다.')
      return null
    }

    const errors = validateGarmentRegisterDraft(draft)
    setFieldErrors(errors)
    if (hasFormErrors(errors)) {
      setGlobalError('입력값을 확인해 주세요.')
      return null
    }

    const duplicateMessage = buildDuplicateRegisterError(existingGarments, {
      name: draft.name,
      brandName: draft.brandName,
      category: draft.category,
      itemType: draft.itemType,
      primaryColor: draft.mainColor,
    })
    if (duplicateMessage) {
      setDuplicateError(duplicateMessage)
      setGlobalError(null)
      setStep('form')
      return null
    }

    setStep('saving')
    setGlobalError(null)
    setDuplicateError(null)

    try {
      const saved = await saveGarmentFromPhoto(
        userId,
        photoId,
        buildPhotoSavePayload(draft),
      )
      const garment = mapClothesToGarment(saved)
      setSuccessMessage(`"${garment.name}" 옷이 옷장에 등록되었습니다.`)
      return garment
    } catch (error) {
      const message = extractApiErrorMessage(error, '옷장 저장에 실패했습니다.')
      const duplicate = normalizeDuplicateRegisterError(message)
      if (duplicate) {
        setDuplicateError(duplicate)
        setGlobalError(null)
      } else {
        setDuplicateError(null)
        setGlobalError(message)
      }
      setStep('form')
      return null
    }
  }, [draft, existingGarments, photoId, userId])

  const authenticatedServerImageUrl = useAuthenticatedImageSrc(serverImageUrl)
  const displayImageUrl = previewUrl ?? authenticatedServerImageUrl

  return {
    step,
    selectedFile,
    previewUrl,
    displayImageUrl,
    photoId,
    draft,
    setDraft: updateDraft,
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
  }
}
