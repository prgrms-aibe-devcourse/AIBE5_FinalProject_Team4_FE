import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { RegionCode } from "@/types/index";
import { REGIONS } from '@/data/regions';
import { checkNicknameAvailability } from "@/api/users";
import LegalConsentGroup from "@/components/legal/LegalConsentGroup";
import { ChevronRight, X } from "@/components/icons";
import { formatNicknameInput, getNicknameValidationError, NICKNAME_RULE_MESSAGE } from "@/utils/nickname";

export type OnboardingStyleOption = {
    code: string;
    label: string;
    description?: string;
};

interface OnboardingPageProps {
    onComplete: (
        nickname: string,
        birthday: string,
        gender: "Male" | "Female" | "None",
        styles: string[],
        region: RegionCode | '',
        openModal: boolean,
        marketingAgreed: boolean
    ) => void | Promise<void>;
    onExit?: () => void | Promise<void>;
    defaultNickname?: string;
    styleOptions?: OnboardingStyleOption[];
    styleOptionsLoading?: boolean;
    styleOptionsError?: boolean;
}

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

const MIN_STYLE_SELECTION = 2;
type NicknameAvailabilityStatus = "idle" | "invalid" | "checking" | "available" | "unavailable" | "error";

export default function OnboardingPage({
    onComplete,
    onExit,
    defaultNickname = "",
    styleOptions = [],
    styleOptionsLoading = false,
    styleOptionsError = false,
}: OnboardingPageProps) {
    const resolvedStyleOptions = styleOptions
        .map((style) => ({
            key: style.code.trim(),
            label: style.label.trim() || style.code.trim(),
            desc: style.description?.trim() ?? "",
        }))
        .filter((style) => style.key !== "");
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState(defaultNickname);
    const [nicknameStatus, setNicknameStatus] = useState<NicknameAvailabilityStatus>("idle");
    const [nicknameMessage, setNicknameMessage] = useState(NICKNAME_RULE_MESSAGE);
    const [birthYear, setBirthYear] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthDay, setBirthDay] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "None">("None");
    const [region, setRegion] = useState<RegionCode | ''>('');
    const [regionSheetOpen, setRegionSheetOpen] = useState(false);

    const [nicknameError, setNicknameError] = useState("");
    const [birthdayError, setBirthdayError] = useState("");
    const [genderError, setGenderError] = useState("");

    const [styles, setStyles] = useState<string[]>([]);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [marketingAgreed, setMarketingAgreed] = useState(false);
    const navigate = useNavigate();
    const birthday = buildBirthday(birthYear, birthMonth, birthDay);
    const progressPercent = `${(step / 3) * 100}%`;
    const stepLabel = step === 1 ? "기본 정보" : step === 2 ? "선호 스타일" : "옷 등록";
    const selectedRegionLabel = REGIONS.find(({ code }) => code === region)?.label ?? "";
    const canProceedStep1 =
        nickname !== "" &&
        nicknameStatus === "available" &&
        birthday !== "" &&
        gender !== "None" &&
        region !== "" &&
        termsAgreed &&
        privacyAgreed;
    const onboardingTitle =
        step === 1
            ? `${nickname || "회원"}님 정보가 맞나요?`
            : step === 2
                ? `${nickname || "회원"}님의 스타일은?`
                : "첫 옷을 등록해볼까요?";
    const onboardingDescription =
        step === 1
            ? "생년월일, 성별, 지역은 AI 맞춤 추천에 활용됩니다."
            : step === 2
                ? (
                    <>
                        마음에 드는 스타일을 <span className="font-black text-slate-950">2개 이상</span> 선택해주세요.
                    </>
                )
                : "옷을 등록하면 AI 맞춤 추천 정확도가 더 좋아집니다.";

    useEffect(() => {
        const formatted = formatNicknameInput(defaultNickname);
        setNickname(formatted);
    }, [defaultNickname]);

    useEffect(() => {
        const validationError = getNicknameValidationError(nickname);
        if (validationError) {
            setNicknameStatus(nickname.trim() ? "invalid" : "idle");
            setNicknameMessage(validationError);
            return;
        }

        let active = true;
        const timer = window.setTimeout(() => {
            setNicknameStatus("checking");
            setNicknameMessage("닉네임 중복을 확인하고 있어요.");
            void checkNicknameAvailability(nickname)
                .then((result) => {
                    if (!active) return;
                    setNicknameStatus(result.available ? "available" : "unavailable");
                    setNicknameMessage(result.message);
                    if (result.nickname && result.nickname !== nickname) {
                        setNickname(result.nickname);
                    }
                })
                .catch(() => {
                    if (!active) return;
                    setNicknameStatus("error");
                    setNicknameMessage("닉네임 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                });
        }, 350);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [nickname]);

    const handleNext = () => {
        if (!canProceedStep1) {
            if (nicknameStatus !== "available") setNicknameError(nicknameMessage || "닉네임을 확인해주세요.");
            if (birthday === "") setBirthdayError("생년월일을 확인해주세요.");
            if (gender === "None") setGenderError("성별을 확인해주세요.");
            return;
        }
        setNicknameError("");
        setBirthdayError("");
        setGenderError("");
        setStep(2);
    };

    const handleStyleToggle = (style: string) => {
        setStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
        );
    };

    const handleComplete = async (openModal: boolean) => {
        await onComplete(nickname, birthday, gender, styles, region, openModal, marketingAgreed);
        navigate("/");
    };

    const handleBack = async () => {
        if (step === 1) {
            if (onExit) {
                await onExit();
            } else {
                navigate("/");
            }
            return;
        }
        setStep((prev) => Math.max(1, prev - 1));
    };

    return (
        <div className="min-h-screen overflow-y-auto bg-white flex items-start justify-center px-0 py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="w-full min-h-screen max-w-md overflow-y-auto bg-white px-6 py-7 flex flex-col gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <header className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => { void handleBack(); }}
                        aria-label="이전 단계로 이동"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-slate-100"
                    >
                        <ChevronRight className="h-5 w-5 rotate-180 stroke-[2.5]" />
                    </button>
                    <p className="text-sm font-black text-slate-900">{stepLabel}</p>
                    <span className="h-10 w-10" aria-hidden="true" />
                </header>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-label={`온보딩 ${step}/3 단계`}>
                    <div
                        className="h-full rounded-full bg-slate-950 transition-all duration-300"
                        style={{ width: progressPercent }}
                    />
                </div>

                <div className="pt-2">
                    <h1 className="text-[24px] font-black leading-tight tracking-[-0.01em] text-slate-950">
                        {onboardingTitle}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {onboardingDescription}
                    </p>
                </div>

                {/* ── STEP 1: 기본 정보 ── */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        {/* 닉네임 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">닉네임</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => {
                                        setNickname(formatNicknameInput(e.target.value));
                                        setNicknameError("");
                                    }}
                                    placeholder="닉네임을 입력해 주세요."
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    className="w-full h-11 rounded-xl border border-[#e5e7eb] px-4 text-sm outline-none focus:border-[#111827] transition"
                                />
                            </div>
                            <p
                                className={`text-[11px] leading-relaxed ${
                                    nicknameStatus === "available"
                                        ? "text-[#0284C7]"
                                        : nicknameStatus === "unavailable" || nicknameStatus === "invalid" || nicknameStatus === "error" || nicknameError
                                            ? "text-rose-500"
                                            : "text-slate-400"
                                }`}
                            >
                                {nicknameError || nicknameMessage}
                            </p>
                        </div>

                        {/* 생년월일 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">생년월일</label>
                            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="bday-year"
                                    enterKeyHint="next"
                                    value={birthYear}
                                    onChange={(e) => setBirthYear(onlyDigits(e.target.value, 4))}
                                    placeholder="YYYY"
                                    aria-label="생년월일 연도"
                                    className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:border-[#111827] transition"
                                />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="bday-month"
                                    enterKeyHint="next"
                                    value={birthMonth}
                                    onChange={(e) => setBirthMonth(onlyDigits(e.target.value, 2))}
                                    onBlur={() => setBirthMonth((value) => normalizeTwoDigitDatePart(value))}
                                    placeholder="MM"
                                    aria-label="생년월일 월"
                                    className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:border-[#111827] transition"
                                />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="bday-day"
                                    enterKeyHint="done"
                                    value={birthDay}
                                    onChange={(e) => setBirthDay(onlyDigits(e.target.value, 2))}
                                    onBlur={() => setBirthDay((value) => normalizeTwoDigitDatePart(value))}
                                    placeholder="DD"
                                    aria-label="생년월일 일"
                                    className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:border-[#111827] transition"
                                />
                            </div>
                            {birthdayError && <p className="text-xs text-red-500">{birthdayError}</p>}
                        </div>

                        {/* 성별 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">성별</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["Male", "Female"] as const).map((g) => (
                                    <button
                                        type="button"
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className={`h-11 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                                            gender === g
                                                ? "bg-[#111827] text-white border-transparent"
                                                : "bg-white text-[#73737a] border-[#e5e7eb] hover:bg-[#f5f5f5]"
                                        }`}
                                    >
                                        {g === "Male" ? "남성" : "여성"}
                                    </button>
                                ))}
                            </div>
                            {genderError && <p className="text-xs text-red-500">{genderError}</p>}
                        </div>

                        {/* 지역 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">지역</label>
                            <button
                                type="button"
                                onClick={() => setRegionSheetOpen(true)}
                                aria-haspopup="dialog"
                                aria-expanded={regionSheetOpen}
                                className="flex h-11 w-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 text-left text-sm outline-none transition hover:bg-slate-50 focus:border-[#111827]"
                            >
                                <span className={region ? "font-semibold text-slate-900" : "text-slate-500"}>
                                    {selectedRegionLabel || "지역을 선택해 주세요."}
                                </span>
                                <ChevronRight className="h-4 w-4 rotate-90 text-slate-500" />
                            </button>
                        </div>
                        <LegalConsentGroup
                            termsAgreed={termsAgreed}
                            privacyAgreed={privacyAgreed}
                            marketingAgreed={marketingAgreed}
                            onTermsChange={setTermsAgreed}
                            onPrivacyChange={setPrivacyAgreed}
                            onMarketingChange={setMarketingAgreed}
                        />

                        <button
                            onClick={handleNext}
                            disabled={!canProceedStep1}
                            className="w-full h-12 rounded-xl bg-[#111827] text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            다음
                        </button>
                    </div>
                )}

                {/* ── STEP 2: 스타일 선택 ── */}
                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 gap-2">
                            {styleOptionsLoading ? (
                                <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-400">
                                    스타일 목록을 불러오는 중입니다.
                                </div>
                            ) : styleOptionsError || resolvedStyleOptions.length === 0 ? (
                                <div className="col-span-2 rounded-xl border border-red-100 bg-red-50 p-5 text-center text-sm font-bold leading-relaxed text-red-500 break-keep">
                                    <p>스타일 목록을 불러오지 못했습니다.</p>
                                    <p className="mt-1">잠시 후 다시 시도해 주세요.</p>
                                </div>
                            ) : (
                                resolvedStyleOptions.map(({ key, label, desc }) => {
                                    const selectedOrder = styles.indexOf(key) + 1;
                                    const selected = selectedOrder > 0;
                                    return (
                                        <button
                                            type="button"
                                            key={key}
                                            onClick={() => handleStyleToggle(key)}
                                            className={`relative min-h-[92px] rounded-2xl border-2 p-3 text-left transition select-none ${
                                                selected
                                                    ? "border-[#111827] bg-[#f3e8ff] shadow-sm"
                                                    : "border-[#e5e7eb] bg-white hover:border-[#d1d5db]"
                                            }`}
                                        >
                                            <p className={`pr-7 text-sm font-black leading-tight break-keep ${selected ? "text-[#111827]" : "text-[#374151]"}`}
                                            >
                                                {label}
                                            </p>
                                            {desc && (
                                                <p className="mt-2 text-[11px] leading-relaxed text-[#73737a] break-keep">
                                                    {desc}
                                                </p>
                                            )}
                                            {selected && (
                                                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-[11px] font-black text-white">
                                                    {selectedOrder}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            disabled={styleOptionsLoading || styleOptionsError || resolvedStyleOptions.length === 0 || styles.length < MIN_STYLE_SELECTION}
                            className="w-full h-12 rounded-xl bg-[#111827] text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            다음
                        </button>
                    </div>
                )}

                {/* ── STEP 3: 옷 등록 유도 ── */}
                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        <div className="text-center py-2">
                            <span className="text-5xl block mb-4">👗</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => { void handleComplete(true); }}
                                className="w-full h-14 rounded-xl bg-[#111827] text-white font-bold text-sm cursor-pointer hover:bg-[#1f2937] transition"
                            >
                                옷 등록하기
                            </button>
                            <button
                                onClick={() => { void handleComplete(false); }}
                                className="w-full h-12 rounded-xl border border-[#e5e7eb] text-[#73737a] font-semibold text-sm cursor-pointer hover:bg-[#f5f5f5] transition"
                            >
                                나중에 등록하기
                            </button>
                        </div>
                    </div>
                )}

            </div>
            {regionSheetOpen ? (
                <div
                    className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-900/45 backdrop-blur-[2px]"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="region-sheet-title"
                    onClick={() => setRegionSheetOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-t-[32px] bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-200" />
                        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-5">
                            <div>
                                <h2 id="region-sheet-title" className="text-xl font-black text-slate-950">
                                    지역을 선택해 주세요.
                                </h2>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    지역과 날씨를 AI 맞춤 추천에 활용합니다.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRegionSheetOpen(false)}
                                aria-label="지역 선택 닫기"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid max-h-[56vh] grid-cols-3 gap-2 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {REGIONS.map(({ code, label }) => {
                                const selected = region === code;
                                return (
                                    <button
                                        type="button"
                                        key={code}
                                        onClick={() => {
                                            setRegion(code);
                                            setRegionSheetOpen(false);
                                        }}
                                        className={`flex min-h-11 w-full items-center justify-center rounded-2xl border px-2 py-2.5 text-center text-[12px] font-bold leading-tight transition ${
                                            selected
                                                ? "border-slate-950 bg-slate-950 text-white"
                                                : "border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-100/70 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
