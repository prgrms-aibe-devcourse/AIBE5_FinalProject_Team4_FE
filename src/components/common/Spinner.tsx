interface SpinnerProps{
    message: string;
}

function Spinner({message = "로딩 중..."}: SpinnerProps) {
    return <div>{message}</div>
}
export default Spinner;