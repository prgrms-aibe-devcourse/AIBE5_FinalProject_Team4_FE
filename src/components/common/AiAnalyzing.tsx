import {useEffect, useState} from "react";
import api from '../../api';

interface AiAnalyzingProps {
    photoId: string;
}

function AiAnalyzing({ photoId }: AiAnalyzingProps) {
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            const response = await api.get(`/api/v1/users/1/clothes/photos/${photoId}/draft`);
            if(response.data) return setIsCompleted(true);
            }, 2000);
        return () => clearInterval(interval);
    }, [])

    if (!isCompleted) return <div>"AI가 분석중입니다..."</div>
    return <div>"분석완료!"</div>
}