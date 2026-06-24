import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Modal,
  ModalBody,
  ModalHeader,
} from '@/components/common/Modal'
import { fetchLegalDocument, type LegalDocumentType } from '@/api/legalDocuments'

interface LegalDocumentModalProps {
  open: boolean
  documentType: LegalDocumentType
  onClose: () => void
}

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

const LEGAL_DOCUMENT_LOAD_ERROR_MESSAGE = '약관 문서를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.'

const headingClassName: Record<number, string> = {
  1: 'text-xl font-black text-[#1E3A8A] mt-1',
  2: 'text-base font-extrabold text-slate-800 mt-6',
  3: 'text-sm font-extrabold text-slate-700 mt-5',
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/, '').trim()
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function isTableStart(lines: string[], index: number) {
  return (
    lines[index]?.includes('|') &&
    lines[index + 1]?.includes('|') &&
    isTableSeparator(lines[index + 1])
  )
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = stripFrontmatter(markdown).split(/\r?\n/)
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index])
      index += 2
      const rows: string[][] = []

      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]))
        index += 1
      }

      blocks.push({ type: 'table', headers, rows })
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'unordered-list', items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'ordered-list', items })
      continue
    }

    const paragraphLines: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !isTableStart(lines, index)
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function renderInlineText(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1 py-0.5 text-[0.9em] font-semibold text-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-700">
          {part.slice(2, -2)}
        </strong>
      )
    }

    return part
  })
}

function renderMarkdownBlocks(blocks: MarkdownBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === 'heading') {
      const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3'
      return (
        <HeadingTag
          key={index}
          className={`${headingClassName[block.level] ?? headingClassName[3]} leading-snug`}
        >
          {block.text}
        </HeadingTag>
      )
    }

    if (block.type === 'paragraph') {
      return (
        <p key={index} className="text-sm leading-7 text-slate-600">
          {renderInlineText(block.text)}
        </p>
      )
    }

    if (block.type === 'unordered-list') {
      return (
        <ul key={index} className="list-disc space-y-1.5 pl-5 text-sm leading-7 text-slate-600">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineText(item)}</li>
          ))}
        </ul>
      )
    }

    if (block.type === 'ordered-list') {
      return (
        <ol key={index} className="list-decimal space-y-1.5 pl-5 text-sm leading-7 text-slate-600">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineText(item)}</li>
          ))}
        </ol>
      )
    }

    return (
      <div key={index} className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              {block.headers.map((header, headerIndex) => (
                <th
                  key={headerIndex}
                  scope="col"
                  className="px-3 py-2 font-extrabold text-slate-600"
                >
                  {renderInlineText(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {block.headers.map((_, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 leading-6 text-slate-600">
                    {renderInlineText(row[cellIndex] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  })
}

export default function LegalDocumentModal({
  open,
  documentType,
  onClose,
}: LegalDocumentModalProps) {
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setErrorMessage(null)

    fetchLegalDocument(documentType)
      .then((document) => {
        if (!cancelled) setMarkdown(document.content ?? '')
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage(LEGAL_DOCUMENT_LOAD_ERROR_MESSAGE)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, documentType, retryCount])

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown])

  const handleRetry = () => setRetryCount((c) => c + 1)

  return (
    <Modal open={open} onClose={onClose} size="lg" zIndex={120} closeOnBackdrop>
      <ModalHeader title="LEGAL" onClose={onClose} align="center" />
      <ModalBody className="px-5 sm:px-7 py-5">
        {loading ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
            약관 문서를 불러오는 중입니다.
          </p>
        ) : errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-5 text-center text-sm font-bold leading-relaxed text-red-500 break-keep space-y-3">
            <p className="whitespace-pre-line">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mx-auto flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="space-y-4">{renderMarkdownBlocks(blocks)}</div>
        )}
      </ModalBody>
    </Modal>
  )
}
