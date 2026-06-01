import Spinner from "./Spinner";
import useApi from "../../hooks/useApi";

function LoadingWrapper() {
    const { data, loading, error } = useApi<string>('api/v1/categories');

    if (loading) return <Spinner />;
    if (error) return <div>{error}</div>;
    return <div>{data ?? ""}</div>;
}

export default LoadingWrapper;
