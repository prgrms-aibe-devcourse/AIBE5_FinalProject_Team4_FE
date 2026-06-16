import api from '@/api'
import type { BeApiResponse } from '@/types/be'

export interface MarketingConsentResponse {
  marketingAgreed: boolean
}

export interface MarketingConsentUpdateRequest {
  marketingAgreed: boolean
}

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function fetchMarketingConsent(
  userId: number,
): Promise<MarketingConsentResponse> {
  return unwrap(
    api.get<BeApiResponse<MarketingConsentResponse>>(
      `/api/v1/users/${userId}/marketing-consent`,
    ),
  )
}

export async function updateMarketingConsent(
  userId: number,
  payload: MarketingConsentUpdateRequest,
): Promise<MarketingConsentResponse> {
  return unwrap(
    api.patch<BeApiResponse<MarketingConsentResponse>>(
      `/api/v1/users/${userId}/marketing-consent`,
      payload,
    ),
  )
}
