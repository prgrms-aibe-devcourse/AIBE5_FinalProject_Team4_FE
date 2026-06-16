import { Settings, CheckCircle2 } from "./icons";
import { UserProfile } from "@/types/index";
import { GARMENT_STYLES, getGarmentStyleLabel, resolveGarmentStyleCode } from "@/data/garmentStyles";

interface ProfileEditTabProps {
  profile: UserProfile;
  styleUpdateSuccess: boolean;
  handleSaveStylePreferences: (
    nickname: string,
    gender: "Male" | "Female" | "None",
    styles: string[],
    fitPreference: string,
    colorPalette: string
  ) => void;
  // State variables for dynamic local form entries
  editedNickname: string;
  setEditedNickname: (val: string) => void;
  editedGender: "Male" | "Female" | "None";
  setEditedGender: (val: "Male" | "Female" | "None") => void;
  editedStyles: string[];
  setEditedStyles: (styles: string[]) => void;
  editedFitPreference: string;
  setEditedFitPreference: (val: string) => void;
  editedColorPalette: string;
  setEditedColorPalette: (val: string) => void;
}

export default function ProfileEditTab({
  profile,
  styleUpdateSuccess,
  handleSaveStylePreferences,
  editedNickname,
  setEditedNickname,
  editedGender,
  setEditedGender,
  editedStyles,
  setEditedStyles,
  editedFitPreference,
  setEditedFitPreference,
  editedColorPalette,
  setEditedColorPalette
}: ProfileEditTabProps) {

  const handleStyleToggle = (styleOpt: string) => {
    const styleCode = resolveGarmentStyleCode(styleOpt);
    if (editedStyles.map(resolveGarmentStyleCode).includes(styleCode)) {
      setEditedStyles(editedStyles.filter((s) => resolveGarmentStyleCode(s) !== styleCode));
    } else {
      setEditedStyles([...editedStyles, styleCode]);
    }
  };

  const handleApplyPreset = (genderPreset: "Male" | "Female" | "None") => {
    setEditedGender(genderPreset);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. Header label block */}
      <div className="space-y-1 text-left">
        <h3 className="text-base font-extrabold text-[#0284C7] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0284C7]" />
          <span>성향 및 스타일 수정 스튜디오</span>
        </h3>
        <p className="text-xs text-slate-400">
          설정값을 수정하시면 감각이 AI 로봇의 OOTD 제안 무브먼트 인덱스 및 홈 화면의 추천 옷들이 실시간 자동 정합 갱신됩니다.
        </p>
      </div>

      {/* 2. Success dynamic status callback banner */}
      {styleUpdateSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold tracking-wide animate-pulse text-left flex items-center gap-2.5 shadow-3xs">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 font-bold shrink-0" />
          <span>🎉 스타일 설정 정보가 완벽히 저장되었습니다. 마운팅된 홈 큐레이터 정보 동결을 해제하고 전격 빌드 완료했습니다!</span>
        </div>
      )}

      {/* 3. Main Form Canvas */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 md:p-6 space-y-5 text-left shadow-sm">
        
        {/* Nickname modification */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-black text-slate-500 uppercase block tracking-wider">닉네임 변경</label>
          <input
            type="text"
            value={editedNickname}
            onChange={(e) => setEditedNickname(e.target.value)}
            className="w-full h-11 px-4 border border-slate-200 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] text-xs rounded-xl bg-slate-50/50 outline-hidden font-bold tracking-wide transition"
            placeholder="자신을 규정할 새로운 패션 닉네임"
          />
        </div>

        {/* Gender Choice Segment */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-black text-slate-500 uppercase block tracking-wider">성별 경향성 최적화</label>
          <div className="grid grid-cols-3 gap-2.5">
            {(["Male", "Female", "None"] as const).map((gOpt) => {
              const isActive = editedGender === gOpt;
              const labelMap: Record<string, string> = {
                Male: "남성 (Male)",
                Female: "여성 (Female)",
                None: "경계없음 (Unisex)"
              };
              return (
                <button
                  key={gOpt}
                  type="button"
                  onClick={() => handleApplyPreset(gOpt)}
                  className={`h-11 border text-xs font-bold rounded-xl transition cursor-pointer select-none ${
                    isActive
                      ? "bg-[#0284C7] text-white border-transparent shadow-xs"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {labelMap[gOpt]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Style selection grid */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-black text-slate-500 uppercase block tracking-wider">추구하는 가중 패션 장르 (복수 지정)</label>
          <div className="flex flex-wrap gap-2 select-none">
            {GARMENT_STYLES.map((style) => {
              const isSelected = editedStyles.map(resolveGarmentStyleCode).includes(style.code);
              return (
                <button
                  key={style.code}
                  type="button"
                  onClick={() => handleStyleToggle(style.code)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold border transition duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#BBF7D0] text-[#0284C7] border-transparent scale-102 font-extrabold"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {getGarmentStyleLabel(style.code)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customized silhouette dropdown panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-black text-slate-500 uppercase block tracking-wider">핏 레이아웃 선호도 (Fit Preference)</label>
            <select
              value={editedFitPreference}
              onChange={(e) => setEditedFitPreference(e.target.value)}
              className="w-full h-11 border border-slate-200 text-xs rounded-xl bg-slate-50/50 px-3 font-bold outline-hidden cursor-pointer"
            >
              <option value="슬림 피티드">슬림 피티드 (Slim Fitted)</option>
              <option value="레귤러 베이직">레귤러 베이직 (Regular Basic)</option>
              <option value="여유로운 세미오버">여유로운 세미오버 (Semi Oversized)</option>
              <option value="루즈 와이드핏">루즈 와이드핏 (Loose Wide)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] font-black text-slate-500 uppercase block tracking-wider">추천 컬러 팔레트</label>
            <select
              value={editedColorPalette}
              onChange={(e) => setEditedColorPalette(e.target.value)}
              className="w-full h-11 border border-slate-200 text-xs rounded-xl bg-slate-50/50 px-3 font-bold outline-hidden cursor-pointer"
            >
              <option value="시크한 모노톤">시크한 모노톤 (Chic Mono)</option>
              <option value="차분한 웜톤">차분한 웜톤 (Warm Earth)</option>
              <option value="생기 넘치는 원색">생기 넘치는 원색 (Vivid Colors)</option>
              <option value="부드러운 파스텔">부드러운 파스텔 (Soft Pastel)</option>
            </select>
          </div>
        </div>

        {/* Sync trigger submit button */}
        <button
          type="button"
          onClick={() =>
            handleSaveStylePreferences(
              editedNickname,
              editedGender,
              editedStyles,
              editedFitPreference,
              editedColorPalette
            )
          }
          className="w-full h-12 bg-[#0284C7] text-[#BBF7D0] hover:bg-[#0369a1] text-xs font-black rounded-xl tracking-wider uppercase transition shadow-sm cursor-pointer select-none"
        >
          저장하고 실시간 알고리즘에 전격 연동하기
        </button>

      </div>

    </div>
  );
}
