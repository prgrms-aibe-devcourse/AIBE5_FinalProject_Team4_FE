import { Camera, FileText, X } from "./icons";

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
  if (!open) return null;

  return (
    <div
      id="modal-register-method"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[45] animate-fade-in p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-register-method-title"
    >
      <div className="w-full max-w-xl bg-white rounded-[28px] flex flex-col justify-start shadow-2xl px-7 pt-6 pb-6 gap-4 min-h-[480px]">
        <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
          <div className="space-y-0 text-left leading-tight">
            <h3
              id="modal-register-method-title"
              className="text-lg font-bold text-[#1E3A8A]"
            >
              옷 등록 방식 선택
            </h3>
            <p className="text-sm text-slate-400 mt-1 leading-snug">
              구매내역 또는 사진 중 하나를 선택해 옷장에 추가하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
