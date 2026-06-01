import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <p className="text-8xl font-black text-indigo-300 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
