import { useState, useRef, useEffect } from 'react';

export function useChat() {
    const [gamyagiChatOpen, setGamyagiChatOpen] = useState<boolean>(false);
    const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "gamyagi"; text: string }>>([
        {
            sender: "gamyagi",
            text: "삐리빅-! 반가워요! 당신의 스타일 선호도와 감성에 어울리는 최적의 의류 조화를 제안하는 AI 패션 매칭 로봇 '감각이' 입니다 🤖💚. 천편일률적 추천 대신, 소장하신 옷들에 어우러지는 단 하나의 매치 스타일 솔루션을 머신 가이드해 드릴게요!"
        }
    ]);
    const [pendingMsg, setPendingMsg] = useState<string>("");
    const [chatSending, setChatSending] = useState<boolean>(false);

    // 최신 chatMessages를 항상 참조하기 위한 ref
    const chatMessagesRef = useRef(chatMessages);
    useEffect(() => {
        chatMessagesRef.current = chatMessages;
    }, [chatMessages]);

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
                    // 클로저 캡처 대신 ref로 최신 배열 참조
                    history: chatMessagesRef.current.map((m) => ({
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

    return { gamyagiChatOpen, setGamyagiChatOpen, chatMessages, pendingMsg, setPendingMsg, chatSending, handleSendChatToMD };
}
