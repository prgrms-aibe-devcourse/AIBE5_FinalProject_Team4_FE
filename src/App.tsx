/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import api from "@/api/index";
import { useState, useEffect, type ChangeEvent } from "react";
import {
  Home,
  X,
  ChevronRight,
  Plus,
  Activity,
  Layers,
  LayoutGrid,
} from "./components/icons";
import { type RegionCode, type UserProfile } from "@/types/index";
import { REGIONS } from "@/data/regions";
import HomeTab from "./components/HomeTab";
import ClosetTab from "./components/ClosetTab";
import FeedTab from "./components/FeedTab";
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
  fetchMarketingConsent,
  updateMarketingConsent,
} from "@/api/marketingConsent";
import { updateGuideTour } from "@/api/guideTour";
import { uploadProfileImage } from "@/api/profileImage";
import { checkNicknameAvailability } from "@/api/users";
import { getGarmentStyleLabel } from "@/data/garmentStyles";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/common/Modal";
import LegalDocumentModal from "@/components/legal/LegalDocumentModal";
import { formatNicknameInput, getNicknameValidationError, NICKNAME_RULE_MESSAGE } from "@/utils/nickname";
// 기존 상수 data ( TRIGGER_PRODUCTS 는 사용을 하지않아 우선 주석처리함 )
// import { TRIGGER_PRODUCTS } from "@/data/triggerProducts";


type MyProfilePayload = {
  userId: number;
  email?: string | null;
  nickname?: string | null;
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
  socialAccounts?: {
    provider?: string | null;
    providerEmail?: string | null;
  }[] | null;
  guideTourCompletedHome?: boolean | null;
  guideTourCompletedWardrobe?: boolean | null;
  guideTourCompletedFeed?: boolean | null;
  guideTourCompletedMypage?: boolean | null;
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
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: UserProfile["gender"];
  region: RegionCode | "";
  styles: string[];
  profileImageUrl: string;
  profileImagePreviewUrl: string;
  profileImageFile: File | null;
  profileImageFileName: string;
  profileBio: string;
  externalLinkUrl: string;
  marketingAgreed: boolean;
};

type ProfileEditMode = "basic" | "styles" | "image";

type LookfeedProfileDraft = {
  profileBio: string;
  externalLinkUrl: string;
};

type NicknameAvailabilityStatus = "idle" | "invalid" | "checking" | "available" | "unavailable" | "error";

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
  email: "",
  nickname: "",
  gender: "None",
  styles: [],
  onboarded: false,
  birthday: "",
  profileImageUrl: "",
  profileBio: "",
  externalLinkUrl: "",
  socialProviders: [],
  socialAccounts: [],
  guideTourCompletedHome: undefined,
  guideTourCompletedWardrobe: undefined,
  guideTourCompletedFeed: undefined,
  guideTourCompletedMypage: undefined,
};

const getProfileStyleItems = (styles: string[], catalogStyles: CatalogStyle[]): CatalogStyle[] => {
  const styleByCode = new Map(catalogStyles.map((style) => [style.code, style]));
  return styles
    .map((style) => style.trim())
    .filter(Boolean)
    .map((code): CatalogStyle => styleByCode.get(code) ?? { code, label: getGarmentStyleLabel(code) });
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

const onlyDigits = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const normalizeTwoDigitDatePart = (value: string) => {
  if (value === "") return "";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return value;
  return String(numberValue).padStart(2, "0").slice(0, 2);
};

const buildBirthday = (year: string, month: string, day: string) => {
  if (year.length !== 4 || month.length === 0 || day.length === 0) return "";
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) return "";
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
};

const splitBirthday = (birthday?: string | null) => {
  const [year = "", month = "", day = ""] = (birthday ?? "").split("-");
  return {
    year: onlyDigits(year, 4),
    month: onlyDigits(month, 2),
    day: onlyDigits(day, 2),
  };
};

const formatSocialProvider = (provider: string) => {
  const normalized = provider.toLowerCase();
  if (normalized === "google") return "Google";
  if (normalized === "kakao") return "Kakao";
  if (normalized === "naver") return "Naver";
  return provider;
};

const getSocialProviderCodes = (profile: UserProfile) =>
  profile.socialProviders && profile.socialProviders.length > 0
    ? profile.socialProviders
    : profile.socialAccounts?.map((account) => account.provider).filter(Boolean) ?? [];

const getPrimarySocialEmail = (profile: UserProfile) =>
  profile.socialAccounts?.find((account) => account.providerEmail)?.providerEmail
    ?? profile.email
    ?? "미확인";

function SocialProviderLogo({ provider }: { provider: string }) {
  const normalized = provider.toLowerCase();

  if (normalized === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
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

  if (normalized === "naver") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#03C75A] text-[12px] font-black text-white">
        N
      </span>
    );
  }

  if (normalized === "kakao") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FEE500] text-slate-900">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            fill="currentColor"
            d="M12 4C6.48 4 2 7.54 2 11.91c0 2.77 1.8 5.2 4.52 6.62l-.82 3.02c-.08.29.25.52.5.35l3.61-2.4c.71.14 1.44.22 2.19.22 5.52 0 10-3.54 10-7.91S17.52 4 12 4Z"
          />
        </svg>
      </span>
    );
  }

  return <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />;
}

function DefaultProfileAvatar({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-full w-full ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="60" fill="#D1D5DB" />
      <circle cx="60" cy="50" r="22" fill="#F8FAFC" />
      <path
        d="M20 107c7.4-28.2 24.7-44.5 40-44.5S92.6 78.8 100 107c-10.5 8.1-24.3 13-40 13s-29.5-4.9-40-13Z"
        fill="#F8FAFC"
      />
    </svg>
  );
}

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
  const [profileEditMode, setProfileEditMode] = useState<ProfileEditMode>("basic");
  const [profileEditDraft, setProfileEditDraft] = useState<ProfileEditDraft | null>(null);
  const [profileEditSaving, setProfileEditSaving] = useState(false);
  const [isProfileRegionSheetOpen, setIsProfileRegionSheetOpen] = useState(false);
  const [profileNicknameStatus, setProfileNicknameStatus] = useState<NicknameAvailabilityStatus>("idle");
  const [profileNicknameMessage, setProfileNicknameMessage] = useState(NICKNAME_RULE_MESSAGE);
  const [profileMarketingAgreed, setProfileMarketingAgreed] = useState<boolean | null>(null);
  const [profileMarketingLoading, setProfileMarketingLoading] = useState(false);
  const [profileMarketingSaving, setProfileMarketingSaving] = useState(false);
  const [activeLegalDocument, setActiveLegalDocument] = useState<"terms" | "privacy-policy" | "marketing-consent" | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLookfeedProfileEditOpen, setIsLookfeedProfileEditOpen] = useState(false);
  const [lookfeedProfileDraft, setLookfeedProfileDraft] = useState<LookfeedProfileDraft>({
    profileBio: "",
    externalLinkUrl: "",
  });
  const [lookfeedProfileSaving, setLookfeedProfileSaving] = useState(false);

  // 비로그인 상태면 모달을 열고 false를 반환, 로그인 상태면 true를 반환
  const requireLogin = (destination?: "closet" | "profile"): boolean => {
    if(!isLoggedIn){
      if(destination) {
        setPendingTab(destination);
        sessionStorage.setItem("pendingTab", destination);
      }
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  }
  /** 쿠키 기반 인증 확인 완료 여부 */
  const [authReady, setAuthReady] = useState(false);

  // User Profile Setup State
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [catalogStyles, setCatalogStyles] = useState<CatalogStyle[]>([]);
  const [catalogStylesLoading, setCatalogStylesLoading] = useState(true);
  const [catalogStylesError, setCatalogStylesError] = useState(false);

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

  // Navigation state: 'home' | 'closet' | 'outfit-book' | 'feed' | 'profile' | 'lookfeed-profile'
  const [currentTab, setCurrentTab] = useState<"home" | "closet" | "outfit-book" | "feed" | "profile" | "lookfeed-profile">("home");
  const [lookfeedProfileView, setLookfeedProfileView] = useState<"shared" | "saved">("shared");
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
        email: data.email ?? prev.email ?? "",
        nickname: nickname ?? (onboarded ? prev.nickname : ""),
        onboarded,
        birthday: data.birthDate ?? (onboarded ? prev.birthday : ""),
        gender: data.gender ? toClientGender(data.gender) : (onboarded ? prev.gender : "None"),
        region: normalizeRegionCode(data.regionCode) ?? (onboarded ? prev.region : undefined),
        styles: data.styleCodes?.map((style) => style.trim()).filter(Boolean) ?? (onboarded ? prev.styles : []),
        profileImageUrl: data.profileImageUrl ?? prev.profileImageUrl ?? "",
        profileBio: data.profileBio ?? prev.profileBio ?? "",
        externalLinkUrl: data.externalLinkUrl ?? prev.externalLinkUrl ?? "",
        socialProviders: data.socialProviders ?? prev.socialProviders ?? [],
        socialAccounts: data.socialAccounts
          ?.map((account) => ({
            provider: account.provider ?? "",
            providerEmail: account.providerEmail ?? "",
          }))
          .filter((account) => account.provider || account.providerEmail)
          ?? prev.socialAccounts
          ?? [],
        guideTourCompletedHome: data.guideTourCompletedHome ?? prev.guideTourCompletedHome,
        guideTourCompletedFeed: data.guideTourCompletedFeed ?? prev.guideTourCompletedFeed,
        guideTourCompletedWardrobe: data.guideTourCompletedWardrobe ?? prev.guideTourCompletedWardrobe,
        guideTourCompletedMypage: data.guideTourCompletedMypage ?? prev.guideTourCompletedMypage,
      };
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
        .then(() => {
          const pending = sessionStorage.getItem("pendingTab") as "closet" | "profile" | null;
          if (pending) {
            setCurrentTab(pending);
            sessionStorage.removeItem("pendingTab");
          }
        })
        .catch(() => {
          setIsLoggedIn(false);
          setAuthUserId(null);
          setAuthReady(true);
        });
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !profile.onboarded || pendingTab == null) return;
    setCurrentTab(pendingTab);
    setPendingTab(null);
  }, [isLoggedIn, pendingTab, profile.onboarded]);

  useEffect(() => {
    if (authUserId == null || !profile.onboarded) {
      setProfileMarketingAgreed(null);
      return;
    }

    let active = true;
    setProfileMarketingLoading(true);
    fetchMarketingConsent(authUserId)
      .then((response) => {
        if (active) setProfileMarketingAgreed(response.marketingAgreed);
      })
      .catch(() => {
        if (active) setProfileMarketingAgreed(null);
      })
      .finally(() => {
        if (active) setProfileMarketingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUserId, profile.onboarded]);


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
    sessionStorage.removeItem("pendingTab");
    setProfile(EMPTY_PROFILE);
    setProfileMarketingAgreed(null);
    setCurrentTab("home");
    setAuthReady(false);
  };

  const handleGuideTourComplete = async (page: "home" | "wardrobe" | "feed" | "mypage") => {
    try{
      await updateGuideTour({ [page]: true });
    } catch {
      // API 실패 시 무시 — finally에서 로컬 state 업데이트
    }
    finally {
      setProfile(prev => ({
        ...prev,
        ...(page === "home" && { guideTourCompletedHome: true }),
        ...(page === "wardrobe" && { guideTourCompletedWardrobe: true }),
        ...(page === "feed" && { guideTourCompletedFeed: true }),
        ...(page === "mypage" && { guideTourCompletedMypage: true }),
      }));
    }
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
        "회원탈퇴를 진행하시겠습니까?\n탈퇴 후 30일 동안 계정 복구 가능성을 위해 데이터가 보관될 수 있으며, 서비스 이용이 제한됩니다.",
      confirmLabel: "회원탈퇴",
      cancelLabel: "취소",
      tone: "danger",
      onConfirm: async () => {
        setAppDialog(null);
        try {
          await api.delete('/api/v1/users/me');
          setIsProfileEditOpen(false);
          setActiveLegalDocument(null);
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

  const openProfileEdit = async (mode: ProfileEditMode = "basic") => {
    const birthdayParts = splitBirthday(profile.birthday);
    const initialDraft: ProfileEditDraft = {
      nickname: profile.nickname,
      birthday: profile.birthday,
      birthYear: birthdayParts.year,
      birthMonth: birthdayParts.month,
      birthDay: birthdayParts.day,
      gender: profile.gender,
      region: profile.region ?? "",
      styles: profile.styles.map((style) => style.trim()).filter(Boolean),
      profileImageUrl: profile.profileImageUrl ?? "",
      profileImagePreviewUrl: profile.profileImageUrl ?? "",
      profileImageFile: null,
      profileImageFileName: "",
      profileBio: profile.profileBio ?? "",
      externalLinkUrl: profile.externalLinkUrl ?? "",
      marketingAgreed: profileMarketingAgreed ?? false,
    };

    setProfileEditMode(mode);
    setProfileEditDraft(initialDraft);
    setIsProfileEditOpen(true);
  };

  const updateProfileEditDraft = (patch: Partial<ProfileEditDraft>) => {
    setProfileEditDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateProfileBirthdayPart = (part: "year" | "month" | "day", value: string) => {
    setProfileEditDraft((current) => {
      if (!current) return current;
      const nextYear = part === "year" ? onlyDigits(value, 4) : current.birthYear;
      const nextMonth = part === "month" ? onlyDigits(value, 2) : current.birthMonth;
      const nextDay = part === "day" ? onlyDigits(value, 2) : current.birthDay;
      return {
        ...current,
        birthYear: nextYear,
        birthMonth: nextMonth,
        birthDay: nextDay,
        birthday: buildBirthday(nextYear, nextMonth, nextDay),
      };
    });
  };

  const normalizeProfileBirthdayPart = (part: "month" | "day") => {
    setProfileEditDraft((current) => {
      if (!current) return current;
      const nextMonth = part === "month"
        ? normalizeTwoDigitDatePart(current.birthMonth)
        : current.birthMonth;
      const nextDay = part === "day"
        ? normalizeTwoDigitDatePart(current.birthDay)
        : current.birthDay;
      return {
        ...current,
        birthMonth: nextMonth,
        birthDay: nextDay,
        birthday: buildBirthday(current.birthYear, nextMonth, nextDay),
      };
    });
  };

  const handleProfileImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("이미지 확인", "프로필 사진은 이미지 파일만 선택할 수 있습니다.", "danger");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    updateProfileEditDraft({
      profileImagePreviewUrl: previewUrl,
      profileImageFile: file,
      profileImageFileName: file.name,
    });
    event.target.value = "";
  };

  useEffect(() => {
    if (!isProfileEditOpen || !profileEditDraft || profileEditMode !== "basic") {
      setProfileNicknameStatus("idle");
      setProfileNicknameMessage(NICKNAME_RULE_MESSAGE);
      return;
    }

    const validationError = getNicknameValidationError(profileEditDraft.nickname);
    if (validationError) {
      setProfileNicknameStatus(profileEditDraft.nickname.trim() ? "invalid" : "idle");
      setProfileNicknameMessage(validationError);
      return;
    }

    if (profileEditDraft.nickname.trim() === profile.nickname.trim()) {
      setProfileNicknameStatus("available");
      setProfileNicknameMessage("현재 사용 중인 닉네임입니다.");
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setProfileNicknameStatus("checking");
      setProfileNicknameMessage("닉네임 중복을 확인하고 있어요.");
      void checkNicknameAvailability(profileEditDraft.nickname)
        .then((result) => {
          if (!active) return;
          setProfileNicknameStatus(result.available ? "available" : "unavailable");
          setProfileNicknameMessage(result.message);
          if (result.nickname && result.nickname !== profileEditDraft.nickname) {
            updateProfileEditDraft({ nickname: result.nickname });
          }
        })
        .catch(() => {
          if (!active) return;
          setProfileNicknameStatus("error");
          setProfileNicknameMessage("닉네임 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isProfileEditOpen, profileEditMode, profileEditDraft?.nickname]);

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
    const birthday = buildBirthday(
      profileEditDraft.birthYear,
      profileEditDraft.birthMonth,
      profileEditDraft.birthDay,
    );
    let profileImageUrl = profileEditDraft.profileImageUrl.trim();
    const profileBio = profileEditDraft.profileBio.trim();
    const externalLinkUrl = profileEditDraft.externalLinkUrl.trim();

    if (profileEditMode === "basic" && (!nickname || !birthday || profileEditDraft.gender === "None" || !profileEditDraft.region)) {
      showMessage("입력 확인", "닉네임, 생년월일, 성별, 지역을\n모두 입력해 주세요.", "danger");
      return;
    }

    if (profileEditMode === "basic" && profileNicknameStatus !== "available") {
      showMessage("닉네임 확인", profileNicknameMessage || "닉네임을 확인해 주세요.\n사용 가능한 닉네임인지 확인이 필요합니다.", "danger");
      return;
    }

    if (profileEditMode === "styles" && profileEditDraft.styles.length < 2) {
      showMessage("입력 확인", "선호 스타일을 확인해 주세요.\n2개 이상 선택해야 저장할 수 있습니다.", "danger");
      return;
    }

    setProfileEditSaving(true);
    try {
      const regionData = REGIONS.find((region) => region.code === profileEditDraft.region);
      if (profileEditMode === "image" && profileEditDraft.profileImageFile) {
        profileImageUrl = await uploadProfileImage(profileEditDraft.profileImageFile);
      }
      if (profileEditMode === "basic" || profileEditMode === "image") {
        await api.patch('/api/v1/users/profile', {
          nickname,
          birthDate: birthday,
          gender: toApiGender(profileEditDraft.gender),
          regionName: regionData?.label ?? "",
          regionCode: profileEditDraft.region,
          profileImageUrl,
          profileBio,
          externalLinkUrl,
        });
      }
      if (profileEditMode === "basic" && profileEditDraft.marketingAgreed !== (profileMarketingAgreed ?? false)) {
        setProfileMarketingSaving(true);
        const marketingConsent = await updateMarketingConsent(authUserId, {
          marketingAgreed: profileEditDraft.marketingAgreed,
        });
        setProfileMarketingAgreed(marketingConsent.marketingAgreed);
      }
      if (profileEditMode === "styles") {
        await api.post('/api/v1/users/styles', { styleCodes: profileEditDraft.styles });
      }
      await checkAuthProfile();
      setIsProfileEditOpen(false);
      setIsProfileRegionSheetOpen(false);
      setActiveLegalDocument(null);
      showMessage("저장 완료", "변경 내용이 저장되었습니다.", "success");
    } catch {
      showMessage("저장 실패", "변경 내용을 저장하지 못했습니다.\n입력값을 확인한 뒤 다시 시도해 주세요.", "danger");
    } finally {
      setProfileEditSaving(false);
      setProfileMarketingSaving(false);
    }
  };

  const openProfileMenu = () => {
    if (!requireLogin("profile")) return;
    setIsProfileMenuOpen(true);
  };

  const openLookfeedProfile = () => {
    setIsProfileMenuOpen(false);
    setCurrentTab("lookfeed-profile");
    window.setTimeout(scrollAppToTop, 0);
  };

  const openMyInfo = () => {
    setIsProfileMenuOpen(false);
    setCurrentTab("profile");
    window.setTimeout(scrollAppToTop, 0);
  };

  const openLookfeedProfileEdit = () => {
    setLookfeedProfileDraft({
      profileBio: profile.profileBio ?? "",
      externalLinkUrl: profile.externalLinkUrl ?? "",
    });
    setIsLookfeedProfileEditOpen(true);
  };

  const saveLookfeedProfileEdit = async () => {
    if (authUserId == null) return;

    if (!profile.nickname || !profile.birthday || profile.gender === "None" || !profile.region) {
      showMessage("프로필 확인", "기본 프로필 정보가 필요합니다. 내 정보에서 먼저 프로필을 확인해 주세요.", "danger");
      return;
    }

    setLookfeedProfileSaving(true);
    try {
      const regionData = REGIONS.find((region) => region.code === profile.region);
      await api.patch('/api/v1/users/profile', {
        nickname: profile.nickname,
        birthDate: profile.birthday,
        gender: toApiGender(profile.gender),
        regionName: regionData?.label ?? "",
        regionCode: profile.region,
        profileImageUrl: profile.profileImageUrl ?? "",
        profileBio: lookfeedProfileDraft.profileBio.trim(),
        externalLinkUrl: lookfeedProfileDraft.externalLinkUrl.trim(),
      });
      await checkAuthProfile();
      setIsLookfeedProfileEditOpen(false);
      showMessage("저장 완료", "룩피드 프로필이 저장되었습니다.", "success");
    } catch {
      showMessage("저장 실패", "룩피드 프로필 저장에 실패했습니다. 다시 시도해 주세요.", "danger");
    } finally {
      setLookfeedProfileSaving(false);
    }
  };

  const profileEditBirthday = profileEditDraft
    ? buildBirthday(profileEditDraft.birthYear, profileEditDraft.birthMonth, profileEditDraft.birthDay)
    : "";
  const isProfileBasicEditValid = Boolean(
    profileEditDraft &&
    profileEditDraft.nickname.trim() &&
    !getNicknameValidationError(profileEditDraft.nickname) &&
    profileEditBirthday &&
    profileEditDraft.gender !== "None" &&
    profileEditDraft.region &&
    profileNicknameStatus === "available" &&
    !profileMarketingLoading,
  );
  const isProfileStylesEditValid = Boolean(profileEditDraft && profileEditDraft.styles.length >= 2);
  const isProfileEditSaveDisabled =
    profileEditSaving ||
    profileMarketingSaving ||
    !profileEditDraft ||
    (profileEditMode === "basic" && !isProfileBasicEditValid) ||
    (profileEditMode === "styles" && !isProfileStylesEditValid);

  const isOnboardingActive = isLoggedIn && !profile.onboarded;

  return (
    <div
      id="root-container"
      data-view={isOnboardingActive ? "onboarding" : "app"}
      className={`min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-between font-sans ${
        isOnboardingActive
          ? "bg-white p-0"
          : "bg-[#F8FAFC] p-0"
      }`}
    >

      {/* ========================================================= */}
      {/* 1. AUTH / LOGIN FLOW MODAL VIEW */}
      {/* ========================================================= */}
      {isLoginModalOpen && (<LoginPage isModal onClose={() => { setIsLoginModalOpen(false); setPendingTab(null); sessionStorage.removeItem("pendingTab"); }} onSocialLogin={handleSocialLogin} />)}

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
                <p className="whitespace-pre-line break-keep text-sm leading-relaxed text-slate-500">
                  {"탈퇴 후 30일 이내에는 계정을 복구할 수 있습니다.\n기존 계정과 데이터를 복구하시겠습니까?"}
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
              const response = await api.post('/api/v1/users/onboarding', {
                nickname,
                birthDate: birthday,
                gender: gender === 'Male' ? 'MALE' : 'FEMALE',
                regionName: regionData?.label ?? '',
                regionCode: region || '',
                styleCodes: styles,
                marketingAgreed,
              });
              applyAuthProfile(response.data.data);
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
          <div
            className={`flex-1 flex flex-col justify-between overflow-hidden relative ${
              currentTab === "profile" || currentTab === "lookfeed-profile" ? "bg-white" : "bg-[#F8FAFC]"
            }`}
          >

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
                    onClick={openProfileMenu}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 stroke-2 text-xs font-bold ring-2 ring-slate-100 cursor-pointer transition overflow-hidden"
                    title="프로필 메뉴"
                  >
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <DefaultProfileAvatar />
                    )}
                  </button>
                )}
              </div>
            </header>

            {/* Main scrollable body pane */}
            <main
              id="app-viewport"
              className={`h-screen overflow-y-auto pt-24 ${
                currentTab === "profile" || currentTab === "lookfeed-profile"
                  ? "bg-white px-5 pb-0 space-y-0"
                  : "px-5 pb-24 space-y-6"
              }`}
            >

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
                  onLoginRequired={() => setIsLoginModalOpen(true)}
                  authReady={authReady}
                  region={regionLabel}
                  guideTourCompleted={profile.guideTourCompletedHome ?? false}
                  onGuideTourComplete={() => { void handleGuideTourComplete("home")}}
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
                          guideTourCompleted={profile.guideTourCompletedWardrobe ?? false}
                          onGuideTourComplete={() => {void handleGuideTourComplete("wardrobe")}}
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
              {/* TAB 3: STYLE FEED */}
              {/* ========================================================= */}
              {currentTab === "feed" && !authReady && (
                <div className="flex justify-center py-16 text-sm text-slate-500">
                  인증 확인 중…
                </div>
              )}
              {currentTab === "feed" &&
                authReady &&
                authUserId != null && (
                  <FeedTab
                      userId={authUserId}
                      guideTourCompleted={profile.guideTourCompletedFeed ?? false}
                      onGuideTourComplete={() => { void handleGuideTourComplete("feed")}}
                  />
                )}
              {currentTab === "feed" &&
                authReady &&
                authUserId == null && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
                    로그인 정보를 확인할 수 없습니다. 다시 로그인해 주세요.
                  </div>
                )}

              {/* ========================================================= */}
              {/* TAB 4: LOOKFEED PUBLIC PROFILE */}
              {/* ========================================================= */}
              {currentTab === "lookfeed-profile" && (
                <div className="-mx-5 -mt-4 animate-fade-in bg-white text-left">
                  <header className="border-b border-slate-100/80 px-5 py-5 text-center">
                    <h2 className="truncate text-2xl font-black text-slate-900">
                      {profile.nickname || "룩피드 프로필"}
                    </h2>
                  </header>

                  <section className="px-5 pb-4 pt-5">
                    <div className="flex items-center gap-5">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        {profile.profileImageUrl ? (
                          <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <DefaultProfileAvatar />
                        )}
                      </div>
                      <div className="grid flex-1 grid-cols-3 gap-2 text-center">
                        {[
                          { label: "게시물", value: 0 },
                          { label: "팔로워", value: 0 },
                          { label: "팔로잉", value: 0 },
                        ].map((item) => (
                          <div key={item.label} className="space-y-0.5">
                            <p className="text-lg font-black text-slate-900">{item.value}</p>
                            <p className="text-[11px] font-bold text-slate-500">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-medium leading-relaxed text-slate-900">
                        {profile.profileBio || "아직 소개가 등록되지 않았습니다."}
                      </p>
                      {profile.externalLinkUrl && (
                        <a
                          href={profile.externalLinkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block break-all text-sm font-semibold text-[#00376B] hover:underline"
                        >
                          {profile.externalLinkUrl}
                        </a>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={openLookfeedProfileEdit}
                        className="h-10 w-full rounded-lg bg-slate-100 text-sm font-black text-slate-900 transition hover:bg-slate-200 active:scale-[0.99]"
                      >
                        프로필 수정
                      </button>
                    </div>
                  </section>

                  <section>
                    <div className="grid grid-cols-2 border-y border-slate-200 text-center">
                      {[
                        { id: "shared" as const, label: "게시한 피드" },
                        { id: "saved" as const, label: "저장한 피드" },
                      ].map((item) => {
                        const selected = lookfeedProfileView === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLookfeedProfileView(item.id)}
                            className={`relative h-12 text-xs font-black transition ${
                              selected ? "text-slate-950" : "text-slate-400"
                            }`}
                          >
                            {item.label}
                            {selected && (
                              <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-slate-950" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative grid grid-cols-2 gap-px border-y border-slate-200 bg-slate-200">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-slate-50"
                        />
                      ))}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <p className="text-sm font-bold text-slate-500">피드가 아직 없습니다.</p>
                      </div>
                    </div>
                  </section>

                  <div className="pointer-events-none fixed bottom-20 left-0 right-0 z-20 flex justify-center px-5">
                    <button
                      type="button"
                      onClick={() => showMessage("준비 중", "피드 등록 기능은 추후 제공될 예정입니다.")}
                      className="pointer-events-auto flex h-11 items-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 text-sm font-bold text-[#BBF7D0] shadow-lg transition hover:bg-[#1E3A8A]/90 active:scale-95"
                    >
                      <Plus className="h-5 w-5 stroke-[3]" />
                      <span>피드 등록</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: MY INFO */}
              {/* ========================================================= */}
              {currentTab === "profile" && (
                <div className="-mx-5 -mt-6 animate-fade-in bg-white text-left">
                  <section className="bg-white">
                    <header className="border-b border-slate-100/80 px-5 py-5 text-center">
                      <h2 className="text-base font-black text-slate-900">내 정보</h2>
                    </header>

                    <section className="px-5 py-7 text-center">
                      <button
                        type="button"
                        onClick={() => { void openProfileEdit("image"); }}
                        className="group relative mx-auto block h-28 w-28 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200 transition active:scale-[0.98]"
                        aria-label="프로필 이미지 변경"
                      >
                        {profile.profileImageUrl ? (
                          <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <DefaultProfileAvatar />
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-slate-950/55 py-1.5 text-[10px] font-black text-white opacity-100">
                          변경
                        </span>
                      </button>
                      <h3 className="mt-4 truncate text-2xl font-black text-slate-900">
                        {profile.nickname || "닉네임 미설정"}
                      </h3>
                    </section>

                    <section className="border-t border-slate-100 px-5 py-5">
                      <h3 className="text-sm font-black text-slate-900">계정 정보</h3>
                      <div className="mt-3 divide-y divide-slate-100">
                        <div className="flex gap-4 py-3">
                          <p className="w-20 shrink-0 text-xs font-bold text-slate-400">소셜 구분</p>
                          <div className="min-w-0 flex flex-1 flex-wrap gap-2">
                            {getSocialProviderCodes(profile).length > 0 ? (
                              getSocialProviderCodes(profile).map((provider) => (
                                <span
                                  key={provider}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-sm font-bold text-slate-800"
                                >
                                  <SocialProviderLogo provider={provider} />
                                  {formatSocialProvider(provider)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm font-bold text-slate-800">미확인</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 py-3">
                          <p className="w-20 shrink-0 text-xs font-bold text-slate-400">이메일</p>
                          <p className="min-w-0 flex-1 break-all text-sm font-bold text-slate-800">
                            {getPrimarySocialEmail(profile)}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="border-t border-slate-100 px-5 py-5">
                      <button
                        type="button"
                        onClick={() => { void openProfileEdit("basic"); }}
                        className="flex w-full items-center justify-between gap-3 text-left transition hover:text-slate-950 active:scale-[0.995]"
                        aria-label="기본 정보 수정"
                      >
                        <span className="text-sm font-black text-slate-900">기본 정보</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                      <div className="mt-3 divide-y divide-slate-100">
                        {[
                          { label: "닉네임", value: profile.nickname || "미설정" },
                          { label: "생년월일", value: profile.birthday || "미설정" },
                          { label: "성별", value: formatGenderLabel(profile.gender) },
                          { label: "지역", value: formatRegionLabel(profile.region) },
                        ].map((item) => (
                          <div key={item.label} className="flex gap-4 py-3">
                            <p className="w-20 shrink-0 text-xs font-bold text-slate-400">{item.label}</p>
                            <p className="min-w-0 flex-1 text-sm font-bold text-slate-800">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="border-t border-slate-100 px-5 py-5">
                      <button
                        type="button"
                        onClick={() => { void openProfileEdit("styles"); }}
                        className="flex w-full items-center justify-between gap-3 text-left transition hover:text-slate-950 active:scale-[0.995]"
                        aria-label="선호 스타일 수정"
                      >
                        <span className="text-sm font-black text-slate-900">선호 스타일</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                      {getProfileStyleItems(profile.styles, catalogStyles).length > 0 ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {getProfileStyleItems(profile.styles, catalogStyles).map((style, index) => (
                            <div
                              key={`${style.code}-${index}`}
                              className="relative min-h-[76px] rounded-2xl border border-[#E9D5FF] bg-[#FAF5FF] px-3 py-3 text-left shadow-sm"
                            >
                              <p className="pr-7 text-sm font-black leading-tight text-slate-900 break-keep">
                                {style.label}
                              </p>
                              {style.description && (
                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 break-keep">
                                  {style.description}
                                </p>
                              )}
                              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white">
                                {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm font-bold leading-relaxed text-slate-500">
                          선택된 스타일 없음
                        </p>
                      )}
                    </section>

                    <section className="border-t border-slate-100 px-5 pb-16 pt-4">
                      {[
                        { label: "이용약관", type: "terms" as const },
                        { label: "개인정보 처리방침", type: "privacy-policy" as const },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setActiveLegalDocument(item.type)}
                          className="flex w-full items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-bold text-slate-800 transition last:border-b-0 hover:text-slate-950"
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </section>
                  </section>
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
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">코디북</span>
              </button>

              <button
                id="nav-feed"
                onClick={() => {
                  if(!requireLogin()) return;
                  setCurrentTab("feed");
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition ${currentTab === "feed" ? "text-[#1E3A8A]" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Activity className="w-5 h-5" />
                <span className="text-[9px] font-extrabold mt-1">룩피드</span>
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

        {isProfileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="프로필 메뉴 닫기"
              className="fixed inset-0 z-[90] cursor-default bg-transparent"
              onClick={() => setIsProfileMenuOpen(false)}
            />
            <div className="fixed right-5 top-[65px] z-[100] w-35 overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-2xl shadow-slate-900/15 animate-fade-in">
            <button
              type="button"
              onClick={openLookfeedProfile}
              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3.5 text-sm font-black text-slate-800 transition hover:text-slate-950"
            >
              <span>룩피드 프로필</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={openMyInfo}
              className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3.5 text-sm font-black text-slate-800 transition hover:text-slate-950"
            >
              <span>내 정보</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-black text-rose-500 transition hover:text-rose-600"
            >
              <span>로그아웃</span>
              <svg className="h-4 w-4 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            </div>
          </>
        )}

        <Modal
          open={isLookfeedProfileEditOpen}
          onClose={() => {
            if (!lookfeedProfileSaving) setIsLookfeedProfileEditOpen(false);
          }}
          size="lg"
          placement="sheet"
          zIndex={110}
          closeOnBackdrop
          preventClose={lookfeedProfileSaving}
        >
          <ModalHeader
            title="프로필 수정"
            subtitle="프로필 소개와 외부 링크를 수정합니다."
            onClose={() => setIsLookfeedProfileEditOpen(false)}
            closeDisabled={lookfeedProfileSaving}
          />
          <ModalBody className="space-y-4 p-5 sm:p-7 bg-white">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500">소개</span>
              <textarea
                value={lookfeedProfileDraft.profileBio}
                onChange={(event) => setLookfeedProfileDraft((current) => ({
                  ...current,
                  profileBio: event.target.value,
                }))}
                rows={4}
                maxLength={255}
                placeholder="프로필 소개를 입력해 주세요."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-500">외부 링크</span>
              <input
                type="url"
                value={lookfeedProfileDraft.externalLinkUrl}
                onChange={(event) => setLookfeedProfileDraft((current) => ({
                  ...current,
                  externalLinkUrl: event.target.value,
                }))}
                placeholder="www.closetnangam.site/"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
              />
            </label>
          </ModalBody>
          <ModalFooter className="grid grid-cols-2 gap-2 p-4">
            <button
              type="button"
              onClick={() => setIsLookfeedProfileEditOpen(false)}
              disabled={lookfeedProfileSaving}
              className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => { void saveLookfeedProfileEdit(); }}
              disabled={lookfeedProfileSaving}
              className="h-11 rounded-xl bg-[#1E3A8A] text-sm font-black text-white transition hover:bg-[#172f72] disabled:opacity-40"
            >
              {lookfeedProfileSaving ? "저장 중..." : "저장"}
            </button>
          </ModalFooter>
        </Modal>

        <Modal
          open={isProfileEditOpen && profileEditDraft != null}
          onClose={() => {
            if (!profileEditSaving) {
              setIsProfileEditOpen(false);
              setIsProfileRegionSheetOpen(false);
              setActiveLegalDocument(null);
            }
          }}
          size="lg"
          placement="sheet"
          zIndex={110}
          closeOnBackdrop
          preventClose={profileEditSaving}
        >
          <ModalHeader
            title={
              profileEditMode === "styles"
                ? "선호 스타일 수정"
                : profileEditMode === "image"
                  ? "프로필 이미지 변경"
                  : "기본 정보 수정"
            }
            onClose={() => {
              setIsProfileEditOpen(false);
              setIsProfileRegionSheetOpen(false);
              setActiveLegalDocument(null);
            }}
            closeDisabled={profileEditSaving}
          />
          {profileEditDraft && (
            <>
              <ModalBody className="space-y-5 p-5 sm:p-7 bg-white">
                {profileEditMode === "basic" && (
                  <section className="space-y-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">닉네임</span>
                      <input
                        type="text"
                        value={profileEditDraft.nickname}
                        onChange={(event) => updateProfileEditDraft({ nickname: formatNicknameInput(event.target.value) })}
                        autoCapitalize="none"
                        spellCheck={false}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#1E3A8A] focus:bg-white"
                      />
                      <p
                        className={`text-[11px] leading-relaxed ${
                          profileNicknameStatus === "available"
                            ? "text-[#0284C7]"
                            : profileNicknameStatus === "unavailable" || profileNicknameStatus === "invalid" || profileNicknameStatus === "error"
                              ? "text-rose-500"
                              : "text-slate-400"
                        }`}
                      >
                        {profileNicknameMessage}
                      </p>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">생년월일</span>
                      <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="bday-year"
                          enterKeyHint="next"
                          value={profileEditDraft.birthYear}
                          onChange={(event) => updateProfileBirthdayPart("year", event.target.value)}
                          placeholder="YYYY"
                          aria-label="생년월일 연도"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#111827] focus:bg-white"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="bday-month"
                          enterKeyHint="next"
                          value={profileEditDraft.birthMonth}
                          onChange={(event) => updateProfileBirthdayPart("month", event.target.value)}
                          onBlur={() => normalizeProfileBirthdayPart("month")}
                          placeholder="MM"
                          aria-label="생년월일 월"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#111827] focus:bg-white"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="bday-day"
                          enterKeyHint="done"
                          value={profileEditDraft.birthDay}
                          onChange={(event) => updateProfileBirthdayPart("day", event.target.value)}
                          onBlur={() => normalizeProfileBirthdayPart("day")}
                          placeholder="DD"
                          aria-label="생년월일 일"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-hidden transition focus:border-[#111827] focus:bg-white"
                        />
                      </div>
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
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-500">지역</span>
                      <button
                        type="button"
                        onClick={() => setIsProfileRegionSheetOpen(true)}
                        aria-haspopup="dialog"
                        aria-expanded={isProfileRegionSheetOpen}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm font-semibold outline-hidden transition hover:bg-slate-100 focus:border-[#111827] focus:bg-white"
                      >
                        <span className={profileEditDraft.region ? "text-slate-900" : "text-slate-400"}>
                          {profileEditDraft.region ? formatRegionLabel(profileEditDraft.region) : "지역을 선택해 주세요."}
                        </span>
                        <ChevronRight className="h-4 w-4 rotate-90 text-slate-500" />
                      </button>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-2 py-1.5">
                          <input
                            type="checkbox"
                            aria-label="마케팅 정보 수신 동의 선택"
                            checked={Boolean(profileEditDraft.marketingAgreed)}
                            disabled={profileMarketingLoading || profileEditSaving || authUserId == null}
                            onChange={(event) => updateProfileEditDraft({ marketingAgreed: event.target.checked })}
                            className="h-4 w-4 shrink-0 cursor-pointer accent-[#0284C7] disabled:cursor-not-allowed disabled:opacity-40"
                          />
                          <button
                            type="button"
                            aria-label="마케팅 정보 수신 동의 원문 보기"
                            className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs text-slate-700 transition hover:text-[#0284C7]"
                            onClick={() => setActiveLegalDocument("marketing-consent")}
                          >
                            <span className="min-w-0 flex-1 font-extrabold leading-tight">
                              <span className="text-slate-500">[선택]</span>{" "}
                              <span className="text-slate-800">마케팅 정보 수신 동의</span>
                            </span>
                            <ChevronRight className="h-4 w-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-400">
                        선택 동의는 거부해도 서비스 이용이 가능합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={requestWithdraw}
                      className="w-full border-t border-slate-200 pt-4 text-left text-xs font-black text-rose-500 transition hover:text-rose-600"
                    >
                      회원탈퇴
                    </button>
                  </section>
                )}

                {profileEditMode === "styles" && (
                  <section className="space-y-3">
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      마음에 드는 스타일을 <span className="font-black text-slate-950">2개 이상</span> 선택해 주세요.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {catalogStyles.map((style) => {
                        const selectedOrder = profileEditDraft.styles.indexOf(style.code) + 1;
                        const active = selectedOrder > 0;
                        return (
                          <button
                            key={style.code}
                            type="button"
                            onClick={() => toggleProfileEditStyle(style.code)}
                            className={`relative min-h-[92px] rounded-2xl border-2 p-3 text-left transition ${
                              active
                                ? "border-[#111827] bg-[#f3e8ff] shadow-sm"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <p className={`pr-7 text-sm font-black leading-tight break-keep ${active ? "text-[#111827]" : "text-slate-700"}`}>
                              {style.label}
                            </p>
                            {style.description && (
                              <p className="mt-2 text-[11px] leading-relaxed text-slate-500 break-keep">
                                {style.description}
                              </p>
                            )}
                            {active && (
                              <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-[11px] font-black text-white">
                                {selectedOrder}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {profileEditMode === "image" && (
                  <section className="space-y-4">
                    <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {profileEditDraft.profileImagePreviewUrl ? (
                        <img
                          src={profileEditDraft.profileImagePreviewUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <DefaultProfileAvatar />
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs font-black text-slate-900">프로필 이미지</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        이미지를 선택하면 미리보기로 확인할 수 있습니다.
                      </p>
                      {profileEditDraft.profileImageFileName && (
                        <p className="mt-2 truncate text-[10px] font-bold text-slate-500">
                          {profileEditDraft.profileImageFileName}
                        </p>
                      )}
                      <label className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#111827] px-5 text-xs font-black text-white transition hover:bg-slate-800">
                        이미지 선택
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </section>
                )}
              </ModalBody>
              <ModalFooter className="grid grid-cols-2 gap-2 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileEditOpen(false);
                    setIsProfileRegionSheetOpen(false);
                    setActiveLegalDocument(null);
                  }}
                  disabled={profileEditSaving || profileMarketingSaving}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => { void saveProfileEdit(); }}
                  disabled={isProfileEditSaveDisabled}
                  className="h-11 rounded-xl bg-[#1E3A8A] text-sm font-black text-white transition hover:bg-[#172f72] disabled:opacity-40"
                >
                  {profileEditSaving || profileMarketingSaving ? "저장 중..." : "저장"}
                </button>
              </ModalFooter>
            </>
          )}
        </Modal>

        <Modal
          open={isProfileRegionSheetOpen && profileEditDraft != null}
          onClose={() => setIsProfileRegionSheetOpen(false)}
          size="lg"
          placement="sheet"
          zIndex={120}
          closeOnBackdrop
        >
          <ModalHeader
            title="지역 선택"
            subtitle="지역과 날씨를 AI 맞춤 추천에 활용합니다."
            onClose={() => setIsProfileRegionSheetOpen(false)}
          />
          {profileEditDraft && (
            <ModalBody className="grid max-h-[56vh] grid-cols-3 gap-2 overflow-y-auto bg-white px-5 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {REGIONS.map(({ code, label }) => {
                const selected = profileEditDraft.region === code;
                return (
                  <button
                    type="button"
                    key={code}
                    onClick={() => {
                      updateProfileEditDraft({ region: code });
                      setIsProfileRegionSheetOpen(false);
                    }}
                    className={`flex min-h-11 w-full items-center justify-center rounded-2xl border px-2 py-2.5 text-center text-[12px] font-bold leading-tight transition ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-100/70 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </ModalBody>
          )}
        </Modal>

        <LegalDocumentModal
          open={activeLegalDocument != null}
          documentType={activeLegalDocument ?? "terms"}
          onClose={() => setActiveLegalDocument(null)}
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
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 break-keep">
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
