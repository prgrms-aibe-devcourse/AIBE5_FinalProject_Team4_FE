/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Home, 
  X, 
  ChevronRight,
  Activity, 
  Info, 
  Layers,
} from "./components/icons";
import { UserProfile } from "@/types/index";
import HomeTab from "./components/HomeTab";
import ClosetTab from "./components/ClosetTab";
import GarmentRegisterMethodModal from "./components/GarmentRegisterMethodModal";
import PhotoGarmentRegisterModal from "./components/PhotoGarmentRegisterModal";
import {
  captureOAuthTokenFromUrl,
  getUserIdFromAccessToken,
} from "@/utils/authUser";
import { ensureDevToken, DEFAULT_DEV_USER_ID } from "@/utils/ensureDevToken";
import {
  redirectToOAuthLogin,
  type OAuthProvider,
} from "@/utils/authLogin";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useChat } from "@/hooks/useChat";
import { useCloset } from "@/hooks/useCloset";

// 기존 상수 data ( TRIGGER_PRODUCTS 는 사용을 하지않아 우선 주석처리함 )
// import { TRIGGER_PRODUCTS } from "@/data/triggerProducts";

export default function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => getUserIdFromAccessToken() != null,
  );
  const [authUserId, setAuthUserId] = useState<number | null>(
    getUserIdFromAccessToken,
  );
  /** 온보딩 후 dev mock-token 등 인증 동기화 완료 */
  const [authReady, setAuthReady] = useState(false);
  const [authTokenError, setAuthTokenError] = useState<string | null>(null);
  
  // User Profile Setup State
  const [profile, setProfile] = useState<UserProfile>({
    nickname: "",
    gender: "None",
    styles: [],
    onboarded: false,
    birthday: "",
  });

  const { gamyagiChatOpen, setGamyagiChatOpen, chatMessages, pendingMsg, setPendingMsg, chatSending, handleSendChatToMD } = useChat();

  // 옷장
  const {
    clothes, setClothes,
    selectedGarment, setSelectedGarment,
    isMethodSelectOpen,
    isUploadModalOpen, setIsUploadModalOpen,
    uploadType, setUploadType,
    isAnalyzing,
    analyzedDraft, setAnalyzedDraft,
    selectedLocalImg, setSelectedLocalImg,
    handleAddWishlistItem,
    toggleFavorite,
    moveToOwnedCloset,
    handleSaveToCloset,
    openGarmentRegister,
    closeGarmentRegisterMethod,
    selectRegisterMethod,
    backToRegisterMethodSelect,
  } = useCloset();

  // Navigation state: 'home' | 'closet' | 'feed' | 'profile'
  const [currentTab, setCurrentTab] = useState<"home" | "closet" | "feed" | "profile">("home");
  const [homeResetSignal, setHomeResetSignal] = useState<number>(0);
  const [isPhotoRegisterOpen, setIsPhotoRegisterOpen] = useState(false);

  // OAuth 콜백(?token=): URL에서 토큰 추출 후 상태 반영
  useEffect(() => {
    if (captureOAuthTokenFromUrl()) {
      const uid = getUserIdFromAccessToken();
      setAuthUserId(uid);
      setIsLoggedIn(uid != null);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setAuthUserId(null);
      setAuthReady(false);
      setAuthTokenError(null);
      return;
    }

    let cancelled = false;
    setAuthReady(false);
    setAuthTokenError(null);

    (async () => {
      let tokenError: string | null = null;
      if (import.meta.env.DEV && !getUserIdFromAccessToken()) {
        try {
          await ensureDevToken(DEFAULT_DEV_USER_ID, { forceRefresh: false });
        } catch (err) {
          tokenError =
            err instanceof Error
              ? err.message
              : "개발용 토큰 발급에 실패했습니다.";
          console.warn("[dev] mock-token 발급 실패:", err);
        }
      }

      if (cancelled) return;
      setAuthUserId(getUserIdFromAccessToken());
      setAuthTokenError(tokenError);
      setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, profile.onboarded]);

  const scrollAppToTop = () => {
    const viewport = document.getElementById("app-viewport");
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHomeNavigation = () => {
    setCurrentTab("home");
    setHomeResetSignal((signal) => signal + 1);
    window.setTimeout(scrollAppToTop, 0);
  };

  const handleSocialLogin = async (platform: OAuthProvider) => {
    if (import.meta.env.DEV) {
      try {
        await ensureDevToken(DEFAULT_DEV_USER_ID, { forceRefresh: true });
        setIsLoggedIn(true);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "개발용 토큰 발급에 실패했습니다.";
        alert(`${msg}\n\nBE(local:8080) 실행 여부를 확인해 주세요.`);
      }
      return;
    }
    redirectToOAuthLogin(platform);
  };

  return (
    <div id="root-container" className="min-h-screen bg-[#F1F5F9] font-sans antialiased text-slate-800 flex flex-col justify-between py-4 px-3 md:py-6 md:px-6 font-sans">
      
      {/* ========================================================= */}
      {/* 1. AUTH / LOGIN FLOW MODAL VIEW */}
      {/* ========================================================= */}
      {!isLoggedIn && <LoginPage onSocialLogin={handleSocialLogin} />}

      {/* ========================================================= */}
      {/* 2. ONBOARDING PROFILE FLOWS */}
      {/* ========================================================= */}
      {isLoggedIn && !profile.onboarded && (
          <OnboardingPage onComplete={(nickname, birthday, gender, styles, openModal) => {
            setProfile({ nickname, birthday, gender, styles, onboarded: true });
            if (openModal) openGarmentRegister();
          }} />
      )}

        {/* ========================================================= */}
        {/* MAIN APPLICATION (Logged in & Onboarded) */}
        {/* ========================================================= */}
        {isLoggedIn && profile.onboarded && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative bg-[#F8FAFC]">
            
            {/* ----------------- Header GNB ----------------- */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 px-5 py-4.5 flex items-center justify-between z-30">
              {/* Logo / Left */}
              <div 
                className="flex items-center gap-2 cursor-pointer selection:bg-transparent group/logo"
                onClick={() => setCurrentTab("home")}
              >
                <svg className="brand-symbol-image" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <path d="M16 49V20.5c0-3.6 2.9-6.5 6.5-6.5h1.6C25.5 9.9 28.3 8 32 8s6.5 1.9 7.9 6h1.6c3.6 0 6.5 2.9 6.5 6.5V49H16Z" fill="white" stroke="#111827" strokeWidth="3.1" strokeLinejoin="round" />
                  <path d="M32 19.6v29.2" stroke="#111827" strokeWidth="3.1" strokeLinecap="round" />
                  <path d="M32 19.8c0-2.7 3.1-2.1 3.1-4.2 0-1.3-1.2-1.6-2.5-1.6-1.2 0-2.2.5-2.8 1.4" stroke="#A78BFA" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M32 20.2 22.6 26.1h18.8L32 20.2Z" stroke="#111827" strokeWidth="2.8" strokeLinejoin="round" />
                  <circle cx="25.7" cy="34.5" r="2" fill="#111827" />
                  <circle cx="38.3" cy="34.5" r="2" fill="#111827" />
                  <circle cx="32" cy="40.4" r="1.8" fill="#A78BFA" stroke="#111827" strokeWidth="1.4" />
                  <path d="M20.8 49v4.2" stroke="#111827" strokeWidth="3.1" strokeLinecap="round" />
                  <path d="M43.2 49v4.2" stroke="#111827" strokeWidth="3.1" strokeLinecap="round" />
                  <path d="M10.7 27.2c-3.3-.6-5.6 1-5.7 3.6-.1 2.2 1.5 3.2 3.1 3.8" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                  <path d="M7.7 40.2h.1" stroke="#A78BFA" strokeWidth="3.6" strokeLinecap="round" />
                  <path d="M55.1 10.8c2.9-1.1 5.4.3 5.8 2.8.4 2.4-1.1 3.8-3.2 4.8-1.4.7-1.7 1.5-1.6 2.8" stroke="#A78BFA" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M56.4 27.2h.1" stroke="#A78BFA" strokeWidth="3.8" strokeLinecap="round" />
                  <path d="M13.2 14.8 9.7 12.4" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                  <path d="M16.7 11.2 15.8 7.7" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="brand-wordmark" aria-label="옷장난감">
                  <span>옷</span>
                  <span>장</span>
                  <span>난</span>
                  <span>감</span>
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center space-x-4">
                {/* Notification Bell Icon */}
                <button 
                  onClick={() => {
                    alert("🔔 새로운 알림이 없습니다. 감각이와 패션 매칭 준비가 완료되었습니다!");
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition relative cursor-pointer"
                  title="알림 수신함"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                </button>

                {/* Profile Avatar Icon */}
                <div 
                  onClick={() => setCurrentTab("profile")}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 stroke-2 text-xs font-bold ring-2 ring-slate-100 cursor-pointer transition"
                  title="Style Profile Screen"
                >
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </header>

            {/* Main scrollable body pane */}
            <main id="app-viewport" className="h-screen overflow-y-auto px-5 pt-24 pb-24 space-y-6">
              
              {/* ========================================================= */}
              {/* TAB 1: HOME (Curation Dashboard & Gamyagi) */}
              {/* ========================================================= */}
              {currentTab === "home" && (
                <HomeTab
                  clothes={clothes}
                  onAddWishlistItem={handleAddWishlistItem}
                  nickname={profile.nickname}
                  resetSignal={homeResetSignal}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 2: MY CLOSET (Smart Closet view & Anatomical Fit Guide) */}
              {/* ========================================================= */}
              {currentTab === "closet" && profile.onboarded && !authReady && (
                <div className="flex justify-center py-16 text-sm text-slate-500">
                  로그인 토큰을 준비하는 중…
                </div>
              )}
              {currentTab === "closet" &&
                authReady &&
                authTokenError != null && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
                    {authTokenError}
                    <p className="mt-2 text-xs text-amber-800">
                      BE를 local 프로필로 8080에서 실행한 뒤 새로고침해 주세요.
                    </p>
                  </div>
                )}
              {currentTab === "closet" &&
                authReady &&
                authTokenError == null &&
                authUserId != null && (
                <ClosetTab
                  clothes={clothes}
                  setClothes={setClothes}
                  selectedGarment={selectedGarment}
                  setSelectedGarment={setSelectedGarment}
                  userId={authUserId}
                  onOpenRegister={openGarmentRegister}
                />
              )}
              {currentTab === "closet" &&
                authReady &&
                authTokenError == null &&
                authUserId == null && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
                  로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: STYLE FEED (Mockup curation sandbox) */}
              {/* ========================================================= */}
              {currentTab === "feed" && (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#1E3A8A]">Closet Toy 스타일 실시간 피드</h3>
                    <p className="text-xs text-slate-400">다른 해부학 스마트 유저들의 인체 조화 스타일링 스냅샷을 구경하세요.</p>
                  </div>

                  {/* Feed mock 1 */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                    <img 
                      src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800" 
                      className="w-full h-48 object-cover object-top"
                      alt="Street feed user"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">🤖</span>
                          <span className="text-xs font-bold text-slate-700">@tech_minimalist_kim</span>
                        </div>
                        <span className="bg-[#BBF7D0] text-[#1E3A8A] text-[10px] font-bold px-2 py-0.5 rounded-full">94% 만족</span>
                      </div>
                      <p className="text-xs text-slate-500">"고정밀 쉘 테크니컬 아노락을 코디 추천받아 착용해보니 어깨 라인부터 흐르는 drape 핏이 정말 마음에 들어요!"</p>
                      
                      <div className="flex items-center space-x-1.5 text-[10px] text-[#1E3A8A] font-semibold bg-slate-50 p-2 rounded-lg">
                        <Activity className="w-3.5 h-3.5" />
                        <span>의류 조화 레이어링 지수 우수</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed mock 2 */}
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                    <img 
                      src="https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800" 
                      className="w-full h-48 object-cover"
                      alt="Casual denim feed"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">👟</span>
                          <span className="text-xs font-bold text-slate-700">@ame_gorp_lover</span>
                        </div>
                        <span className="bg-[#BBF7D0] text-[#1E3A8A] text-[10px] font-bold px-2 py-0.5 rounded-full">91% 만족</span>
                      </div>
                      <p className="text-xs text-slate-500">"허벅지가 굵은 축하형 골단 구조인데 와이드 셀비지 팬츠가 고관절 복부 압박없이 가볍게 아래로 흐르네요."</p>

                      <div className="flex items-center space-x-1.5 text-[10px] text-[#1E3A8A] font-semibold bg-slate-50 p-2 rounded-lg">
                        <Activity className="w-3.5 h-3.5" />
                        <span>골반 대퇴골 가동역 98% 확보</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: MY PROFILE (Anatomical diagnostic details) */}
              {/* ========================================================= */}
              {currentTab === "profile" && (
                <div className="space-y-5 animate-fade-in text-left">
                  
                  {/* Bio summary */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1.5 bg-[#BBF7D0] text-[#1E3A8A] rounded-bl-sm text-[8px] font-mono leading-none">
                      ACTIVE MEMBER
                    </div>
                    
                    <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 text-3xl mx-auto flex items-center justify-center">
                      🕺
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[#1E3A8A]">{profile.nickname}</h3>
                      <p className="text-xs text-slate-400 font-mono">Style Profile Activated</p>
                    </div>

                    <div className="flex justify-center space-x-3 text-xs pt-1">
                      <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 font-bold">
                        성별: {profile.gender === "Male" ? "남성" : "여성"}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 font-bold">
                        스타일: {profile.styles.join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Reset account Option and info */}
                  <div className="p-4 rounded-xl bg-[#BBF7D0]/10 border border-[#BBF7D0]/20 space-y-1.5">
                    <p className="text-[11px] text-slate-600">가입하신 데이터는 로컬 저장소와 Google Gemini API를 피드삼아 고정밀 스타일링 매칭 가이드와 소통합니다.</p>
                    <button
                      onClick={() => {
                        if (confirm("초기 온보딩으로 되돌아가시겠습니까?")) {
                          setIsLoggedIn(false);
                          setProfile({ nickname: "", gender: "None", styles: [], onboarded: false, birthday: "" });
                        }
                      }}
                      className="text-[11px] font-bold text-red-500 hover:underline block"
                    >
                      온보딩 프로필 초기화하기
                    </button>
                  </div>

                </div>
              )}

            </main>

            {/* ----------------- Floating scroll-to-top ----------------- */}
            <div className="fixed bottom-20 right-5 z-40">
              <button
                id="btn-scroll-top"
                onClick={scrollAppToTop}
                className="w-11 h-11 rounded-full bg-white hover:bg-[#F3F4F6] border border-slate-200 text-[#1E3A8A] shadow-lg flex items-center justify-center transition active:scale-90 cursor-pointer touch-manipulation"
                title="페이지 맨 위로"
                aria-label="페이지 맨 위로 이동"
                type="button"
              >
                <ChevronRight className="w-5 h-5 -rotate-90 stroke-[3]" />
              </button>
            </div>

            {/* ----------------- Sticky Bottom Navigation Dock Bar ----------------- */}
            <nav id="bottom-dock" className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex justify-around items-center px-4 shadow-xl z-30">
              <button 
                id="nav-home" 
                onClick={handleHomeNavigation}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === "home" ? "text-[#1E3A8A]" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">추천</span>
              </button>

              <button 
                id="nav-closet" 
                onClick={() => setCurrentTab("closet")}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === "closet" ? "text-[#1E3A8A]" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Layers className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">옷장</span>
              </button>

              <button 
                id="nav-feed" 
                onClick={() => setCurrentTab("feed")}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === "feed" ? "text-[#1E3A8A]" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Activity className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">피드</span>
              </button>
            </nav>

          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL & DIALOG PIPELINE CONTROLS */}
        {/* ========================================================= */}

        {/* 1. Gamyagi Chat Advisor Sliding Panel */}
        {gamyagiChatOpen && (
          <div id="panel-gamyagi-chat" className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs flex flex-col justify-end z-[30] animate-fade-in">
            <div className="bg-white rounded-t-[32px] h-[550px] flex flex-col overflow-hidden shadow-2xl relative">
              
              {/* Chat head */}
              <div className="bg-[#1E3A8A] text-white p-5 flex items-center justify-between pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">감각이 와의 1:1 스타일 조화 톡</h3>
                    <p className="text-[10px] text-emerald-300 font-mono">Active Chat Consultant</p>
                  </div>
                </div>

                <button 
                  onClick={() => setGamyagiChatOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages scroll pane */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
                {chatMessages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-start space-x-2 ${m.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    {m.sender === "gamyagi" && (
                      <span className="text-lg p-1 bg-white border rounded-lg">🤖</span>
                    )}
                    <div className={`text-xs p-3 rounded-2xl max-w-[75%] leading-relaxed ${
                      m.sender === "user" 
                        ? "bg-[#1E3A8A] text-white rounded-tr-none" 
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-3xs"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatSending && (
                  <div className="flex items-start space-x-2">
                    <span className="text-lg p-1 bg-white border rounded-lg">🤖</span>
                    <div className="text-xs p-3 rounded-2xl rounded-tl-none bg-white text-[#1E3A8A] font-semibold flex items-center space-x-2 border border-slate-100">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                      <span className="animate-bounce [animation-delay:0.4s]">●</span>
                      <span>감각이가 타이핑하고 있어요...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input section */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="예: 내 어깨골격 70에 아노락 핏이 어울릴지 물어보기"
                  value={pendingMsg}
                  onChange={(e) => setPendingMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatToMD();
                  }}
                  className="flex-1 h-11 px-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 focus:border-[#1E3A8A] focus:bg-white text-xs rounded-xl outline-hidden transition"
                />
                <button
                  onClick={handleSendChatToMD}
                  disabled={!pendingMsg.trim() || chatSending}
                  className="h-11 px-4 rounded-xl bg-[#BBF7D0] hover:bg-[#aef1c6] disabled:bg-slate-100 disabled:text-slate-400 text-[#1E3A8A] font-bold text-xs transition cursor-pointer"
                >
                  전송
                </button>
              </div>

            </div>
          </div>
        )}

        <GarmentRegisterMethodModal
          open={isMethodSelectOpen}
          onClose={closeGarmentRegisterMethod}
          onSelectReceipt={() => selectRegisterMethod("receipt")}
          onSelectPhoto={() => {
            closeGarmentRegisterMethod();
            setUploadType("garment");
            setIsPhotoRegisterOpen(true);
          }}
        />

        {/* 구매내역 기반 등록 파이프라인 (방식 선택 후) */}
        {isUploadModalOpen && uploadType === "receipt" && (
          <div id="modal-upload-pipeline" className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[40] animate-fade-in p-4">
            <div className="w-full max-w-xl bg-white rounded-[28px] min-h-[720px] max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
                <div className="space-y-0 text-left leading-tight">
                  <h3 className="text-lg font-bold text-[#1E3A8A]">구매내역 기반 등록</h3>
                  <p className="text-sm text-slate-400 mt-1">구매내역을 분석해 옷장에 보유 옷으로 저장합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setAnalyzedDraft(null);
                    setSelectedLocalImg(null);
                    setUploadType(null);
                  }}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-7 py-4">
              {/* Processing Loader Animation */}
              {isAnalyzing && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#1E3A8A] animate-spin"></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xl">👕</span>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-[#1E3A8A] animate-pulse">AI is analyzing your garment characteristics...</p>
                    <p className="text-[10px] text-slate-400 font-mono">Calculating musculoskeletal tension coefficient tags</p>
                  </div>
                  <button
                    id="btn-register-back-analyzing"
                    type="button"
                    onClick={backToRegisterMethodSelect}
                    className="w-full h-10 mt-4 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                  >
                    뒤로가기 · 등록 방식 다시 선택
                  </button>
                </div>
              )}

              {/* Analyzed Result Form and editing area */}
              {!isAnalyzing && analyzedDraft && (
                <div className="space-y-4 text-left pb-2">
                  
                  {/* Image render */}
                  <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 border overflow-hidden flex-shrink-0">
                      {analyzedDraft.imageBase64 && (
                        <img 
                          src={analyzedDraft.imageBase64} 
                          alt="Analyzed clothing mockup" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] bg-[#BBF7D0] text-[#1E3A8A] font-extrabold px-2 py-0.5 rounded-full">
                        GEMINI EXTRACTION COMPLETE
                      </span>
                      <h4 className="text-xs font-black text-slate-700 mt-1 line-clamp-1">{analyzedDraft.name}</h4>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">인체 상단(Top) 입체 텐션 이음 결합 감지</p>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl space-y-1.5 border border-indigo-100">
                    <div className="flex items-center space-x-1.5 text-xs text-indigo-900 font-semibold">
                      <Info className="w-3.5 h-3.5" />
                      <span>추출 결과 및 태그 에디터</span>
                    </div>
                    <p className="text-[10px] text-indigo-700/80">AI가 아래와 같이 의상을 분석했습니다. 원하시는 카테고리나 정보를 선택/수정할 수 있습니다.</p>
                  </div>

                  {/* Form input fields */}
                  <div className="space-y-3.5">
                    {/* Item Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">의상명</label>
                      <input
                        type="text"
                        value={analyzedDraft.name}
                        onChange={(e) => setAnalyzedDraft({ ...analyzedDraft, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:border-[#1E3A8A] outline-hidden"
                      />
                    </div>

                    {/* Category Selector Pill buttons */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">카테고리</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Top", "Bottom", "Outer", "Shoes"].map((cValue) => {
                          const active = analyzedDraft.category === cValue;
                          return (
                            <button
                              key={cValue}
                              onClick={() => setAnalyzedDraft({ ...analyzedDraft, category: cValue as any })}
                              className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                                active 
                                  ? "bg-[#1E3A8A] text-white border-transparent"
                                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {cValue}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Color */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">정밀 칼라</label>
                        <input
                          type="text"
                          value={analyzedDraft.color}
                          onChange={(e) => setAnalyzedDraft({ ...analyzedDraft, color: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                        />
                      </div>

                      {/* Style */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">대표 스타일무드</label>
                        <select
                          value={analyzedDraft.style}
                          onChange={(e) => setAnalyzedDraft({ ...analyzedDraft, style: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                        >
                          <option value="Minimal">Minimal</option>
                          <option value="Casual">Casual</option>
                          <option value="Street">Street</option>
                          <option value="Amekaji">Amekaji</option>
                          <option value="Gorpcore">Gorpcore</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Fit Type */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">착용 실루엣</label>
                        <input
                          type="text"
                          value={analyzedDraft.fitType}
                          onChange={(e) => setAnalyzedDraft({ ...analyzedDraft, fitType: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                        />
                      </div>

                      {/* Material */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 block">소재 물성 정보</label>
                        <input
                          type="text"
                          value={analyzedDraft.fabricMaterial}
                          onChange={(e) => setAnalyzedDraft({ ...analyzedDraft, fabricMaterial: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physics Specs preview block */}
                  <div className="p-3.5 bg-slate-100 rounded-xl space-y-2 border border-slate-200/60 text-xs font-mono">
                    <span className="text-slate-600 block text-[10px] font-bold">AUTOMATED ANATOMY SOLVER PROFILE:</span>
                    <div className="text-[10px] space-y-1 leading-normal text-slate-500 font-sans">
                      <div>• Shoulder Draping Gravity Conformance: <strong className="text-slate-800">{analyzedDraft.anatomicalFitGuide?.shoulderPrecision || 92}%</strong></div>
                      <div>• Chest Stretch snugs: <strong className="text-slate-800">{analyzedDraft.anatomicalFitGuide?.chestTightness || 45}% comfort</strong></div>
                      <div>• Recommended Body: <strong className="text-slate-800">{analyzedDraft.anatomicalFitGuide?.recommendedBodyType || "세미 오버 에센셜"}</strong></div>
                    </div>
                  </div>

                  {/* Final Save button */}
                  <button
                    id="btn-save-garment"
                    onClick={handleSaveToCloset}
                    className="w-full h-11 bg-[#1E3A8A] text-[#BBF7D0] hover:bg-[#1E3A8A]/95 rounded-xl font-bold text-xs tracking-wider transition shadow-sm cursor-pointer"
                  >
                    Save to My Closet (옷장에 저장하기)
                  </button>
                  <button
                    id="btn-register-back"
                    type="button"
                    onClick={backToRegisterMethodSelect}
                    className="w-full h-10 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-xl text-sm font-bold transition"
                  >
                    뒤로가기 · 등록 방식 다시 선택
                  </button>

                </div>
              )}
              </div>

            </div>
          </div>
        )}

        <PhotoGarmentRegisterModal
          open={isPhotoRegisterOpen}
          userId={authUserId}
          onClose={() => {
            setIsPhotoRegisterOpen(false);
            setUploadType(null);
          }}
          onBackToMethodSelect={() => {
            setIsPhotoRegisterOpen(false);
            setUploadType(null);
            openGarmentRegister();
          }}
          onSaved={(garment) => {
            setClothes((prev) => [garment, ...prev]);
            setSelectedGarment(garment);
            setCurrentTab("closet");
          }}
        />

      </div>
    );
  }
