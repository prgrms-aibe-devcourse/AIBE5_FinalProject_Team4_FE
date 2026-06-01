import { useState, useEffect } from 'react';
import api from '../api';

interface UseApiResult<T>{
    data: T | null;
    loading: boolean;
    error: string | null;
}

function useApi<T>(url: string): UseApiResult<T>{
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async() => {
            try{
                setLoading(true);
                const response = await api.get<T>(url);
                setData(response.data);
            } catch(err) {
                setError('데이터를 불러오는데 실패했습니다');
            } finally {
                setLoading(false); // 성공이든 실패든 로딩 끝
            }
        };
        fetchData();
    }, [url]); // url이 바뀔때마다 다시 실행

    return {data, loading, error};
}
export default useApi;
