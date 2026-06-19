import { Activity, Sparkle } from "../components/icons";
import type { OAuthProvider } from "@/utils/authLogin";
import LegalLinks from "@/components/legal/LegalLinks";

interface LoginPageProps {
  onSocialLogin: (provider: OAuthProvider) => void | Promise<void>;
  isModal?: boolean;
  onClose?: () => void;
}

function KakaoLogo() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
                fill="currentColor"
                d="M12 4C6.48 4 2 7.54 2 11.91c0 2.77 1.8 5.2 4.52 6.62l-.82 3.02c-.08.29.25.52.5.35l3.61-2.4c.71.14 1.44.22 2.19.22 5.52 0 10-3.54 10-7.91S17.52 4 12 4Z"
            />
        </svg>
    );
}

function NaverLogo() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path fill="currentColor" d="M4 4h6.08l3.84 5.52V4H20v16h-6.08l-3.84-5.52V20H4V4Z" />
        </svg>
    );
}

function GoogleLogo() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
                fill="#4285F4"
                d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.44Z"
            />
            <path
                fill="#34A853"
                d="M12 22c2.7 0 4.96-.89 6.62-2.33l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22Z"
            />
            <path
                fill="#FBBC05"
                d="M6.41 14A6.01 6.01 0 0 1 6.1 12c0-.69.11-1.36.31-2V7.41H3.06A9.99 9.99 0 0 0 2 12c0 1.61.38 3.13 1.06 4.59L6.41 14Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.88c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.95 2.89 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.41L6.41 10C7.2 7.64 9.4 5.88 12 5.88Z"
            />
        </svg>
    );
}

export default function LoginPage({ onSocialLogin, isModal, onClose }: LoginPageProps) {
    const card = (
        <div id="view-login" className="w-full max-w-md bg-white border border-slate-200/60 rounded-[28px] shadow-2xl p-8 relative overflow-hidden flex flex-col min-h-[560px] animate-modal-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BBF7D0]/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="text-center space-y-4 mt-6">
                <div className="inline-flex p-3.5 rounded-2xl bg-[#BBF7D0]/20 text-[#0284C7] animate-bounce">
                    <Sparkle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[#0284C7]">옷장난감</h1>
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">closetnangam</p>
                <div className="w-12 h-1 bg-[#BBF7D0] mx-auto rounded-full"></div>
            </div>

            <div className="mt-8 p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center font-sans">
                <div className="flex items-center justify-center space-x-2 text-xs font-extrabold text-[#0284C7]">
                    <Activity className="w-4 h-4" />
                    <span>내 옷장 • 취향 기반 AI 추천</span>
                </div>
                <p className="mx-auto max-w-[17rem] text-[12px] text-slate-500 leading-relaxed font-sans">
                    보유 옷과 관심 상품, 취향 데이터를 바탕으로 분석하여 상품과 코디를 제안합니다.
                </p>
            </div>

            <div className="space-y-3 mt-7">
                <button
                    id="btn-login-kakao"
                    onClick={() => onSocialLogin("kakao")}
                    className="relative w-full h-11.5 rounded-xl bg-[#FEE500] hover:bg-[#FEE500]/95 text-[#191919] font-bold text-xs flex items-center justify-center transition active:scale-98 cursor-pointer"
                >
                    <span className="absolute left-5 flex items-center justify-center">
                        <KakaoLogo />
                    </span>
                    <span>Kakao로 계속하기</span>
                </button>
                <button
                    id="btn-login-naver"
                    onClick={() => onSocialLogin("naver")}
                    className="relative w-full h-11.5 rounded-xl bg-[#03C75A] hover:bg-[#03C75A]/95 text-white font-bold text-xs flex items-center justify-center transition active:scale-98 cursor-pointer"
                >
                    <span className="absolute left-5 flex items-center justify-center">
                        <NaverLogo />
                    </span>
                    <span>Naver로 계속하기</span>
                </button>
                <button
                    id="btn-login-google"
                    onClick={() => onSocialLogin("google")}
                    className="relative w-full h-11.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition hover:bg-slate-50 active:scale-98 cursor-pointer shadow-2xs"
                >
                    <span className="absolute left-5 flex items-center justify-center">
                        <GoogleLogo />
                    </span>
                    <span>Google로 계속하기</span>
                </button>
            </div>

            <LegalLinks className="mt-5 text-center text-[11px] leading-relaxed text-slate-400" />
        </div>
    );

    if (isModal){
        return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={(e) => { if (e.target === e.currentTarget ) onClose?.(); }}>{card}</div>;
    }
    return <div className="flex-1 flex items-center justify-center py-12">{card}</div>;
    }
