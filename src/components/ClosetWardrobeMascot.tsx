interface ClosetWardrobeMascotProps {
  className?: string
  showStar?: boolean
}

/** ClosetTab 히어로 배너 옆 옷장 마스코트 */
export default function ClosetWardrobeMascot({
  className = 'w-28 h-32 md:w-32 md:h-36',
  showStar = true,
}: ClosetWardrobeMascotProps) {
  return (
    <div
      className={`relative flex items-end justify-center select-none overflow-visible ${className}`}
    >
      {showStar ? (
        <div className="absolute top-0 right-0 w-[28%] aspect-square animate-bounce">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-amber-300"
            aria-hidden
          >
            <path
              d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
              fill="#FFF3A5"
              stroke="#334155"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      <svg
        className="w-full h-full drop-shadow-md"
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="15" y="10" width="70" height="100" rx="10" fill="#FFF" stroke="#334155" strokeWidth="2.5" />
        <line x1="50" y1="10" x2="50" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
        <rect x="20" y="85" width="28" height="18" rx="4" fill="#FFEAA7" stroke="#334155" strokeWidth="2" />
        <rect x="52" y="85" width="28" height="18" rx="4" fill="#FFEAA7" stroke="#334155" strokeWidth="2" />
        <circle cx="34" cy="94" r="2.5" fill="#334155" />
        <circle cx="66" cy="94" r="2.5" fill="#334155" />
        <rect x="44" y="40" width="3" height="16" rx="1.5" fill="#334155" />
        <rect x="53" y="40" width="3" height="16" rx="1.5" fill="#334155" />
        <circle cx="30" cy="35" r="2.2" fill="#334155" />
        <circle cx="40" cy="35" r="2.2" fill="#334155" />
        <circle cx="26" cy="39" r="3" fill="#FAA" />
        <circle cx="44" cy="39" r="3" fill="#FAA" />
        <path
          d="M 33,39 Q 35,42 37,39"
          stroke="#334155"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
