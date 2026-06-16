import api from '@/api'
import type { BeApiResponse } from '@/types/be'

export type LegalDocumentType = 'terms' | 'privacy-policy' | 'marketing-consent'

export interface LegalDocumentResponse {
  policyType: string
  version: string
  effectiveDate: string
  lastUpdated: string
  content: string
}

function unwrap<T>(response: BeApiResponse<T>): T {
  if (!response.success || response.data == null) {
    throw new Error(response.message ?? '약관 문서를 불러오지 못했습니다.')
  }

  return response.data
}

export async function fetchLegalDocument(
  documentType: LegalDocumentType,
): Promise<LegalDocumentResponse> {
  const response = await api.get<BeApiResponse<LegalDocumentResponse>>(
    `/api/v1/legal/${documentType}`,
    {
      headers: {
        'X-Skip-Global-Error-Redirect': 'true',
      },
    },
  )

  return unwrap(response.data)
}
