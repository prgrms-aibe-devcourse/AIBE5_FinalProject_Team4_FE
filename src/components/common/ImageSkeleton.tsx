interface ImgSkeletonProps {
    src: string;
    alt?: string;
}

function ImageSkeleton({src, alt}: ImgSkeletonProps) {
    const[isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {!isLoaded && <div>이미지 로딩 중...</div>}
            <img src={src} alt={alt} onLoad={() => setIsLoaded(true)} />
        </>
    );
}