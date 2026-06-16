import { useState } from 'react'
import LegalDocumentModal from '@/components/legal/LegalDocumentModal'

interface LegalLinksProps {
  className?: string
}

const legalLinkClass =
  'font-extrabold text-[#0284C7] underline decoration-[#0284C7]/30 underline-offset-2 hover:text-[#0369a1]'

const legalDocuments = {
  terms: {
    title: '서비스 이용약관',
    src: '/legal/terms.md',
  },
  privacy: {
    title: '개인정보처리방침',
    src: '/legal/privacy-policy.md',
  },
} as const

type LegalDocumentKey = keyof typeof legalDocuments

export default function LegalLinks({ className }: LegalLinksProps) {
  const [selectedDocument, setSelectedDocument] = useState<LegalDocumentKey | null>(null)
  const openedDocument = selectedDocument ? legalDocuments[selectedDocument] : null

  return (
    <>
      <p className={className ?? 'text-center text-[11px] leading-relaxed text-slate-400'}>
        로그인 시 옷장난감의{' '}
        <button
          type="button"
          className={legalLinkClass}
          onClick={() => setSelectedDocument('terms')}
        >
          이용약관
        </button>{' '}
        및{' '}
        <button
          type="button"
          className={legalLinkClass}
          onClick={() => setSelectedDocument('privacy')}
        >
          개인정보처리방침
        </button>
        에 동의하게 됩니다.
      </p>
      {openedDocument ? (
        <LegalDocumentModal
          open
          title={openedDocument.title}
          src={openedDocument.src}
          onClose={() => setSelectedDocument(null)}
        />
      ) : null}
    </>
  )
}
