import { useNavigate } from "react-router-dom";

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <p className="text-8xl font-black text-red-300 mb-4">500</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">서버에 문제가 생겼어요</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">
        일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-red-400 hover:bg-red-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          새로고침
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
