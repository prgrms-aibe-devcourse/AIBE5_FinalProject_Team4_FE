import Spinner from "../common/Spinner";
import useApi from "../../hooks/useApi";


function LoadingWrapper() {
    const {data, loading, error} = useApi('api/v1/categories');

    if(loading) return <Spinner />;
    else if (error) return <div>{error}</div>;
    return <div>{data}</div>;
}