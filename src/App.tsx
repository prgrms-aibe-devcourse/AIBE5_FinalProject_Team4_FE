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
import { UserProfile, Garment, Recommendation } from "./types";
import HomeTab from "./components/HomeTab";
import ProfileEditTab from "./components/ProfileEditTab";
import ClosetTab from "./components/ClosetTab";
import {
  captureOAuthTokenFromUrl,
  getUserIdFromAccessToken,
} from "@/utils/authUser";
import { ensureDevToken, DEFAULT_DEV_USER_ID } from "@/utils/ensureDevToken";
import { redirectToOAuthLogin } from "@/utils/authLogin";

const MOCK_AI_CURATION: { comment: string; items: Recommendation[] } = {
  comment:
    "삐리빅! 네트워크가 고요하지만 제가 준비한 기상대 픽 감각 레이블을 제안합니다! 따뜻한 울 자켓과 와이드 실루엣으로 유니크한 감성을 극대화하세요.",
  items: [
    {
      id: "rec1",
      name: "테크니컬 레이어드 방수 쉘 재킷",
      category: "Outer",
      color: "Matt Black",
      matchRate: 98,
      imageName: "outer_jacket",
      styleTag: "Gorpcore",
      price: "128,000",
    },
    {
      id: "rec2",
      name: "아나토믹 드레이프 루즈 와이드 데님",
      category: "Bottom",
      color: "인디고 블루",
      matchRate: 95,
      imageName: "bottom_jeans",
      styleTag: "Casual",
      price: "69,000",
    },
    {
      id: "rec3",
      name: "고정밀 크루넥 입체 코튼 티셔츠",
      category: "Top",
      color: "화이트",
      matchRate: 88,
      imageName: "top_tee",
      styleTag: "Minimal",
      price: "39,000",
    },
  ],
};

// Static recommended product collections mapping beautifully for each recommendation button triggers
const TRIGGER_PRODUCTS: Record<string, any[]> = {
  Casual: [
    {
      id: "tr_cas1",
      name: "피그먼트 오버사이즈 쿨 코튼 맨투맨",
      category: "Top",
      color: "피그먼트 차콜",
      matchRate: 98,
      imageName: "top_tee",
      styleTag: "Casual",
      price: "49,000",
      notes: "대흉근 하단을 누르는 가벼운 세미 오버 드롭라인"
    },
    {
      id: "tr_cas2",
      name: "라이트 워시드 스트레이트 크롭 데님",
      category: "Bottom",
      color: "아이스 블루",
      matchRate: 94,
      imageName: "bottom_jeans",
      styleTag: "Casual",
      price: "58,000",
      notes: "대퇴사두근에 쓸림이 없는 여유로운 골반 둘레"
    },
    {
      id: "tr_cas3",
      name: "어반 데일리 컴포트 스웨이드 스니커즈",
      category: "Shoes",
      color: "크림 샌드",
      matchRate: 88,
      imageName: "shoes_sneakers",
      styleTag: "Casual",
      price: "72,000",
      notes: "아킬레스건 마찰을 상쇄하는 쿠션 패딩"
    }
  ],
  Minimal: [
    {
      id: "tr_min1",
      name: "시그니처 입체 크루넥 코튼 티셔츠",
      category: "Top",
      color: "수플레 벨벳 화이트",
      matchRate: 99,
      imageName: "top_tee",
      styleTag: "Minimal",
      price: "39,000",
      notes: "목 늘어남을 방지하는 실리콘 이음 테이핑"
    },
    {
      id: "tr_min2",
      name: "테일러드 플랫 플리츠 슬림 티드 슬랙스",
      category: "Bottom",
      color: "슬레이트 탄소 블랙",
      matchRate: 96,
      imageName: "bottom_jeans",
      styleTag: "Minimal",
      price: "69,000",
      notes: "무릎 슬개골 하단부터 부드럽게 좁아지는 입체 패턴"
    },
    {
      id: "tr_min3",
      name: "에센셜 버진 울 드레이프 블레이저 코트",
      category: "Outer",
      color: "미드나잇 누아르",
      matchRate: 91,
      imageName: "outer_jacket",
      styleTag: "Minimal",
      price: "189,000",
      notes: "쇄골 끝 견봉 부위에 하중을 고르게 배분하는 특수 패드"
    }
  ],
  Street: [
    {
      id: "tr_str1",
      name: "그래픽 프린티드 오버사이즈 피그먼트 후디",
      category: "Top",
      color: "블랭크 데미지 그레이",
      matchRate: 97,
      imageName: "top_tee",
      styleTag: "Street",
      price: "85,000",
      notes: "삼각근과 회선건개 가동 범위를 고려한 벌룬 슬리브"
    },
    {
      id: "tr_str2",
      name: "헤비 듀티 벌룬 와이드 데님 카고 팬츠",
      category: "Bottom",
      color: "딥 가먼트 워시드 인디고",
      matchRate: 95,
      imageName: "bottom_jeans",
      styleTag: "Street",
      price: "79,000",
      notes: "고관절 및 복직근 압박을 완벽 소멸한 고무 밴딩"
    },
    {
      id: "tr_str3",
      name: "볼륨 테크 플레이트 하이 폼 더블 슈즈",
      category: "Shoes",
      color: "매트 유광 블랙",
      matchRate: 92,
      imageName: "shoes_sneakers",
      styleTag: "Street",
      price: "135,000",
      notes: "족저근막 하방 피로도를 경감하는 특수 러버 아웃솔"
    }
  ],
  Amekaji: [
    {
      id: "tr_ame1",
      name: "헤리티지 마운틴 아노락 캠퍼 셔츠 자켓",
      category: "Outer",
      color: "비치 머스타드 샌드",
      matchRate: 95,
      imageName: "outer_jacket",
      styleTag: "Amekaji",
      price: "124,000",
      notes: "광배근 이음새 수축 하중을 분진 방지처리"
    },
    {
      id: "tr_ame2",
      name: "프리미엄 헤비 옥스포드 워크 인디고 셔츠",
      category: "Top",
      color: "빈티지 샴브레이 스카이",
      matchRate: 91,
      imageName: "top_tee",
      styleTag: "Amekaji",
      price: "56,000",
      notes: "경추 후방 피로도를 상쇄하는 넉넉한 넥 드롭 둘레"
    },
    {
      id: "tr_ame3",
      name: "더블 니 헤비 트윌 크롭 카키 팬츠",
      category: "Bottom",
      color: "아메리칸 빈티지 카키",
      matchRate: 89,
      imageName: "bottom_jeans",
      styleTag: "Amekaji",
      price: "89,000",
      notes: "허벅지 봉공근 라인의 활동 편의를 위한 덧댐 박음질"
    }
  ],
  Gorpcore: [
    {
      id: "tr_gop1",
      name: "테크니컬 방수 PTFE 3-Layer 미니멀 아노락",
      category: "Outer",
      color: "어반 세이지 카키",
      matchRate: 99,
      imageName: "outer_jacket",
      styleTag: "Gorpcore",
      price: "198,000",
      notes: "어깨 회전축 입체 보정이 반영되어 가동성 극대화"
    },
    {
      id: "tr_gop2",
      name: "나일론 패러슈트 테크 조거 기어 팬츠",
      category: "Bottom",
      color: "어반 피트 스톤 그레이",
      matchRate: 96,
      imageName: "bottom_jeans",
      styleTag: "Gorpcore",
      price: "115,000",
      notes: "오금막 주름 및 걸음 스트레스를 제거하는 테이핑 절개"
    },
    {
      id: "tr_gop3",
      name: "비브람 아웃솔 전방위 접지 트레일 트레커",
      category: "Shoes",
      color: "아노다이즈 머드 블랙",
      matchRate: 93,
      imageName: "shoes_sneakers",
      styleTag: "Gorpcore",
      price: "189,000",
      notes: "복사골 통증을 제어하는 인체 맞춤 오쏘라이트 폼 패드"
    }
  ],
  Rainy: [
    {
      id: "tr_rai1",
      name: "울트라 하드쉘 3레이어 패커블 레이니 코트",
      category: "Outer",
      color: "세미 매트 누아르",
      matchRate: 98,
      imageName: "outer_jacket",
      styleTag: "Gorpcore",
      price: "159,000",
      notes: "방수 멤브레인이 완벽 탑재되어 빗방울을 전방위 탄성 튕김"
    },
    {
      id: "tr_rai2",
      name: "발수 나일론 테크 조거 카고 쇼츠",
      category: "Bottom",
      color: "어스 카키 그레이",
      matchRate: 93,
      imageName: "bottom_jeans",
      styleTag: "Casual",
      price: "68,000",
      notes: "빗물이 튀어도 즉시 표면 건조되는 극강 나일론 테크"
    },
    {
      id: "tr_rai3",
      name: "고인장 접지방지 워터프루프 아웃솔 데크 슈즈",
      category: "Shoes",
      color: "매트 누아르",
      matchRate: 90,
      imageName: "shoes_sneakers",
      styleTag: "Gorpcore",
      price: "95,000",
      notes: "미끄러운 대리석 지면 노면 접지 계수를 78% 강화"
    }
  ],
  Special: [
    {
      id: "tr_sp1",
      name: "어반 미니멀 투 버튼 이브닝 피트 재킷",
      category: "Outer",
      color: "차분한 딥 네이비",
      matchRate: 97,
      imageName: "outer_jacket",
      styleTag: "Minimal",
      price: "168,000",
      notes: "어깨 하향 각도가 완만한 정중형 드레이핑 블레이저"
    },
    {
      id: "tr_sp2",
      name: "스위스 수입 코튼 슬림 릴랙스드 드레스 셔츠",
      category: "Top",
      color: "아이보리 퓨어 화이트",
      matchRate: 93,
      imageName: "top_tee",
      styleTag: "Minimal",
      price: "79,000",
      notes: "수축 복원력이 뛰어난 하이 카운트 패브릭"
    },
    {
      id: "tr_sp3",
      name: "스퀘어드 솔 클래식 레더 로퍼 드레스슈즈",
      category: "Shoes",
      color: "피아노 블랙",
      matchRate: 91,
      imageName: "shoes_sneakers",
      styleTag: "Minimal",
      price: "198,000",
      notes: "발볼 압박 강도를 32% 경감한 부드러운 가죽 전사피"
    }
  ]
};

// Default starting garments with precise anatomical properties initialized
const INITIAL_GARMENTS: Garment[] = [
  {
    id: "g1",
    name: "고정밀 크루넥 입체 코튼 티셔츠",
    category: "Top",
    color: "수플레 화이트",
    style: "Minimal",
    fitType: "세미 오버핏",
    fabricMaterial: "헤비 쥬리 코튼 100% (450g/y)",
    isFavorite: true,
    isWishlist: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
    anatomicalFit: {
      shoulderPrecision: 96,
      chestTightness: 42,
      muscularStressLevel: "대흉근(Pectoralis Major) 상단을 가볍게 스치듯 떨어지며, 겨드랑이 밑 광배근 이음새에 압박이 없는 유선형 흐름 설계",
      skeletonDrapeFactor: "양측 쇄골(Clavicle) 끝 가시돌기에 무게를 고르게 분산하여 승모근 하중에 의한 목 늘어남 현상을 완벽 방지",
      recommendedBodyType: "역삼각형 골격 유형 및 어깨가 소폭 굽은 라운드숄더 보정에 매우 적합"
    }
  },
  {
    id: "g2",
    name: "아나토믹 드레이프 루즈 와이드 데님",
    category: "Bottom",
    color: "인디고 블루",
    style: "Casual",
    fitType: "와이드 루즈핏",
    fabricMaterial: "14oz 프리미엄 댕강 셀비지 데님",
    isFavorite: false,
    isWishlist: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
    anatomicalFit: {
      shoulderPrecision: 85,
      chestTightness: 30,
      muscularStressLevel: "골반 장골극(Iliac Crest)부터 대퇴사두근(Quadriceps Femoris) 라인을 따라 흐르며 보행 운동 시 허벅지 마찰 응집력 제로 구현",
      skeletonDrapeFactor: "중력 작용 방향과 일치하는 미니멀 수직 드레이핑 곡선 설계",
      recommendedBodyType: "허벅지 근육(대퇴근)이 크게 발달하여 슬림 팬츠 착용 시 스트레스가 심한 운동인군"
    }
  },
  {
    id: "g3",
    name: "고정밀 입체 쉘 테크니컬 아노락",
    category: "Outer",
    color: "어반 피트 카키",
    style: "Gorpcore",
    fitType: "루즈 익스텐션",
    fabricMaterial: "3-Layer PTFE 방수 멤브레인 쉘",
    isFavorite: true,
    isWishlist: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
    anatomicalFit: {
      shoulderPrecision: 92,
      chestTightness: 55,
      muscularStressLevel: "삼각근(Deltoid) 회전 반경에 최적화된 패널 마감으로, 팔을 상방 180도 회전 시에도 편안함 선사",
      skeletonDrapeFactor: "경추 후방 돌출부(C7)에서 어깨 견봉(Acromion)으로 흐르는 비대칭 인체 곡선에 맞춤 밀착",
      recommendedBodyType: "어깨 볼륨감이 크거나 아웃도어 가동 범위가 넓어 유연성을 극대화해야 하는 액티브 등급"
    }
  },
  {
    id: "g4",
    name: "에센셜 미니멀 스트레이트 치노",
    category: "Bottom",
    color: "샌드 크림",
    style: "Minimal",
    fitType: "스트레이트 슬림핏",
    fabricMaterial: "고밀도 개버딘 수입 코튼 100%",
    isFavorite: false,
    isWishlist: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=600",
    anatomicalFit: {
      shoulderPrecision: 78,
      chestTightness: 60,
      muscularStressLevel: "둔근(Gluteus Maximus) 굴곡선에 밀착하여 뒤태 힙업 시각적 효과 극대화",
      skeletonDrapeFactor: "무릎 슬개골(Patella) 주위 회전 하중을 고려한 테이퍼드 앵클 컷 구성",
      recommendedBodyType: "다리 라인이 직선으로 떨어지며 고관절 볼륨이 슬림한 마디형 골격군"
    }
  },
  {
    id: "g5",
    name: "프리미엄 입체 패딩 비건 가죽 재킷",
    category: "Outer",
    color: "매트 누아르 블랙",
    style: "Street",
    fitType: "박시 크롭핏",
    fabricMaterial: "헤비 비건 유광 플리츠 레더",
    isFavorite: false,
    isWishlist: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
    anatomicalFit: {
      shoulderPrecision: 89,
      chestTightness: 48,
      muscularStressLevel: "목덜미 근육 긴장을 분안하는 두터운 가죽 드레이프가 등쪽 능형근 마찰을 상쇄",
      skeletonDrapeFactor: "가슴 전면 갈비뼈(Ribcage)의 호흡 팽창 운동에 따라 자연스럽게 유격이 발생하는 스프링 웰 디자인",
      recommendedBodyType: "체구가 다소 슬림하며 어깨 라인에 묵직한 하드 쉘 서포팅을 주기 원하는 프레임 강화 스타일"
    }
  }
];

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
        // 토큰이 없을 때만 발급 (handleSocialLogin에서 이미 발급된 경우 skip)
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

  // Load Initial recommendations from AI server on setup done
  useEffect(() => {
    if (isLoggedIn && profile.onboarded) {
      fetchAiRecommendations();
    }
  }, [isLoggedIn, profile.onboarded]);

  const fetchAiRecommendations = () => {
    setAiCuration({
      comment:
        MOCK_AI_CURATION.comment ||
        "비오는 우울한 날일수록 테크니컬한 레이어드가 필수죠!",
      items: MOCK_AI_CURATION.items,
      loading: false,
    });
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

    setAiCuration({
      comment:
        "새롭게 스타일 설정을 변경하신 것을 환영합니다! 당신에게 딱 어울리는 의류를 추천해 드려요!",
      items: MOCK_AI_CURATION.items,
      loading: false,
    });
  };

  const handleSocialLogin = async (platform: "kakao" | "google" | "naver") => {
    if (import.meta.env.DEV) {
      try {
        await ensureDevToken(DEFAULT_DEV_USER_ID, { forceRefresh: true });
        // authUserId / authReady 는 isLoggedIn 변경 후 useEffect 한 곳에서 일괄 설정
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
      {!isLoggedIn && (
        <div className="flex-1 flex items-center justify-center py-12">
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
                onClick={() => handleSocialLogin("kakao")}
                className="w-full h-11.5 rounded-xl bg-[#FEE500] hover:bg-[#FEE500]/95 text-[#191919] font-bold text-xs flex items-center justify-center space-x-3 transition active:scale-98 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-md bg-[#191919]/15 flex items-center justify-center text-[10px] font-black">K</span>
                <span>카카오 아이디로 계속하기</span>
              </button>
              <button
                id="btn-login-naver"
                onClick={() => handleSocialLogin("naver")}
                className="w-full h-11.5 rounded-xl bg-[#03C75A] hover:bg-[#03C75A]/95 text-white font-bold text-xs flex items-center justify-center space-x-3 transition active:scale-98 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-[10px] font-black">N</span>
                <span>네이버로 로그인</span>
              </button>
              <button
                id="btn-login-google"
                onClick={() => handleSocialLogin("google")}
                className="w-full h-11.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-3 transition hover:bg-slate-50 active:scale-98 cursor-pointer shadow-2xs"
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#0284C7]">G</span>
                <span>Google 계정으로 인증</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                          setProfile({ nickname: "", gender: "None", styles: [], onboarded: false });
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
