import { useNavigate } from "react-router-dom";

export default function NetworkErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <p className="text-6xl mb-4">📡</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">인터넷 연결을 확인해 주세요</h1>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
        서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3">
          <button
              onClick={() => window.location.reload()}
              className="bg-[#1E3A8A] hover:bg-[#172f72] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
              다시 시도
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
