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
  Layout,
} from "./components/icons";
import { type RegionCode, type UserProfile } from "@/types/index";
import { REGIONS } from "@/data/regions";
import HomeTab from "./components/HomeTab";
import ClosetTab from "./components/ClosetTab";
import OutfitBookTab from "./components/OutfitBookTab";
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
import {
  fetchMarketingConsent,
  updateMarketingConsent,
} from "@/api/marketingConsent";
import { getGarmentStyleLabel } from "@/data/garmentStyles";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/common/Modal";
import LegalDocumentModal from "@/components/legal/LegalDocumentModal";
// 기존 상수 data ( TRIGGER_PRODUCTS 는 사용을 하지않아 우선 주석처리함 )
// import { TRIGGER_PRODUCTS } from "@/data/triggerProducts";

type MyProfilePayload = {
  userId: number;
  nickname: string;
  onboarded: boolean;
  birthDate?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | string | null;
  regionName?: string | null;
  regionCode?: string | null;
  profileImageUrl?: string | null;
  profileBio?: string | null;
  externalLinkUrl?: string | null;
  styleCodes?: string[] | null;
  socialProviders?: string[] | null;
};

type AppDialog =
  | {
      type: "message";
      title: string;
      message: string;
      tone?: "info" | "success" | "danger";
    }
  | {
      type: "confirm";
      title: string;
      message: string;
      confirmLabel: string;
      cancelLabel?: string;
      tone?: "info" | "danger";
      onConfirm: () => void | Promise<void>;
    };

type ProfileEditDraft = {
  nickname: string;
  birthday: string;
  gender: UserProfile["gender"];
  region: RegionCode | "";
  styles: string[];
  profileImageUrl: string;
  profileBio: string;
  externalLinkUrl: string;
  marketingAgreed: boolean;
};

type CatalogStylePayload = {
  code?: string | null;
  name?: string | null;
  description?: string | null;
};

type CategoryCatalogPayload = {
  styles?: CatalogStylePayload[] | null;
};

type CatalogStyle = {
  code: string;
  label: string;
  description?: string;
};

const EMPTY_PROFILE: UserProfile = {
  nickname: "",
  gender: "None",
  styles: [],
  onboarded: false,
  birthday: "",
  profileImageUrl: "",
  profileBio: "",
  externalLinkUrl: "",
  socialProviders: [],
};

const formatProfileStyles = (styles: string[], catalogStyles: CatalogStyle[]) => {
  const labelByCode = new Map(catalogStyles.map((style) => [style.code, style.label]));
  const styleLabels = styles
    .map((style) => style.trim())
    .filter(Boolean)
    .map((code) => labelByCode.get(code) ?? getGarmentStyleLabel(code));

  return styleLabels.length > 0 ? styleLabels.join(", ") : "선택된 스타일 없음";
};

const normalizeCatalogStyles = (payload?: CategoryCatalogPayload | null): CatalogStyle[] => {
  const styles = payload?.styles ?? [];
  return styles
    .map((style): CatalogStyle | null => {
      const code = (style.code ?? "").trim();
      if (!code) return null;
      const label = style.name?.trim() || getGarmentStyleLabel(code);
      const description = style.description?.trim();
      return {
        code,
        label,
        ...(description ? { description } : {}),
      };
    })
    .filter((style): style is CatalogStyle => style != null);
};

const toClientGender = (gender?: string | null): UserProfile["gender"] => {
  if (gender === "MALE") return "Male";
  if (gender === "FEMALE") return "Female";
  return "None";
};

const toApiGender = (gender: UserProfile["gender"]) => {
  if (gender === "Male") return "MALE";
  if (gender === "Female") return "FEMALE";
  return "OTHER";
};

const normalizeRegionCode = (regionCode?: string | null): RegionCode | undefined => {
  if (!regionCode) return undefined;
  return REGIONS.some((region) => region.code === regionCode)
    ? (regionCode as RegionCode)
    : undefined;
};

const formatGenderLabel = (gender: UserProfile["gender"]) => {
  if (gender === "Male") return "남성";
  if (gender === "Female") return "여성";
  return "미설정";
};

const formatRegionLabel = (region?: RegionCode) =>
  REGIONS.find((item) => item.code === region)?.label ?? "미설정";

const formatSocialProvider = (provider: string) => {
  const normalized = provider.toLowerCase();
  if (normalized === "google") return "Google";
  if (normalized === "kakao") return "Kakao";
  if (normalized === "naver") return "Naver";
  return provider;
};

export default function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  // 로그인 모달 열림 여부
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<"closet" | "profile" | null>(null);
  const [isWithdrawnRestoreOpen, setIsWithdrawnRestoreOpen] = useState(false);
  const [withdrawnRestoreLoading, setWithdrawnRestoreLoading] = useState(false);
  const [appDialog, setAppDialog] = useState<AppDialog | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileEditDraft, setProfileEditDraft] = useState<ProfileEditDraft | null>(null);
  const [profileEditLoading, setProfileEditLoading] = useState(false);
  const [profileEditSaving, setProfileEditSaving] = useState(false);
  const [isMarketingConsentDocumentOpen, setIsMarketingConsentDocumentOpen] = useState(false);

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
    return stored ?? EMPTY_PROFILE;
  });
  const [catalogStyles, setCatalogStyles] = useState<CatalogStyle[]>([]);
  const [catalogStylesLoading, setCatalogStylesLoading] = useState(true);
  const [catalogStylesError, setCatalogStylesError] = useState(false);

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

  // Navigation state: 'home' | 'closet' | 'outfit-book' | 'feed' | 'profile'
  const [currentTab, setCurrentTab] = useState<"home" | "closet" | "outfit-book" | "feed" | "profile">("home");
  const [homeResetSignal, setHomeResetSignal] = useState<number>(0);
  const [isPhotoRegisterOpen, setIsPhotoRegisterOpen] = useState(false);
  const [isPurchaseRegisterOpen, setIsPurchaseRegisterOpen] = useState(false);
  const regionLabel = REGIONS.find((region) => region.code === profile.region)?.label ?? "서울특별시";

  useEffect(() => {
    let cancelled = false;
    setCatalogStylesLoading(true);
    setCatalogStylesError(false);
    api.get('/api/v1/categories')
      .then((response) => {
        if (cancelled) return;
        const styles = normalizeCatalogStyles(response.data?.data);
        setCatalogStyles(styles);
        setCatalogStylesError(styles.length === 0);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogStyles([]);
        setCatalogStylesError(true);
      })
      .finally(() => {
        if (!cancelled) setCatalogStylesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuthProfile = (data: MyProfilePayload) => {
    const { userId, nickname, onboarded } = data;

    setProfile((prev) => {
      const nextProfile: UserProfile = {
        ...prev,
        nickname: nickname || prev.nickname,
        onboarded,
        birthday: data.birthDate ?? prev.birthday,
        gender: data.gender ? toClientGender(data.gender) : prev.gender,
        region: normalizeRegionCode(data.regionCode) ?? prev.region,
        styles: data.styleCodes?.map((style) => style.trim()).filter(Boolean) ?? prev.styles,
        profileImageUrl: data.profileImageUrl ?? prev.profileImageUrl ?? "",
        profileBio: data.profileBio ?? prev.profileBio ?? "",
        externalLinkUrl: data.externalLinkUrl ?? prev.externalLinkUrl ?? "",
        socialProviders: data.socialProviders ?? prev.socialProviders ?? [],
      };
      if (nextProfile.onboarded) {
        saveUserProfile(nextProfile);
      }
      return nextProfile;
    });
    setAuthUserId(userId);
    setIsLoggedIn(true);
    setAuthReady(true);
  };

  const checkAuthProfile = async () => {
    const res = await api.get('/api/v1/users/profile');
    applyAuthProfile(res.data.data);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("withdrawn") !== "restore_required") return;

    params.delete("withdrawn");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    setIsWithdrawnRestoreOpen(true);
  }, []);

  // 앱 시작 시 쿠키인증 상태 확인
  useEffect(() => {
    checkAuthProfile()
        .catch(() => {
          setIsLoggedIn(false);
          setAuthReady(false);
        });
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !profile.onboarded || pendingTab == null) return;
    setCurrentTab(pendingTab);
    setPendingTab(null);
  }, [isLoggedIn, pendingTab, profile.onboarded]);


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
    setPendingTab(null);
    clearUserProfile();
    setProfile(EMPTY_PROFILE);
    setCurrentTab("home");
    setAuthReady(false);
  };

  const handleLogout = () => {
    api.post('/api/v1/auth/logout')
        .finally(() => resetAuthState());
  }

  const showMessage = (
    title: string,
    message: string,
    tone: "info" | "success" | "danger" = "info",
  ) => {
    setAppDialog({ type: "message", title, message, tone });
  };

  const requestWithdraw = () => {
    setAppDialog({
      type: "confirm",
      title: "회원탈퇴",
      message:
        "회원탈퇴를 진행하시겠습니까? 탈퇴 후 30일 동안 계정 복구 가능성을 위해 데이터가 보관될 수 있으며, 서비스 이용이 제한됩니다.",
      confirmLabel: "회원탈퇴",
      cancelLabel: "취소",
      tone: "danger",
      onConfirm: async () => {
        setAppDialog(null);
        try {
          await api.delete('/api/v1/users/me');
          setIsProfileEditOpen(false);
          setIsMarketingConsentDocumentOpen(false);
          resetAuthState();
          showMessage("회원탈퇴 완료", "회원탈퇴가 완료되었습니다.", "success");
        } catch {
          showMessage("회원탈퇴 실패", "회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.", "danger");
        }
      },
    });
  };

  const handleRestoreWithdrawnAccount = async () => {
    setWithdrawnRestoreLoading(true);
    try {
      await api.post('/api/v1/auth/restore-withdrawn', null, {
        headers: { 'X-Skip-Global-Error-Redirect': 'true' },
      });
      await checkAuthProfile();
      setIsWithdrawnRestoreOpen(false);
      showMessage("계정 복구 완료", "계정이 복구되었습니다.", "success");
    } catch {
      showMessage("계정 복구 실패", "계정 복구에 실패했습니다. 다시 로그인해 주세요.", "danger");
      resetAuthState();
      setIsWithdrawnRestoreOpen(false);
    } finally {
      setWithdrawnRestoreLoading(false);
    }
  };

  const handleCancelWithdrawnRestore = async () => {
    try {
      await api.post('/api/v1/auth/logout', null, {
        headers: { 'X-Skip-Global-Error-Redirect': 'true' },
      });
    } finally {
      setIsWithdrawnRestoreOpen(false);
      resetAuthState();
    }
  };

  const openProfileEdit = async () => {
    const initialDraft: ProfileEditDraft = {
      nickname: profile.nickname,
      birthday: profile.birthday,
      gender: profile.gender,
      region: profile.region ?? "",
      styles: profile.styles.map((style) => style.trim()).filter(Boolean),
      profileImageUrl: profile.profileImageUrl ?? "",
      profileBio: profile.profileBio ?? "",
      externalLinkUrl: profile.externalLinkUrl ?? "",
      marketingAgreed: false,
    };

    setProfileEditDraft(initialDraft);
    setIsProfileEditOpen(true);

    if (authUserId == null) return;
    setProfileEditLoading(true);
    try {
      const response = await fetchMarketingConsent(authUserId);
      setProfileEditDraft((current) =>
        current ? { ...current, marketingAgreed: response.marketingAgreed } : current,
      );
    } catch {
      showMessage(
        "마케팅 동의 조회 실패",
        "마케팅 동의 상태를 불러오지 못했습니다. 다시 시도해 주세요.",
        "danger",
      );
    } finally {
      setProfileEditLoading(false);
    }
  };

  const updateProfileEditDraft = (patch: Partial<ProfileEditDraft>) => {
    setProfileEditDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const toggleProfileEditStyle = (styleCode: string) => {
    setProfileEditDraft((current) => {
      if (!current) return current;
      const hasStyle = current.styles.includes(styleCode);
      return {
        ...current,
        styles: hasStyle
          ? current.styles.filter((style) => style !== styleCode)
          : [...current.styles, styleCode],
      };
    });
  };

  const saveProfileEdit = async () => {
    if (!profileEditDraft || authUserId == null) return;

    const nickname = profileEditDraft.nickname.trim();
    const profileImageUrl = profileEditDraft.profileImageUrl.trim();
    const profileBio = profileEditDraft.profileBio.trim();
    const externalLinkUrl = profileEditDraft.externalLinkUrl.trim();

    if (
      !nickname ||
      !profileEditDraft.birthday ||
      profileEditDraft.gender === "None" ||
      !profileEditDraft.region ||
      profileEditDraft.styles.length === 0
    ) {
      showMessage("입력 확인", "닉네임, 생년월일, 성별, 지역, 선호 스타일을 모두 입력해 주세요.", "danger");
      return;
    }

    setProfileEditSaving(true);
    try {
      const regionData = REGIONS.find((region) => region.code === profileEditDraft.region);
      await api.patch('/api/v1/users/profile', {
        nickname,
        birthDate: profileEditDraft.birthday,
        gender: toApiGender(profileEditDraft.gender),
        regionName: regionData?.label ?? "",
        regionCode: profileEditDraft.region,
        profileImageUrl,
        profileBio,
        externalLinkUrl,
      });
      await api.post('/api/v1/users/styles', { styleCodes: profileEditDraft.styles });
      await updateMarketingConsent(authUserId, {
        marketingAgreed: profileEditDraft.marketingAgreed,
      });
      await checkAuthProfile();
      setIsProfileEditOpen(false);
          setIsMarketingConsentDocumentOpen(false);
      showMessage("저장 완료", "개인정보와 선호 정보가 저장되었습니다.", "success");
    } catch {
      showMessage("저장 실패", "개인정보 저장에 실패했습니다. 입력값을 확인한 뒤 다시 시도해 주세요.", "danger");
    } finally {
      setProfileEditSaving(false);
    }
  };

  const isOnboardingActive = isLoggedIn && !profile.onboarded;

  return (
    <div
      id="root-container"
      data-view={isOnboardingActive ? "onboarding" : "app"}
      className={`min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between font-sans ${
        isOnboardingActive
          ? "bg-white p-0"
          : "bg-[#F1F5F9] py-4 px-3 md:py-6 md:px-6"
      }`}
    >
      
      {/* ========================================================= */}
      {/* 1. AUTH / LOGIN FLOW MODAL VIEW */}
      {/* ========================================================= */}
      {isLoginModalOpen && (<LoginPage isModal onClose={() => setIsLoginModalOpen(false)} onSocialLogin={handleSocialLogin} />)}

      {isWithdrawnRestoreOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl border border-slate-100 animate-modal-in">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#BBF7D0]/50 text-[#1E3A8A]">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                  <path d="M12 8v5l3 2" />
                </svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">탈퇴한 계정입니다</h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  탈퇴 후 30일 이내에는 계정을 복구할 수 있습니다. 기존 계정과 데이터를 복구하시겠습니까?
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { void handleCancelWithdrawnRestore(); }}
                disabled={withdrawnRestoreLoading}
                className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => { void handleRestoreWithdrawnAccount(); }}
                disabled={withdrawnRestoreLoading}
                className="h-11 rounded-xl bg-[#1E3A8A] text-sm font-bold text-white shadow-sm transition hover:bg-[#172f72] disabled:opacity-50"
              >
                {withdrawnRestoreLoading ? "복구 중..." : "계정 복구"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ONBOARDING PROFILE FLOWS */}
      {/* ========================================================= */}
      {isOnboardingActive && (
          <OnboardingPage
            defaultNickname={profile.nickname}
            styleOptions={catalogStyles}
            styleOptionsLoading={catalogStylesLoading}
            styleOptionsError={catalogStylesError}
            onExit={handleLogout}
            onComplete={async (nickname, birthday, gender, styles, region, openModal, marketingAgreed) => {
            try {
              const regionData = REGIONS.find(r => r.code === region);
              await api.patch('/api/v1/users/profile', {
                nickname,
                birthDate: birthday,
                gender: gender === 'Male' ? 'MALE' : 'FEMALE',
                regionName: regionData?.label ?? '',
                regionCode: region || '',
              });
              await api.post('/api/v1/users/styles', { styleCodes: styles });
              if (authUserId != null) {
                try {
                  await updateMarketingConsent(authUserId, { marketingAgreed });
                } catch {
                  showMessage(
                    "마케팅 동의 저장 실패",
                    "마케팅 정보 수신 동의 저장에 실패했습니다. 마이페이지에서 다시 변경할 수 있습니다.",
                    "danger",
                  );
                }
              }
              persistProfile({
                ...profile,
                nickname,
                birthday,
                gender,
                styles,
                region: region || undefined,
                onboarded: true,
                socialProviders: profile.socialProviders ?? [],
                profileImageUrl: profile.profileImageUrl ?? '',
                profileBio: profile.profileBio ?? '',
                externalLinkUrl: profile.externalLinkUrl ?? '',
              });
              if (openModal) openGarmentRegister();
            } catch {
              showMessage("프로필 저장 실패", "프로필 저장에 실패했어요. 다시 시도해주세요.", "danger");
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
                {!isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(true)}
                    className="rounded-full bg-[#1E3A8A] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#172f72] active:scale-[0.98]"
                  >
                    로그인
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if(!requireLogin("profile")) return;
                      setCurrentTab("profile")}}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 stroke-2 text-xs font-bold ring-2 ring-slate-100 cursor-pointer transition overflow-hidden"
                    title="마이페이지"
                  >
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                )}
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
                  authReady={authReady}
                  region={regionLabel}
                />
              )}

              {/* ========================================================= */}
              {/* TAB 1.5: OUTFIT BOOK (My saved outfits) */}
              {/* ========================================================= */}
              {currentTab === "outfit-book" && authUserId != null && (
                <OutfitBookTab
                  userId={authUserId}
                  clothes={clothes}
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
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1.5 bg-[#BBF7D0] text-[#1E3A8A] rounded-bl-sm text-[8px] font-mono leading-none">
                      ACTIVE MEMBER
                    </div>
                    
                    <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 text-3xl mx-auto flex items-center justify-center overflow-hidden">
                      {profile.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>🕺</span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[#1E3A8A]">{profile.nickname}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {profile.socialProviders && profile.socialProviders.length > 0
                          ? `${profile.socialProviders.map(formatSocialProvider).join(", ")} 로그인`
                          : "소셜 로그인 정보 확인 중"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-left">
                        <p className="text-[10px] font-bold text-slate-400">성별</p>
                        <p className="mt-0.5 font-bold text-slate-700">{formatGenderLabel(profile.gender)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-left">
                        <p className="text-[10px] font-bold text-slate-400">생년월일</p>
                        <p className="mt-0.5 font-bold text-slate-700">{profile.birthday || "미설정"}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-left">
                        <p className="text-[10px] font-bold text-slate-400">지역</p>
                        <p className="mt-0.5 font-bold text-slate-700">{formatRegionLabel(profile.region)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-left">
                        <p className="text-[10px] font-bold text-slate-400">로그인</p>
                        <p className="mt-0.5 font-bold text-slate-700">
                          {profile.socialProviders && profile.socialProviders.length > 0
                            ? profile.socialProviders.map(formatSocialProvider).join(", ")
                            : "미확인"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-left">
                      <p className="text-[10px] font-bold text-slate-400">선호 스타일</p>
                      <p className="text-xs font-semibold leading-relaxed text-slate-700">
                        {formatProfileStyles(profile.styles, catalogStyles)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-left">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold text-slate-400">자기소개</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {profile.profileBio || "등록된 자기소개가 없습니다."}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold text-slate-400">외부 링크</p>
                        {profile.externalLinkUrl ? (
                          <a
                            href={profile.externalLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block break-all text-xs font-bold text-[#0284C7] underline decoration-[#0284C7]/30 underline-offset-2"
                          >
                            {profile.externalLinkUrl}
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">등록된 외부 링크가 없습니다.</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { void openProfileEdit(); }}
                      className="w-full rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#172f72] active:scale-[0.98]"
                    >
                      개인정보 등 편집
                    </button>
                  </div>

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
                id="nav-outfit-book"
                onClick={() => {
                  if(!requireLogin()) return;
                  setCurrentTab("outfit-book");
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === "outfit-book" ? "text-[#1E3A8A]" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Layout className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">코디북</span>
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

        <Modal
          open={isProfileEditOpen && profileEditDraft != null}
          onClose={() => {
            if (!profileEditSaving) {
              setIsProfileEditOpen(false);
              setIsMarketingConsentDocumentOpen(false);
            }
          }}
          size="lg"
          placement="sheet"
          zIndex={110}
          closeOnBackdrop
          preventClose={profileEditSaving}
        >
          <ModalHeader
            title="개인정보 등 편집"
            subtitle="개인정보, 지역, 선호 스타일, 마케팅 동의 여부를 수정합니다."
            onClose={() => {
              setIsProfileEditOpen(false);
              setIsMarketingConsentDocumentOpen(false);
            }}
            closeDisabled={profileEditSaving}
          />
          {profileEditDraft && (
            <>
              <ModalBody className="space-y-5 p-5 sm:p-7 bg-white">
                <section className="space-y-3">
                  <h4 className="text-sm font-black text-[#1E3A8A]">기본 정보</h4>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">닉네임</span>
                    <input
                      type="text"
                      value={profileEditDraft.nickname}
                      onChange={(event) => updateProfileEditDraft({ nickname: event.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">생년월일</span>
                    <input
                      type="date"
                      value={profileEditDraft.birthday}
                      onChange={(event) => updateProfileEditDraft({ birthday: event.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">성별</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "Male", label: "남성" },
                        { value: "Female", label: "여성" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateProfileEditDraft({ gender: option.value as UserProfile["gender"] })}
                          className={`h-10 rounded-xl border text-xs font-black transition ${
                            profileEditDraft.gender === option.value
                              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">지역</span>
                    <select
                      value={profileEditDraft.region}
                      onChange={(event) => updateProfileEditDraft({ region: event.target.value as RegionCode | "" })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    >
                      <option value="">지역 선택</option>
                      {REGIONS.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#1E3A8A]">선호 스타일</h4>
                    <p className="text-[11px] text-slate-400">
                      첫 번째 선택 스타일은 대표 스타일, 나머지는 보조 스타일로 저장됩니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {catalogStyles.map((style) => {
                      const active = profileEditDraft.styles.includes(style.code);
                      return (
                        <button
                          key={style.code}
                          type="button"
                          onClick={() => toggleProfileEditStyle(style.code)}
                          className={`h-10 rounded-xl border text-xs font-black transition ${
                            active
                              ? "border-[#0284C7] bg-[#E0F2FE] text-[#075985]"
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-black text-[#1E3A8A]">프로필 정보</h4>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">프로필 이미지 URL</span>
                    <input
                      type="url"
                      value={profileEditDraft.profileImageUrl}
                      onChange={(event) => updateProfileEditDraft({ profileImageUrl: event.target.value })}
                      placeholder="https://..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">자기소개</span>
                    <textarea
                      value={profileEditDraft.profileBio}
                      onChange={(event) => updateProfileEditDraft({ profileBio: event.target.value })}
                      rows={3}
                      maxLength={255}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">외부 링크</span>
                    <input
                      type="url"
                      value={profileEditDraft.externalLinkUrl}
                      onChange={(event) => updateProfileEditDraft({ externalLinkUrl: event.target.value })}
                      placeholder="https://..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                    />
                  </label>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-black text-[#1E3A8A]">동의 관리</h4>
                  <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="space-y-0.5">
                      <span className="block text-xs font-bold text-slate-700">
                        마케팅 정보 수신 동의
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        동의하지 않아도 기본 서비스 이용은 가능합니다.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={profileEditDraft.marketingAgreed}
                      disabled={profileEditLoading || profileEditSaving}
                      onChange={(event) => updateProfileEditDraft({ marketingAgreed: event.target.checked })}
                      className="h-5 w-5 accent-[#0284C7] disabled:opacity-40"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMarketingConsentDocumentOpen(true)}
                    className="text-left text-[11px] font-bold text-[#0284C7] underline decoration-[#0284C7]/30 underline-offset-2"
                  >
                    마케팅 정보 수신 동의 원문 보기
                  </button>
                  {profileEditLoading && (
                    <p className="text-[11px] font-semibold text-slate-400">마케팅 동의 상태 확인 중...</p>
                  )}
                </section>

                <section className="rounded-2xl border border-rose-100 bg-rose-50 p-4 space-y-2">
                  <h4 className="text-sm font-black text-rose-600">회원탈퇴</h4>
                  <p className="text-[11px] leading-relaxed text-rose-500">
                    탈퇴 후 30일 동안 계정 복구 가능성을 위해 데이터가 보관될 수 있으며, 서비스 이용이 제한됩니다.
                  </p>
                  <button
                    type="button"
                    onClick={requestWithdraw}
                    disabled={profileEditSaving}
                    className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-xs font-black text-rose-500 transition hover:bg-rose-100 disabled:opacity-40"
                  >
                    회원탈퇴
                  </button>
                </section>
              </ModalBody>
              <ModalFooter className="grid grid-cols-2 gap-2 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileEditOpen(false);
                    setIsMarketingConsentDocumentOpen(false);
                  }}
                  disabled={profileEditSaving}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => { void saveProfileEdit(); }}
                  disabled={profileEditSaving}
                  className="h-11 rounded-xl bg-[#1E3A8A] text-sm font-black text-white transition hover:bg-[#172f72] disabled:opacity-40"
                >
                  {profileEditSaving ? "저장 중..." : "저장"}
                </button>
              </ModalFooter>
            </>
          )}
        </Modal>

        <LegalDocumentModal
          open={isMarketingConsentDocumentOpen}
          documentType="marketing-consent"
          onClose={() => setIsMarketingConsentDocumentOpen(false)}
        />

        <Modal
          open={appDialog != null}
          onClose={() => setAppDialog(null)}
          size="sm"
          zIndex={120}
          closeOnBackdrop
        >
          {appDialog && (
            <>
              <ModalHeader
                title={appDialog.title}
                onClose={() => setAppDialog(null)}
              />
              <ModalBody className="p-5">
                <p className="text-sm leading-relaxed text-slate-600">
                  {appDialog.message}
                </p>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2 p-4">
                {appDialog.type === "confirm" && (
                  <button
                    type="button"
                    onClick={() => setAppDialog(null)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
                  >
                    {appDialog.cancelLabel ?? "취소"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (appDialog.type === "message") {
                      setAppDialog(null);
                      return;
                    }
                    void appDialog.onConfirm();
                  }}
                  className={`h-10 rounded-xl px-4 text-sm font-black text-white transition ${
                    appDialog.tone === "danger"
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-[#1E3A8A] hover:bg-[#172f72]"
                  }`}
                >
                  {appDialog.type === "confirm" ? appDialog.confirmLabel : "확인"}
                </button>
              </ModalFooter>
            </>
          )}
        </Modal>

      </div>
    );
  }
