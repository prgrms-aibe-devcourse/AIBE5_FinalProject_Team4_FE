/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Home, 
  Camera, 
  X, 
  ChevronRight,
  Activity, 
  FileText, 
  Info, 
  Layers,
  Sparkle
} from "./components/icons";
import { UserProfile, Garment, Recommendation } from "@/types/index";
import HomeTab from "./components/HomeTab";
import ProfileEditTab from "./components/ProfileEditTab";
import ClosetTab from "./components/ClosetTab";
import LoginPage from "@/pages/LoginPage";

// 기존 상수 data ( TRIGGER_PRODUCTS 는 사용을 하지않아 우선 주석처리함 )
// import { TRIGGER_PRODUCTS } from "@/data/triggerProducts";
import { INITIAL_GARMENTS } from "@/data/initialGarments";

export default function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // User Profile Setup State
  const [profile, setProfile] = useState<UserProfile>({
    nickname: "",
    gender: "None",
    styles: [],
    onboarded: false,
    birthday: "",
  });

  // Navigation state: 'home' | 'closet' | 'feed' | 'profile'
  const [currentTab, setCurrentTab] = useState<"home" | "closet" | "feed" | "profile">("home");
  const [insightGlow, setInsightGlow] = useState<boolean>(false);
  const [homeResetSignal, setHomeResetSignal] = useState<number>(0);
  
  // Clothes dynamic management
  const [clothes, setClothes] = useState<Garment[]>(INITIAL_GARMENTS);
  
  // Closet active filters
  const [closetTab, setClosetTab] = useState<"owned" | "wishlist">("owned");
  const [closetFilter, setClosetFilter] = useState<string>("All");

  // Selection for active garment inspection
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(INITIAL_GARMENTS[0]);

  // AI Curation items loaded from Gemini backend on Home Screen
  const [aiCuration, setAiCuration] = useState<{
    comment: string;
    items: Recommendation[];
    loading: boolean;
  }>({
    comment: "감각이가 맞춤 도우미 정보를 구성 중입니다...",
    items: [],
    loading: false
  });

  // Chat panel with dynamic Gamyagi bot state
  const [gamyagiChatOpen, setGamyagiChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "gamyagi"; text: string }>>([
    {
      sender: "gamyagi",
      text: "삐리빅-! 반가워요! 당신의 스타일 선호도와 감성에 어울리는 최적의 의류 조화를 제안하는 AI 패션 매칭 로봇 '감각이' 입니다 🤖💚. 천편일률적 추천 대신, 소장하신 옷들에 어우러지는 단 하나의 매치 스타일 솔루션을 머신 가이드해 드릴게요!"
    }
  ]);
  const [pendingMsg, setPendingMsg] = useState<string>("");
  const [chatSending, setChatSending] = useState<boolean>(false);

  // New Clothing Registration Modal flow items
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<"receipt" | "garment" | null>(null);
  
  // Clothing analysis loader state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedDraft, setAnalyzedDraft] = useState<{
    id: string;
    name: string;
    category: "Top" | "Bottom" | "Outer" | "Shoes";
    color: string;
    style: string;
    fitType: string;
    fabricMaterial: string;
    anatomicalFitGuide?: any;
    imageBase64?: string;
  } | null>(null);

  // Upload placeholder trigger state
  const [selectedLocalImg, setSelectedLocalImg] = useState<string | null>(null);

  // Active Simulated values
  const [activeComfortScore, setActiveComfortScore] = useState<number>(95);
  const [activeTensionDensity, setActiveTensionDensity] = useState<string>("정교한 평행 흐름");

  // Web application dynamic curation triggers and style preferences editing
  const [activeCurationTrigger, setActiveCurationTrigger] = useState<string>("Casual");
  const [isTriggerLoading, setIsTriggerLoading] = useState<boolean>(false);
  
  // Local Style Editing states for Profile customization screen
  const [styleUpdateSuccess, setStyleUpdateSuccess] = useState<boolean>(false);
  const [editedNickname, setEditedNickname] = useState<string>("");
  const [editedGender, setEditedGender] = useState<"Male" | "Female" | "None">("None");
  const [editedStyles, setEditedStyles] = useState<string[]>([]);
  const [editedFitPreference, setEditedFitPreference] = useState<string>("루즈 와이드핏");
  const [editedColorPalette, setEditedColorPalette] = useState<string>("차분한 웜톤");

  // Keep edited profile states in sync upon onboarding completions
  useEffect(() => {
    if (profile.onboarded) {
      setEditedNickname(profile.nickname);
      setEditedGender(profile.gender);
      setEditedStyles(profile.styles);
    }
  }, [profile.onboarded, profile.nickname, profile.gender, profile.styles]);

  // Load Initial recommendations from AI server on setup done
  useEffect(() => {
    if (isLoggedIn && profile.onboarded) {
      fetchAiRecommendations();
    }
  }, [isLoggedIn, profile.onboarded]);

  const fetchAiRecommendations = async () => {
    setAiCuration((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: profile.nickname,
          gender: profile.gender,
          styles: profile.styles,
          weatherCondition: "Seoul: 🌧️ Chilly & Rain today. Keep stylish wraps!"
        })
      });
      const data = await response.json();
      if (data) {
        setAiCuration({
          comment: data.gamyagiComment || "비오는 우울한 날일수록 테크니컬한 레이어드가 필수죠!",
          items: data.recommendations || [],
          loading: false
        });
      }
    } catch (err) {
      console.error("Failed to load Dynamic recommend curation:", err);
      // fallback
      setAiCuration({
        comment: "삐리빅! 네트워크가 고요하지만 제가 준비한 기상대 픽 감각 레이블을 제안합니다! 따뜻한 울 자켓과 와이드 실루엣으로 유니크한 감성을 극대화하세요.",
        items: [
          {
            id: "rec1",
            name: "테크니컬 레이어드 방수 쉘 재킷",
            category: "Outer",
            color: "Matt Black",
            matchRate: 98,
            imageName: "outer_jacket",
            styleTag: "Gorpcore",
            price: "128,000"
          },
          {
            id: "rec2",
            name: "아나토믹 드레이프 루즈 와이드 데님",
            category: "Bottom",
            color: "인디고 블루",
            matchRate: 95,
            imageName: "bottom_jeans",
            styleTag: "Casual",
            price: "69,000"
          },
          {
            id: "rec3",
            name: "고정밀 크루넥 입체 코튼 티셔츠",
            category: "Top",
            color: "화이트",
            matchRate: 88,
            imageName: "top_tee",
            styleTag: "Minimal",
            price: "39,000"
          }
        ],
        loading: false
      });
    }
  };

  // Full-featured style customization saver for the profile edit menu
  const handleSaveStylePreferences = async (
    updatedNickname: string,
    updatedGender: "Male" | "Female" | "None",
    updatedStyles: string[],
    updatedFit: string,
    updatedColor: string
  ) => {
    // Save to global profile state
    setProfile((prev) => ({
      ...prev,
      nickname: updatedNickname,
      gender: updatedGender,
      styles: updatedStyles,
    }));
    setEditedFitPreference(updatedFit);
    setEditedColorPalette(updatedColor);
    
    // Trigger successful calibration toast
    setStyleUpdateSuccess(true);
    setTimeout(() => {
      setStyleUpdateSuccess(false);
    }, 4500);

    // Re-fetch AI recommend curations aligned with the updated stylistic profile
    setAiCuration((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: updatedNickname,
          gender: updatedGender,
          styles: updatedStyles,
          weatherCondition: `Calibrated with preference: ${updatedStyles.join(", ")}, Fit: ${updatedFit}, Colors: ${updatedColor}`
        })
      });
      const data = await response.json();
      if (data) {
        setAiCuration({
          comment: data.gamyagiComment || `새롭게 스타일 설정을 변경하신 것을 환영합니다! 당신에게 딱 어울리는 의류를 추천해 드려요!`,
          items: data.recommendations || [],
          loading: false
        });
      }
    } catch (err) {
      console.error("AI Curation re-fetch failed:", err);
      setAiCuration((prev) => ({ ...prev, loading: false }));
    }
  };

  // Profile Setup validation helper
  const handleCompleteOnboarding = () => {
    if (!profile.nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    if (profile.gender === "None") {
      alert("성별을 선택해 주세요.");
      return;
    }
    if (profile.styles.length === 0) {
      alert("스타일 선호도를 하나 이상 선호해 주세요.");
      return;
    }

    setProfile((prev) => ({ ...prev, onboarded: true }));
  };

  // Toggle Styles favorite chips
  const handleGenreToggle = (styleName: string) => {
    setProfile((prev) => {
      const isSelected = prev.styles.includes(styleName);
      const newStyles = isSelected 
        ? prev.styles.filter((s) => s !== styleName)
        : [...prev.styles, styleName];
      return { ...prev, styles: newStyles };
    });
  };

  // Chat with Gamyagi API handler
  const handleSendChatToMD = async () => {
    if (!pendingMsg.trim() || chatSending) return;
    const currentMsg = pendingMsg;
    setPendingMsg("");
    setChatMessages((prev) => [...prev, { sender: "user", text: currentMsg }]);
    setChatSending(true);

    try {
      const response = await fetch("/api/chat-gamyagi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMsg,
          history: chatMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          }))
        })
      });
      const data = await response.json();
      if (data && data.reply) {
        setChatMessages((prev) => [...prev, { sender: "gamyagi", text: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: "gamyagi", text: "삐리빅! 무슨 말씀인지 다시 들려주실래요?" }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [...prev, { sender: "gamyagi", text: "친숙한 신호 강도 감지 실패! 감각 지능으로 응답드릴게요. 해당 핏의 어깨 곡선 비율은 쇄골과 대항하며 조화를 이루는 고정밀 핏감을 보장합니다!" }]);
    } finally {
      setChatSending(false);
    }
  };

  // Simulate file drops & camera simulation
  const triggerImageUpload = async (mockType: "receipt" | "garment_tee") => {
    setIsAnalyzing(true);
    const sampleImg =
      mockType === "receipt"
        ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600"
        : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600";

    setSelectedLocalImg(sampleImg);

    try {
      const response = await fetch("/api/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: "dummy_base64_for_gemini_vision",
          isReceipt: mockType === "receipt"
        })
      });
      const data = await response.json();
      setAnalyzedDraft({
        id: "draft_" + Date.now(),
        name: mockType === "receipt" ? "영수증 추출 명세 아이템" : "카메라 캡처 베이직 반소매 티셔츠",
        category: data.category || "Top",
        color: data.color || "Pure White",
        style: data.style || "Minimal",
        fitType: data.fitType || "Semi-Oversized",
        fabricMaterial: data.fabricMaterial || "코튼 100%",
        anatomicalFitGuide: data.anatomicalFitGuide || {},
        imageBase64: sampleImg
      });
    } catch (e) {
      console.error(e);
      // Fallback
      setAnalyzedDraft({
        id: "draft_" + Date.now(),
        name: mockType === "receipt" ? "영수증 추출 명세 아이템" : "카메라 캡처 베이직 반소매 티셔츠",
        category: "Top",
        color: "Pure White",
        style: "Minimal",
        fitType: "Semi-Oversized",
        fabricMaterial: "헤비 웨이트 프렌치 테리 코튼 100%",
        imageBase64: sampleImg,
        anatomicalFitGuide: {
          shoulderPrecision: 94,
          chestTightness: 45,
          muscularStressLevel: "어깨 세모근 곡선에 여유로운 오버핏 실루엣 제공",
          skeletonDrapeFactor: "칼라뼈(Clavicle) 돌출도에 적합하도록 고안된 라운드넥 구조",
          recommendedBodyType: "어깨너비가 넓거나 가스근육이 발달한 장사 체형"
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddWishlistItem = (item: { name: string; category: "Top" | "Bottom" | "Outer" | "Shoes"; color: string; style: string; fabricMaterial: string }) => {
    const newGarment: Garment = {
      id: "wish_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: item.name,
      category: item.category,
      color: item.color,
      style: item.style,
      fitType: "Standard Silhouette",
      fabricMaterial: item.fabricMaterial,
      thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
      isFavorite: false,
      isWishlist: true
    };
    setClothes((prev) => [newGarment, ...prev]);
  };

  const filteredClothes = clothes.filter((item) => {
    const matchesTab = closetTab === "owned" ? !item.isWishlist : !!item.isWishlist;
    if (!matchesTab) return false;

    if (closetFilter === "All") return true;
    return item.category === closetFilter;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClothes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const moveToOwnedCloset = (id: string) => {
    setClothes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isWishlist: false } : c))
    );
  };

  const handleSaveToCloset = () => {
    if (!analyzedDraft) return;

    const newGarment: Garment = {
      id: analyzedDraft.id || "g_" + Date.now(),
      name: analyzedDraft.name,
      category: analyzedDraft.category,
      color: analyzedDraft.color,
      style: analyzedDraft.style,
      fitType: analyzedDraft.fitType,
      fabricMaterial: analyzedDraft.fabricMaterial,
      thumbnailUrl: analyzedDraft.imageBase64 || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
      isFavorite: false,
      isWishlist: false,
      anatomicalFit: analyzedDraft.anatomicalFitGuide
    };

    setClothes((prev) => [newGarment, ...prev]);
    setSelectedGarment(newGarment);
    setAnalyzedDraft(null);
    setUploadType(null);
    setIsUploadModalOpen(false);
    setSelectedLocalImg(null);
    alert(`🎉 "${newGarment.name}" 의상을 옷장에 신규 등록 완료 하였습니다!`);
  };

  const openUploadModal = () => {
    setUploadType(null);
    setIsUploadModalOpen(true);
  };

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
    setInsightGlow(false);
    setHomeResetSignal((signal) => signal + 1);
    window.setTimeout(scrollAppToTop, 0);
  };

  return (
    <div id="root-container" className="min-h-screen bg-[#F1F5F9] font-sans antialiased text-slate-800 flex flex-col justify-between py-4 px-3 md:py-6 md:px-6 font-sans">
      
      {/* ========================================================= */}
      {/* 1. AUTH / LOGIN FLOW MODAL VIEW */}
      {/* ========================================================= */}
      {!isLoggedIn && <LoginPage onLogin={() => setIsLoggedIn(true)} />}

      {/* ========================================================= */}
      {/* 2. ONBOARDING PROFILE FLOWS */}
      {/* ========================================================= */}
      {isLoggedIn && !profile.onboarded && (
        <div className="flex-1 flex items-center justify-center py-12 animate-fade-in font-sans">
          <div id="view-onboarding" className="w-full max-w-lg bg-white border border-slate-200/60 rounded-[28px] shadow-2xl p-8 relative flex flex-col justify-between min-h-[580px]">
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0284C7] bg-[#BBF7D0] px-3 py-1 rounded-full text-[10px]">스타일 프로필 생성</span>
                <span className="text-slate-400 font-mono font-bold">STEP 1 of 1</span>
              </div>
              <div className="space-y-1 text-left font-sans">
                <h2 className="text-xl font-extrabold text-[#0284C7]">닉네임, 성별, 스타일을 선택하세요</h2>
                <p className="text-xs text-slate-400">선택한 성향 및 선호 스타일에 어울리는 가상 옷장과 피드가 개설됩니다.</p>
              </div>

              <div className="space-y-4 pt-2 text-left font-sans">
                {/* 1. Nickname */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">닉네임 설정</label>
                  <input
                    id="input-nickname"
                    type="text"
                    placeholder="예: 트렌디패턴러"
                    value={profile.nickname}
                    onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                    className="w-full h-11.5 px-4 rounded-xl border border-slate-200 focus:border-[#1E3A8A] bg-white text-xs outline-hidden transition"
                  />
                </div>

                {/* 2. Gender Preference */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">성별 경향성</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-gender-male"
                      onClick={() => setProfile({ ...profile, gender: "Male" })}
                      className={`h-11 rounded-xl font-semibold text-xs border transition flex items-center justify-center space-x-2 cursor-pointer ${
                        profile.gender === "Male"
                          ? "bg-[#1E3A8A] text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>남성 (Male)</span>
                    </button>
                    <button
                      id="btn-gender-female"
                      onClick={() => setProfile({ ...profile, gender: "Female" })}
                      className={`h-11 rounded-xl font-semibold text-xs border transition flex items-center justify-center space-x-2 cursor-pointer ${
                        profile.gender === "Female"
                          ? "bg-[#1E3A8A] text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>여성 (Female)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Style Preferences */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">스타일 선호도 (중복 선택)</label>
                  <div className="flex flex-wrap gap-2">
                    {["Casual", "Minimal", "Street", "Amekaji", "Gorpcore"].map((styleOpt) => {
                      const isSelected = profile.styles.includes(styleOpt);
                      return (
                        <button
                          key={styleOpt}
                          onClick={() => handleGenreToggle(styleOpt)}
                          className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0] shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {styleOpt === "Casual" && "캐주얼 (Casual)"}
                          {styleOpt === "Minimal" && "미니멀 (Minimal)"}
                          {styleOpt === "Street" && "스트리트 (Street)"}
                          {styleOpt === "Amekaji" && "아메카지 (Amekaji)"}
                          {styleOpt === "Gorpcore" && "고프코어 (Gorpcore)"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom sticky fixed styling button */}
            <button
              id="btn-complete-onboarding"
              onClick={handleCompleteOnboarding}
              className="w-full h-12 rounded-xl bg-[#BBF7D0] hover:bg-[#a9f0c2] text-[#1E3A8A] font-bold text-sm tracking-wide transition shadow-sm active:scale-98 flex items-center justify-center space-x-1.5 mt-6 cursor-pointer"
            >
              <span>입장해서 코디 놀이터 시작</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
                  insightGlow={insightGlow}
                  resetSignal={homeResetSignal}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 2: MY CLOSET (Smart Closet view & Anatomical Fit Guide) */}
              {/* ========================================================= */}
              {currentTab === "closet" && (
                <ClosetTab
                  clothes={clothes}
                  setClothes={setClothes}
                  selectedGarment={selectedGarment}
                  setSelectedGarment={setSelectedGarment}
                  toggleFavorite={toggleFavorite}
                  moveToOwnedCloset={moveToOwnedCloset}
                />
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

            {/* ----------------- Floating Button '+' (Registration Choice Modal Entry Trigger) ----------------- */}
            <div className="fixed bottom-20 right-5 z-40 flex flex-col items-center gap-2">
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
              <button
                id="btn-upload-trigger"
                onClick={openUploadModal}
                className="w-12 h-12 rounded-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-[#BBF7D0] shadow-lg flex items-center justify-center active:scale-95 cursor-pointer touch-manipulation"
                title="의료 사진 분석 및 영수증 등록"
                type="button"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
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

        {/* 2. Registration Entry Modal (Choice between Receipt Capture or Cameray Photo) */}
        {isUploadModalOpen && (
          <div id="modal-upload-pipeline" className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end z-[40] animate-fade-in">
            <div className="bg-white rounded-t-[32px] max-h-[80%] flex flex-col overflow-hidden shadow-2xl relative p-6 space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-base font-bold text-[#1E3A8A]">새 의류 등록 파이프라인</h3>
                  <p className="text-xs text-slate-400">쇼핑 영수증 정보나 실물 이미지를 분석해 정밀 데일리 코디 가이드 및 디지털 옷장에 통합합니다.</p>
                </div>
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setAnalyzedDraft(null);
                    setSelectedLocalImg(null);
                    setUploadType(null);
                  }}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload selections (if no mock uploaded yet) */}
              {!uploadType && !analyzedDraft && !isAnalyzing && (
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Choice 1: Purchase receipt capture screen */}
                  <button
                    id="option-upload-receipt"
                    onClick={() => {
                      setUploadType("receipt");
                      triggerImageUpload("receipt");
                    }}
                    className="p-5 bg-slate-50/70 hover:bg-[#BBF7D0]/20 rounded-2xl border border-slate-100 hover:border-[#BBF7D0]/60 text-left space-y-3.5 transition group active:scale-98 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-white text-[#1E3A8A] w-max shadow-3xs group-hover:bg-white">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800">쇼핑 캡처 / 영수증 올리기</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">구매하신 옷 정보, 쇼핑몰 가구 캡쳐 등의 텍스트 특징점을 Gemini로 추출해냅니다.</p>
                    </div>
                  </button>

                  {/* Choice 2: Direct Garment photo upload */}
                  <button
                    id="option-upload-direct"
                    onClick={() => {
                      setUploadType("garment");
                      triggerImageUpload("garment_tee");
                    }}
                    className="p-5 bg-slate-50/70 hover:bg-[#BBF7D0]/20 rounded-2xl border border-dashed border-slate-200/80 hover:border-[#BBF7D0]/60 text-left space-y-3.5 transition group active:scale-98 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl bg-white text-[#1E3A8A] w-max shadow-3xs group-hover:bg-white">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800">의류 직접 촬영등록</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">실물 티셔츠나 아우터를 수동 촬영해 고해상 스마트 코디 매칭 가이드를 즉석 생성합니다.</p>
                    </div>
                  </button>

                </div>
              )}

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
                </div>
              )}

              {/* Analyzed Result Form and editing area */}
              {!isAnalyzing && analyzedDraft && (
                <div className="space-y-4 text-left overflow-y-auto max-h-[460px] pb-4">
                  
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

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    );
  }
