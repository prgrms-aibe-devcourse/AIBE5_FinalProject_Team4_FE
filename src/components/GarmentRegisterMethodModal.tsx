import { Camera, FileText } from "./icons";
import { Modal, ModalBody, ModalHeader } from "@/components/common/Modal";

interface GarmentRegisterMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectReceipt: () => void;
  onSelectPhoto: () => void;
}

export default function GarmentRegisterMethodModal({
  open,
  onClose,
  onSelectReceipt,
  onSelectPhoto,
}: GarmentRegisterMethodModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      id="modal-register-method"
      titleId="modal-register-method-title"
      panelClassName="min-h-[480px] px-7 pb-6 gap-4"
    >
      <ModalHeader
        title="옷 등록 방식 선택"
        titleId="modal-register-method-title"
        subtitle="구매내역 또는 사진 중 하나를 선택해 옷장에 추가하세요."
        onClose={onClose}
        className="px-0 pt-6 pb-1.5"
      />

      <ModalBody className="px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-20 sm:mt-28">
          <button
            id="option-register-receipt"
            type="button"
            onClick={onSelectReceipt}
            className="p-4 bg-slate-50/70 hover:bg-[#BBF7D0]/20 rounded-2xl border border-slate-100 hover:border-[#BBF7D0]/60 text-left space-y-2 transition group active:scale-98 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-white text-[#1E3A8A] w-max shadow-3xs">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 leading-tight">
              <h4 className="text-base font-black text-slate-800">
                구매내역 기반 등록
              </h4>
              <p className="text-xs text-slate-400 leading-snug">
                쇼핑 영수증·구매 캡처를 분석해 보유 옷으로 저장합니다.
              </p>
            </div>
          </button>

          <button
            id="option-register-photo"
            type="button"
            onClick={onSelectPhoto}
            className="p-4 bg-slate-50/70 hover:bg-[#BBF7D0]/20 rounded-2xl border border-dashed border-slate-200/80 hover:border-[#BBF7D0]/60 text-left space-y-2 transition group active:scale-98 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-white text-[#1E3A8A] w-max shadow-3xs">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 leading-tight">
              <h4 className="text-base font-black text-slate-800">
                사진 기반 등록
              </h4>
              <p className="text-xs text-slate-400 leading-snug">
                옷 사진을 촬영·업로드해 AI 분석 후 옷장에 등록합니다.
              </p>
            </div>
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
