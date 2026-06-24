import React from 'react'
import {Modal, ModalBody, ModalFooter, ModalHeader} from '@/components/common/Modal'
import type {ModalZIndex} from '@/components/common/Modal'

interface ExitConfirmModalProps {
    open: boolean
    onConfirm: () => void   // 나가기
    onCancel: () => void    // 계속 작성
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    preventClose?: boolean
    zIndex?: ModalZIndex
}

export default function ExitConfirmModal({
                                             open,
                                             onConfirm,
                                             onCancel,
                                             title = '작성 중인 내용이 있어요',
                                             description = '지금 나가면 수정 내용이 사라져요.\n계속 수정하시겠어요?',
                                             confirmText = '나가기',
                                             cancelText = '계속 수정',
                                             preventClose = true,
                                             zIndex,
                                         }: ExitConfirmModalProps) {
    return (
        <Modal
            open={open}
            onClose={preventClose ? () => {
            } : onCancel}
            size="sm"
            placement="center"
            zIndex={zIndex ?? 120}
            closeOnBackdrop={false}
        >
            <ModalHeader
                title={title}
                onClose={preventClose ? undefined : onCancel}
            />
            <ModalBody className="px-6 py-4">
                <p className="text-sm text-slate-600 whitespace-pre-line">{description}</p>
            </ModalBody>
            <ModalFooter className="p-4 flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 h-12 rounded-2xl bg-[#111827] text-white text-sm font-black hover:bg-slate-800 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 transition-colors"
                >
                    {confirmText}
                </button>
            </ModalFooter>
        </Modal>
    )
}

/**
 * 사용 가이드
 *
 * 1. isDirty, showExitConfirm 상태 추가
 *    const [isDirty, setIsDirty] = useState(false)
 *    const [showExitConfirm, setShowExitConfirm] = useState(false)
 *
 * 2. 내용 변경 시 isDirty = true 설정
 *    onChange={() => { setIsDirty(true); ... }}
 *
 * 3. 닫기 핸들러 추가
 *    const handleClose = () => {
 *      if (isDirty) {
 *        setShowExitConfirm(true)
 *      } else {
 *        onClose()
 *      }
 *    }
 *
 * 4. 기존 onClose → handleClose로 교체
 *    <Modal onClose={handleClose} ...>
 *    <button onClick={handleClose}>닫기</button>
 *
 * 5. ExitConfirmModal 추가
 *    <ExitConfirmModal
 *      open={showExitConfirm}
 *      onConfirm={() => { setIsDirty(false); onClose() }}
 *      onCancel={() => setShowExitConfirm(false)}
 *    />
 *
 * 6. 저장 성공 시 isDirty 초기화
 *    setIsDirty(false)
 *    onClose()
 */