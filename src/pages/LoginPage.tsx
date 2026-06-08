import { Activity, Sparkle } from "../components/icons";
import type { OAuthProvider } from "@/utils/authLogin";

interface LoginPageProps {
  onSocialLogin: (provider: OAuthProvider) => void | Promise<void>;
  isModal?: boolean;
  onClose?: () => void;
}

export default function LoginPage({ onSocialLogin, isModal, onClose }: LoginPageProps) {
    const card = (
        <div id="view-login" className="w-full max-w-md bg-white border border-slate-200/60 rounded-[28px] shadow-2xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[560px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BBF7D0]/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="text-center space-y-4 mt-6">
                <div className="inline-flex p-3.5 rounded-2xl bg-[#BBF7D0]/20 text-[#0284C7] animate-bounce">
                    <Sparkle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[#0284C7]">옷장 난감</h1>
                <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Closet Toy • Smart Fashion Studio</p>
                <div className="w-12 h-1 bg-[#BBF7D0] mx-auto rounded-full"></div>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-left font-sans">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0284C7]">
                    <Activity className="w-4 h-4" />
                    <span>실루엣 스타일 맞춤 코디 매칭</span>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed font-sans">
                    단순 매칭이 아닙니다. 의류의 컬러 조합과 톤인톤 감성을 분석하여 조화로운 스타일 실루엣 코디 세트를 실시간 빌드합니다.
                </p>
            </div>

            <div className="space-y shadow-2xs bg-slate-50/50 p-4 rounded-2xl space-y-3 mt-4">
                <div className="text-center text-[10px] text-slate-400 font-bold tracking-wide uppercase">소셜 로그인으로 시작하기</div>
                <button
                    id="btn-login-kakao"
                    onClick={() => onSocialLogin("kakao")}
                    className="w-full h-11.5 rounded-xl bg-[#FEE500] hover:bg-[#FEE500]/95 text-[#191919] font-bold text-xs flex items-center justify-center space-x-3 transition active:scale-98 cursor-pointer"
                >
                    <span className="w-5 h-5 rounded-md bg-[#191919]/15 flex items-center justify-center text-[10px] font-black">K</span>
                    <span>카카오 아이디로 계속하기</span>
                </button>
                <button
                    id="btn-login-naver"
                    onClick={() => onSocialLogin("naver")}
                    className="w-full h-11.5 rounded-xl bg-[#03C75A] hover:bg-[#03C75A]/95 text-white font-bold text-xs flex items-center justify-center space-x-3 transition active:scale-98 cursor-pointer"
                >
                    <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-[10px] font-black">N</span>
                    <span>네이버로 로그인</span>
                </button>
                <button
                    id="btn-login-google"
                    onClick={() => onSocialLogin("google")}
                    className="w-full h-11.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-3 transition hover:bg-slate-50 active:scale-98 cursor-pointer shadow-2xs"
                >
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#0284C7]">G</span>
                    <span>Google 계정으로 인증</span>
                </button>
            </div>
        </div>
    );

    if (isModal){
        return <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4"
        onClick={(e) => { if (e.target === e.currentTarget ) onClose?.(); }}>{card}</div>;
    }
    return <div className="flex-1 flex items-center justify-center py-12">{card}</div>;
    }
