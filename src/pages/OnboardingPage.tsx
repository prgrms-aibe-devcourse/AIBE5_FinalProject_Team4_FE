import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface OnboardingPageProps {
    onComplete: (nickname: string, birthday: string, gender: "Male" | "Female" | "None", styles: string[]) => void;
}

const STYLE_OPTIONS = [
    { key: "Casual",   emoji: "👕", label: "캐주얼",  desc: "편안하고 일상적인 스타일" },
    { key: "Minimal",  emoji: "🖤", label: "미니멀",  desc: "단순하고 깔끔한 색감 위주" },
    { key: "Street",   emoji: "🧢", label: "스트리트", desc: "힙합/스케이트 문화에서 온 스타일" },
    { key: "Amekaji",  emoji: "🧥", label: "아메카지", desc: "미국 빈티지 감성의 워크웨어" },
    { key: "Gorpcore", emoji: "🥾", label: "고프코어", desc: "아웃도어 장비를 일상에서 착용" },
];

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState("");
    const [birthday, setBirthday] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "None">("None");

    const [nicknameError, setNicknameError] = useState("");
    const [birthdayError, setBirthdayError] = useState("");
    const [genderError, setGenderError] = useState("");

    const [styles, setStyles] = useState<string[]>([]);
    const navigate = useNavigate();

    const handleNext = () => {
        let hasError = false;
        if (nickname === "") { setNicknameError("닉네임을 입력해주세요"); hasError = true; }
        else setNicknameError("");
        if (birthday === "") { setBirthdayError("생년월일을 입력해주세요"); hasError = true; }
        else setBirthdayError("");
        if (gender === "None") { setGenderError("성별을 선택해주세요"); hasError = true; }
        else setGenderError("");
        if (!hasError) setStep(2);
    };

    const handleStyleToggle = (style: string) => {
        setStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
        );
    };

    const handleComplete = () => {
        onComplete(nickname, birthday, gender, styles);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 flex flex-col gap-6">

                {/* 스텝 인디케이터 */}
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111827] bg-[#f3e8ff] px-3 py-1 rounded-full text-[10px]">
                        {step === 1 ? "기본 정보" : step === 2 ? "스타일 선택" : "옷 등록"}
                    </span>
                    <span className="text-[#73737a] font-mono font-bold">STEP {step} / 3</span>
                </div>

                {/* ── STEP 1: 기본 정보 ── */}
                {step === 1 && (
                    <div className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#111827]">반가워요! 먼저 알아볼게요</h2>
                            <p className="text-xs text-[#73737a] mt-1">입력하신 정보로 맞춤 스타일을 추천해드려요.</p>
                        </div>

                        {/* 닉네임 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">닉네임</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="예: 트렌디패턴러"
                                className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:border-[#111827] transition"
                            />
                            {nicknameError && <p className="text-xs text-red-500">{nicknameError}</p>}
                        </div>

                        {/* 생년월일 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">생년월일</label>
                            <input
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:border-[#111827] transition"
                            />
                            {birthdayError && <p className="text-xs text-red-500">{birthdayError}</p>}
                        </div>

                        {/* 성별 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#73737a] uppercase tracking-wider">성별</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(["Male", "Female"] as const).map((g) => (
                                    <button
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

                        <button
                            onClick={handleNext}
                            disabled={nickname === "" || birthday === "" || gender === "None"}
                            className="w-full h-12 rounded-xl bg-[#111827] text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            다음
                        </button>
                    </div>
                )}

                {/* ── STEP 2: 스타일 선택 ── */}
                {step === 2 && (
                    <div className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#111827]">{nickname}님의 스타일은?</h2>
                            <p className="text-xs text-[#73737a] mt-1">마음에 드는 스타일을 <span className="font-bold text-[#111827]">3개 이상</span> 선택해주세요.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {STYLE_OPTIONS.map(({ key, emoji, label, desc }) => {
                                const selected = styles.includes(key);
                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleStyleToggle(key)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                                            selected
                                                ? "border-[#111827] bg-[#f3e8ff]"
                                                : "border-[#e5e7eb] bg-white hover:border-[#d1d5db]"
                                        }`}
                                    >
                                        <span className="text-2xl">{emoji}</span>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${selected ? "text-[#111827]" : "text-[#374151]"}`}>{label}</p>
                                            <p className="text-xs text-[#73737a]">{desc}</p>
                                        </div>
                                        {selected && (
                                            <span className="w-5 h-5 rounded-full bg-[#111827] flex items-center justify-center text-white text-[10px] font-black shrink-0">✓</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#73737a]">
                            <span>{styles.length}개 선택됨</span>
                            <span className={styles.length >= 3 ? "text-[#111827] font-bold" : ""}>최소 3개 필요</span>
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            disabled={styles.length < 3}
                            className="w-full h-12 rounded-xl bg-[#111827] text-white font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            다음
                        </button>
                    </div>
                )}

                {/* ── STEP 3: 옷 등록 유도 ── */}
                {step === 3 && (
                    <div className="flex flex-col gap-5">
                        <div className="text-center py-4">
                            <span className="text-5xl block mb-4">👗</span>
                            <h2 className="text-xl font-extrabold text-[#111827]">첫 번째 옷을 등록해볼까요?</h2>
                            <p className="text-xs text-[#73737a] mt-2 leading-relaxed">
                                옷을 등록하면 AI가 코디를 추천해드려요.<br />
                                지금 바로 시작하거나 나중에 등록할 수 있어요.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handleComplete}
                                className="w-full h-14 rounded-xl bg-[#111827] text-white font-bold text-sm cursor-pointer hover:bg-[#1f2937] transition"
                            >
                                👕 지금 옷 등록하기
                            </button>
                            <button
                                onClick={handleComplete}
                                className="w-full h-12 rounded-xl border border-[#e5e7eb] text-[#73737a] font-semibold text-sm cursor-pointer hover:bg-[#f5f5f5] transition"
                            >
                                나중에 등록할게요
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
