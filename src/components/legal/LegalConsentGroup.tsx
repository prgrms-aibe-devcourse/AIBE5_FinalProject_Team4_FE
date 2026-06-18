import { useState } from 'react'
import LegalDocumentModal from '@/components/legal/LegalDocumentModal'
import { ChevronRight } from '@/components/icons'

interface LegalConsentGroupProps {
  termsAgreed: boolean
  privacyAgreed: boolean
  marketingAgreed: boolean
  onTermsChange: (checked: boolean) => void
  onPrivacyChange: (checked: boolean) => void
  onMarketingChange: (checked: boolean) => void
}

const documents = {
  terms: {
    documentType: 'terms',
  },
  privacy: {
    documentType: 'privacy-policy',
  },
  marketing: {
    documentType: 'marketing-consent',
  },
} as const

type DocumentKey = keyof typeof documents

export default function LegalConsentGroup({
  termsAgreed,
  privacyAgreed,
  marketingAgreed,
  onTermsChange,
  onPrivacyChange,
  onMarketingChange,
}: LegalConsentGroupProps) {
  const [openedDocument, setOpenedDocument] = useState<DocumentKey | null>(null)
  const allChecked = termsAgreed && privacyAgreed && marketingAgreed
  const currentDocument = openedDocument ? documents[openedDocument] : null

  const handleAllChange = (checked: boolean) => {
    onTermsChange(checked)
    onPrivacyChange(checked)
    onMarketingChange(checked)
  }

  return (
    <>
      <div className="border-t border-slate-200 pt-3 text-left">
        <label className="flex cursor-pointer select-none items-center gap-3">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(event) => handleAllChange(event.target.checked)}
            className="h-5 w-5 cursor-pointer accent-[#0284C7]"
          />
          <span className="text-[15px] font-black leading-tight text-slate-950">
            모두 확인하였으며 동의합니다.
          </span>
        </label>

        <p className="mt-2.5 pl-8 text-[11px] leading-relaxed text-slate-500">
          필수와 선택 동의를 한 번에 선택할 수 있으며, 선택 동의는 거부해도
          서비스 이용이 가능합니다.
        </p>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <ConsentRow
            checked={termsAgreed}
            onChange={onTermsChange}
            label="이용약관 동의"
            requirement="필수"
            documentKey="terms"
            onOpenDocument={setOpenedDocument}
            required
          />
          <ConsentRow
            checked={privacyAgreed}
            onChange={onPrivacyChange}
            label="개인정보 처리방침 동의"
            requirement="필수"
            documentKey="privacy"
            onOpenDocument={setOpenedDocument}
            required
          />
          <ConsentRow
            checked={marketingAgreed}
            onChange={onMarketingChange}
            label="마케팅 정보 수신 동의"
            requirement="선택"
            documentKey="marketing"
            onOpenDocument={setOpenedDocument}
          />
        </div>
      </div>

      {currentDocument ? (
        <LegalDocumentModal
          open
          documentType={currentDocument.documentType}
          onClose={() => setOpenedDocument(null)}
        />
      ) : null}
    </>
  )
}

interface ConsentRowProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  requirement: string
  documentKey: DocumentKey
  onOpenDocument: (documentKey: DocumentKey) => void
  required?: boolean
}

function ConsentRow({
  checked,
  onChange,
  label,
  requirement,
  documentKey,
  onOpenDocument,
  required = false,
}: ConsentRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <label className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 cursor-pointer accent-[#0284C7]"
        />
        <span className="min-w-0 flex-1 font-extrabold leading-tight">
          <span className={required ? 'text-[#0284C7]' : 'text-slate-500'}>
            [{requirement}]
          </span>{' '}
          <span className="text-slate-800">{label}</span>
        </span>
      </label>
      <button
        type="button"
        aria-label={`${label} 원문 보기`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0284C7]"
        onClick={() => onOpenDocument(documentKey)}
      >
        <ChevronRight className="h-4 w-4 stroke-[3]" />
      </button>
    </div>
  )
}
