/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import api from "@/api/index";
import { useState, useEffect } from "react";
import { 
  Home, 
  X, 
  ChevronRight,
  Activity, 
  Layers,
} from "./components/icons";
import { UserProfile } from "@/types/index";
import { REGIONS } from "@/data/regions";
import HomeTab from "./components/HomeTab";
import ClosetTab from "./components/ClosetTab";
import GarmentRegisterMethodModal from "./components/GarmentRegisterMethodModal";
import PhotoGarmentRegisterModal from "./components/PhotoGarmentRegisterModal";
import PurchaseGarmentRegisterModal from "./components/PurchaseGarmentRegisterModal";
import {
  redirectToOAuthLogin,
  type OAuthProvider,
} from "@/utils/authLogin";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useChat } from "@/hooks/useChat";
import { useCloset } from "@/hooks/useCloset";
import { useWardrobeLoader } from "@/hooks/useWardrobeLoader";
import {
  clearUserProfile,
  loadUserProfile,
  saveUserProfile,
} from "@/utils/userProfileStorage";
import { updateMarketingConsent } from "@/api/marketingConsent";
import { resolveGarmentStyleCode } from "@/data/garmentStyles";
import MarketingConsentSetting from "@/components/legal/MarketingConsentSetting";
// 기존 상수 data ( TRIGGER_PRODUCTS 는 사용을 하지않아 우선 주석처리함 )
// import { TRIGGER_PRODUCTS } from "@/data/triggerProducts";

export default function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<"closet" | "profile" | null>(null);

  // 비로그인 상태면 모달을 열고 false를 반환, 로그인 상태면 true를 반환
  const requireLogin = (destination?: "closet" | "profile"): boolean => {
    if(!isLoggedIn){
      if(destination) setPendingTab(destination);
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  }
  /** 쿠키 기반 인증 확인 완료 여부 */
  const [authReady, setAuthReady] = useState(false);
  
  // User Profile Setup State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = loadUserProfile();
    return (
      stored ?? {
        nickname: "",
        gender: "None",
        styles: [],
        onboarded: false,
        birthday: "",
      }
    );
  });

  const persistProfile = (next: UserProfile) => {
    setProfile(next);
    if (next.onboarded) {
      saveUserProfile(next);
    }
  };

  const { gamyagiChatOpen, setGamyagiChatOpen, chatMessages, pendingMsg, setPendingMsg, chatSending, handleSendChatToMD } = useChat();

  // 옷장
  const {
    clothes, setClothes,
    selectedGarment, setSelectedGarment,
    isMethodSelectOpen,
    handleAddWishlistItem,
    toggleFavorite,
    moveToOwnedCloset,
    openGarmentRegister,
    closeGarmentRegisterMethod,
  } = useCloset();

  const { wardrobeLoading, refreshWardrobe } = useWardrobeLoader({
    userId: authUserId,
    enabled: authReady && authUserId != null && profile.onboarded,
    selectedGarment,
    setClothes,
    setSelectedGarment,
  });

  // Navigation state: 'home' | 'closet' | 'feed' | 'profile'
  const [currentTab, setCurrentTab] = useState<"home" | "closet" | "feed" | "profile">("home");
  const [homeResetSignal, setHomeResetSignal] = useState<number>(0);
  const [isPhotoRegisterOpen, setIsPhotoRegisterOpen] = useState(false);
  const [isPurchaseRegisterOpen, setIsPurchaseRegisterOpen] = useState(false);

  // 앱 시작 시 쿠키인증 상태 확인
  useEffect(() => {
    api.get('/api/v1/users/profile')
        .then((res) => {
          const userId = res.data.data.userId;
          const nickname = res.data.data.nickname;
          const onboarded = res.data.data.onboarded;

          if(onboarded){
            // 온보딩 완료 유저: nickname + onboarded: true
            setProfile(prev => ({ ...prev, nickname, onboarded: true }));
          } else if(nickname){
            // 온보딩 미완료지만 OAuth 닉네임 존재: 기본값으로만 활용
            setProfile(prev => ({ ...prev, nickname, onboarded: false }));
          }
          setAuthUserId(userId);
          setIsLoggedIn(true);
          setAuthReady(true);
        })
        .catch(() => {
          setIsLoggedIn(false);
          setAuthReady(true);
        });
  }, []);


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
    redirectToOAuthLogin(platform);
  };

  const resetAuthState = () => {
    setIsLoggedIn(false);
    setAuthUserId(null);
    clearUserProfile();
    setProfile({ nickname: "", gender: "None", styles: [], onboarded: false, birthday: "" });
    setCurrentTab("home");
    setAuthReady(false);
  };

  const handleLogout = () => {
    api.post('/api/v1/auth/logout')
        .finally(() => resetAuthState());
  }

  return (
    <div id="root-container" className="min-h-screen bg-[#F1F5F9] font-sans antialiased text-slate-800 flex flex-col justify-between py-4 px-3 md:py-6 md:px-6 font-sans">
      
      {/* ========================================================= */}
      {/* 1. AUTH / LOGIN FLOW MODAL VIEW */}
      {/* ========================================================= */}
      {isLoginModalOpen && (<LoginPage isModal onClose={() => setIsLoginModalOpen(false)} onSocialLogin={handleSocialLogin} />)}

      {/* 2. ONBOARDING PROFILE FLOWS */}
      {/* ========================================================= */}
      {isLoggedIn && !profile.onboarded && (
          <OnboardingPage defaultNickname={profile.nickname} onComplete={async (nickname, birthday, gender, styles, region, openModal, marketingAgreed) => {
            try {
              const regionData = REGIONS.find(r => r.code === region);
              const patchRes = await api.patch('/api/v1/users/profile', {
                nickname,
                birthDate: birthday,
                gender: gender === 'Male' ? 'MALE' : 'FEMALE',
                regionName: regionData?.label ?? '',
                regionCode: region || '',
              });
              const serverOnboarded: boolean = patchRes.data.data.onboarded ?? true;
              await api.post('/api/v1/users/styles', { styleCodes: styles.map(resolveGarmentStyleCode) });
              if (authUserId != null) {
                try {
                  await updateMarketingConsent(authUserId, { marketingAgreed });
                } catch {
                  alert("마케팅 정보 수신 동의 저장에 실패했습니다. 마이페이지에서 다시 변경할 수 있습니다.");
                }
              }
              persistProfile({ nickname, birthday, gender, styles, region: region || undefined, onboarded: serverOnboarded });
              if (openModal) openGarmentRegister();
            } catch {
              alert('프로필 저장에 실패했어요. 다시 시도해주세요.');
            }
          }} />
      )}

        {/* ========================================================= */}
        {/* MAIN APPLICATION (Logged in & Onboarded) */}
        {/* ========================================================= */}
        {(!isLoggedIn || profile.onboarded) && (
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
                  onClick={() => {
                    if(!requireLogin("profile")) return;
                    setCurrentTab("profile")}}
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
                  userId={authUserId}
                  gender={profile.gender}
                  wardrobeLoading={wardrobeLoading}
                  onAddWishlistItem={handleAddWishlistItem}
                  nickname={profile.nickname}
                  resetSignal={homeResetSignal}
                  onRefreshWardrobe={() => void refreshWardrobe()}
                  onGoToCloset={() => setCurrentTab("closet")}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 2: MY CLOSET (Smart Closet view & Anatomical Fit Guide) */}
              {/* ========================================================= */}
              {currentTab === "closet" && !authReady && (
                  <div className="flex justify-center py-16 text-sm text-slate-500">
                    인증 확인 중…
                  </div>
              )}
              {currentTab === "closet" &&
                  authReady &&
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

                  <MarketingConsentSetting
                    userId={authUserId}
                    enabled={authReady && authUserId != null}
                  />

                  {/* Logout Button */}
                  <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>로그아웃</span>
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>

                  {/* Reset account Option and info */}
                  <div className="p-4 rounded-xl bg-[#BBF7D0]/10 border border-[#BBF7D0]/20 space-y-1.5">
                    <p className="text-[11px] text-slate-600"></p>
                    <button
                      onClick={() => {
                        if (confirm("초기 온보딩으로 되돌아가시겠습니까?")) {
                         resetAuthState();
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
            <div className="fixed bottom-36 right-5 z-40">
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
                onClick={() => {
                  if(!requireLogin("closet")) return;
                  setCurrentTab("closet")}}
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
          onSelectReceipt={() => {
            closeGarmentRegisterMethod();
            setIsPurchaseRegisterOpen(true);
          }}
          onSelectPhoto={() => {
            closeGarmentRegisterMethod();
            setIsPhotoRegisterOpen(true);
          }}
        />

        <PurchaseGarmentRegisterModal
          open={isPurchaseRegisterOpen}
          userId={authUserId}
          existingGarments={clothes}
          onClose={() => setIsPurchaseRegisterOpen(false)}
          onBackToMethodSelect={() => {
            setIsPurchaseRegisterOpen(false);
            openGarmentRegister();
          }}
          onSaved={(garment, options) => {
            setClothes((prev) => [garment, ...prev]);
            if (options?.finished !== false) {
              setSelectedGarment(garment);
              setCurrentTab("closet");
            }
          }}
        />

        <PhotoGarmentRegisterModal
          open={isPhotoRegisterOpen}
          userId={authUserId}
          existingGarments={clothes}
          onClose={() => setIsPhotoRegisterOpen(false)}
          onBackToMethodSelect={() => {
            setIsPhotoRegisterOpen(false);
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
