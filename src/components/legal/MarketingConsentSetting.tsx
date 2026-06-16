import { useEffect, useState } from 'react'
import {
  fetchMarketingConsent,
  updateMarketingConsent,
} from '@/api/marketingConsent'
import LegalDocumentModal from '@/components/legal/LegalDocumentModal'

interface MarketingConsentSettingProps {
  userId: number | null
  enabled: boolean
}

export default function MarketingConsentSetting({
  userId,
  enabled,
}: MarketingConsentSettingProps) {
  const [marketingAgreed, setMarketingAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false)

  useEffect(() => {
    if (!enabled || userId == null) return

    let cancelled = false
    setLoading(true)
    setErrorMessage(null)

    fetchMarketingConsent(userId)
      .then((response) => {
        if (!cancelled) setMarketingAgreed(response.marketingAgreed)
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('마케팅 동의 상태를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, userId])

  const handleChange = async (nextValue: boolean) => {
    if (!enabled || userId == null || saving) return

    const previousValue = marketingAgreed
    setMarketingAgreed(nextValue)
    setSaving(true)
    setErrorMessage(null)

    try {
      const response = await updateMarketingConsent(userId, {
        marketingAgreed: nextValue,
      })
      setMarketingAgreed(response.marketingAgreed)
    } catch {
      setMarketingAgreed(previousValue)
      setErrorMessage('마케팅 동의 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-xs space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-[#1E3A8A]">
            마케팅 정보 수신 동의
          </h3>
          <p className="text-[11px] leading-relaxed text-slate-500">
            이벤트, 서비스 소식, 추천 콘텐츠 안내 수신 여부를 관리합니다.
          </p>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
          <span className="space-y-0.5">
            <span className="block text-xs font-bold text-slate-700">
              수신 동의
            </span>
            <span className="block text-[10px] text-slate-400">
              동의하지 않아도 기본 서비스 이용은 가능합니다.
            </span>
          </span>
          <input
            type="checkbox"
            checked={marketingAgreed}
            disabled={!enabled || loading || saving}
            onChange={(event) => void handleChange(event.target.checked)}
            className="h-5 w-5 accent-[#0284C7] disabled:opacity-40"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <button
            type="button"
            className="font-bold text-[#0284C7] underline decoration-[#0284C7]/30 underline-offset-2"
            onClick={() => setIsConsentModalOpen(true)}
          >
            마케팅 정보 수신 동의 보기
          </button>
          {(loading || saving) && (
            <span className="font-medium text-slate-400">
              {loading ? '상태 확인 중...' : '저장 중...'}
            </span>
          )}
        </div>

        {errorMessage && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-500">
            {errorMessage}
          </p>
        )}
      </section>
      <LegalDocumentModal
        open={isConsentModalOpen}
        title="마케팅 정보 수신 동의"
        src="/legal/marketing-consent.md"
        onClose={() => setIsConsentModalOpen(false)}
      />
    </>
  )
}
