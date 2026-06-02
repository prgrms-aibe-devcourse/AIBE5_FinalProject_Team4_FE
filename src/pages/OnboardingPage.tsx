import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState("");
    const [birthday, setBirthday] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "None">("None");

    const [nicknameError, setNicknameError] = useState("");
    const [birthdayError, setBirthdayError] = useState("");
    const [genderError, setGenderError] = useState("");

    const [styles, setStyles] = useState<string[]>([]);

    const handleNext = () => {
        let hasError = false;

        if (nickname === ""){
            setNicknameError("닉네임을 입력해주세요");
            hasError = true;
        } else {
            setNicknameError(""); // 정상이면 에러 초기화
        }

        if (birthday === ""){
            setBirthdayError("생년월일을 입력해주세요");
            hasError = true;
        } else {
            setBirthdayError(""); // 정상이면 에러 초기화
        }

        if (gender === "None"){
            setGenderError("성별을 선택해주세요");
            hasError = true;
        }


        if(!hasError){
            setStep(2);
        }
    }

    // 스타일을 클릭 시 발생하는 이벤트 핸들링
    const handleStyleToggle = (style: string) => {
        if(styles.includes(style)){
            // 해당 style을 선택 + 이미 있다면 해제한다.
            setStyles(styles.filter((s) => s !== style));
        } else {
            // 해당 style이 선택이 안되어 있다면, 배열을 펼쳐 추가한다.
            setStyles([...styles, style]);
        }
    }

    const navigate = useNavigate();

    return (
        <div>
            {step === 1 && <div>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력해주세요" />
                {nicknameError && <p>{nicknameError}</p>}
                <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                />
                {birthdayError && <p>{birthdayError}</p>}
                <button onClick={() => setGender("Male")}>남성</button>
                <button onClick={() => setGender("Female")}>여성</button>
                <button onClick={() => setGender("None")}>선택안함</button>
                {genderError && <p>{genderError}</p>}

                {/*다음 버튼*/}
                <button disabled={nickname === ""||birthday === ""||gender === "None"} onClick={handleNext}>다음</button>
            </div>}

            {/*스탭 2*/}
            {step === 2 && <div>
                <p>{nickname}님! 스타일을 선택해주세요</p>
                <div onClick={() => handleStyleToggle("Casual")}
                     className={styles.includes("Casual") ? "border-blue-500" : "border-gray-200"}>
                    <span>👕</span>
                    <p>캐주얼</p>
                    <p>편안하고 일상적인 스타일</p>
                </div>
                <div onClick={() => handleStyleToggle("Minimal")}
                     className={styles.includes("Minimal") ? "border-blue-500" : "border-gray-200"}>
                    <span>🖤</span>
                    <p>미니멀</p>
                    <p>단순하고 깔끔한 색감 위주</p>
                </div>
                <div onClick={() => handleStyleToggle("Street")}
                     className={styles.includes("Street") ? "border-blue-500" : "border-gray-200"}>
                    <span>🧢</span>
                    <p>스트리트</p>
                    <p>힙합/스케이트 문화에서 온 스타일</p>
                </div>
                <div onClick={() => handleStyleToggle("Amekaji")}
                     className={styles.includes("Amekaji") ? "border-blue-500" : "border-gray-200"}>
                    <span>🧥</span>
                    <p>아메카지</p>
                    <p>미국 빈티지 감성의 워크웨어</p>
                </div>
                <div onClick={() => handleStyleToggle("Gorpcore")}
                     className={styles.includes("Gorpcore") ? "border-blue-500" : "border-gray-200"}>
                    <span>🥾</span>
                    <p>고프코어</p>
                    <p>아웃도어 장비를 일상에서 착용</p>
                </div>
                <button disabled={styles.length < 3} onClick={() => setStep(3)}>다음</button>
            </div>}

            {/*스탭 3*/}
            {step === 3 && <div>
                <p>첫 번째 옷을 등록해볼까요?</p>
                <button onClick={() => navigate("/")}>옷 등록하기</button>
                <button onClick={() => navigate("/")}>지금은 건너뛰기</button>
            </div>}
        </div>
    );
}