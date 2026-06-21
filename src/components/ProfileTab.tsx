import { useEffect, useRef, useState } from "react"
import { ChevronRight } from "./icons"
import type { UserProfile, RegionCode } from "@/types/index"
import { REGIONS } from "@/data/regions"
import { getGarmentStyleLabel } from "@/data/garmentStyles"
import GuideTour from "@/components/common/GuideTour"

// ─── 로컬 타입 ────────────────────────────────────────────────
type CatalogStyle = {
  code: string
  label: string
  description?: string
}

type ProfileEditMode = "basic" | "styles" | "image"

// ─── Props ────────────────────────────────────────────────────
interface ProfileTabProps {
  profile: UserProfile
  catalogStyles: CatalogStyle[]
  onOpenProfileEdit: (mode: ProfileEditMode) => void
  onSetActiveLegalDocument: (type: "terms" | "privacy-policy") => void
  guideTourCompleted: boolean
  onGuideTourComplete: () => void
}

// ─── 헬퍼 함수 (App.tsx에서 이동) ─────────────────────────────
const getSocialProviderCodes = (profile: UserProfile) =>
  profile.socialProviders && profile.socialProviders.length > 0
    ? profile.socialProviders
    : profile.socialAccounts?.map((account) => account.provider).filter(Boolean) ?? []

const getPrimarySocialEmail = (profile: UserProfile) =>
  profile.socialAccounts?.find((account) => account.providerEmail)?.providerEmail
    ?? profile.email
    ?? "미확인"

const formatSocialProvider = (provider: string) => {
  const normalized = provider.toLowerCase()
  if (normalized === "google") return "Google"
  if (normalized === "kakao") return "Kakao"
  if (normalized === "naver") return "Naver"
  return provider
}

const formatGenderLabel = (gender: UserProfile["gender"]) => {
  if (gender === "Male") return "남성"
  if (gender === "Female") return "여성"
  return "미설정"
}

const formatRegionLabel = (region?: RegionCode) =>
  REGIONS.find((item) => item.code === region)?.label ?? "미설정"

const getProfileStyleItems = (styles: string[], catalogStyles: CatalogStyle[]): CatalogStyle[] => {
  const styleByCode = new Map(catalogStyles.map((style) => [style.code, style]))
  return styles
    .map((style) => style.trim())
    .filter(Boolean)
    .map((code): CatalogStyle => styleByCode.get(code) ?? { code, label: getGarmentStyleLabel(code) })
}

// ─── 서브 컴포넌트 (App.tsx에서 이동) ─────────────────────────
function DefaultProfileAvatar({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-full w-full ${className}`} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="60" fill="#D1D5DB" />
      <circle cx="60" cy="50" r="22" fill="#F8FAFC" />
      <path
        d="M20 107c7.4-28.2 24.7-44.5 40-44.5S92.6 78.8 100 107c-10.5 8.1-24.3 13-40 13s-29.5-4.9-40-13Z"
        fill="#F8FAFC"
      />
    </svg>
  )
}

function SocialProviderLogo({ provider }: { provider: string }) {
  const normalized = provider.toLowerCase()

  if (normalized === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.44Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.33l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.41 14A6.01 6.01 0 0 1 6.1 12c0-.69.11-1.36.31-2V7.41H3.06A9.99 9.99 0 0 0 2 12c0 1.61.38 3.13 1.06 4.59L6.41 14Z" />
        <path fill="#EA4335" d="M12 5.88c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.95 2.89 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.41L6.41 10C7.2 7.64 9.4 5.88 12 5.88Z" />
      </svg>
    )
  }

  if (normalized === "naver") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#03C75A] text-[12px] font-black text-white">
        N
      </span>
    )
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
    )
  }

  return <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden="true" />
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ProfileTab({
  profile,
  catalogStyles,
  onOpenProfileEdit,
  onSetActiveLegalDocument,
  guideTourCompleted,
  onGuideTourComplete,
}: ProfileTabProps) {
  const [tourOpen, setTourOpen] = useState(!guideTourCompleted)

  const profileSectionRef = useRef<HTMLElement>(null)
  const stylesSectionRef = useRef<HTMLElement>(null)

  // guideTourCompleted prop이 바뀌면 tourOpen 동기화
  useEffect(() => {
    setTourOpen(!guideTourCompleted)
  }, [guideTourCompleted])

  return (
    <div className="-mx-5 -mt-6 animate-fade-in bg-white text-left">
      <section className="bg-white">
        <header className="border-b border-slate-100/80 px-5 py-5 text-center">
          <h2 className="text-base font-black text-slate-900">내 정보</h2>
        </header>

        {/* 프로필 이미지 + 닉네임 */}
        <section ref={profileSectionRef} className="px-5 py-7 text-center">
          <button
            type="button"
            onClick={() => { void onOpenProfileEdit("image") }}
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

        {/* 계정 정보 */}
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

        {/* 기본 정보 */}
        <section className="border-t border-slate-100 px-5 py-5">
          <button
            type="button"
            onClick={() => { void onOpenProfileEdit("basic") }}
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

        {/* 선호 스타일 */}
        <section ref={stylesSectionRef} className="border-t border-slate-100 px-5 py-5">
          <button
            type="button"
            onClick={() => { void onOpenProfileEdit("styles") }}
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

        {/* 법적 문서 */}
        <section className="border-t border-slate-100 px-5 pb-16 pt-4">
          {[
            { label: "이용약관", type: "terms" as const },
            { label: "개인정보 처리방침", type: "privacy-policy" as const },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onSetActiveLegalDocument(item.type)}
              className="flex w-full items-center justify-between border-b border-slate-100 py-4 text-left text-sm font-bold text-slate-800 transition last:border-b-0 hover:text-slate-950"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </section>
      </section>

      {/* 가이드 투어 */}
      {tourOpen && (
        <GuideTour
          steps={[
            { targetRef: profileSectionRef, message: "프로필 이미지와 닉네임을 수정할 수 있어요" },
            { targetRef: stylesSectionRef, message: "선호 스타일을 수정하면 추천이 더 정확해져요" },
          ]}
          onComplete={() => {
            setTourOpen(false)
            onGuideTourComplete()
          }}
        />
      )}

      {/* 투어 재진입 버튼 */}
      {!tourOpen && (
        <button
          type="button"
          className="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#1E3A8A] shadow-lg flex items-center justify-center transition active:scale-90"
          onClick={() => setTourOpen(true)}
        >
          ?
        </button>
      )}
    </div>
  )
}
