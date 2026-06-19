interface FeedEmptyStateProps {
  onWriteClick?: () => void
}

export default function FeedEmptyState(_props: FeedEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#BBF7D0]/40 text-2xl">
        📸
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-black text-[#1E3A8A]">아직 공유된 코디가 없어요</h3>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">
          저장한 코디와 사진을 연결해 첫 코디를 올려보세요.
          <br />
          하단의 <strong>코디 업로드</strong> 버튼으로 시작할 수 있어요.
        </p>
      </div>
    </div>
  )
}
