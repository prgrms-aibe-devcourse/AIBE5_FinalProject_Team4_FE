import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const Icon = ({ className, children, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const Sparkles = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8L12 3Z" />
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  </Icon>
);

export const Sparkle = Sparkles;

export const Plus = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const Search = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const Heart = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20.8 8.6c0 5.4-8.8 10.4-8.8 10.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.1Z" />
  </Icon>
);

export const Home = (props: IconProps) => (
  <Icon {...props}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </Icon>
);

export const Check = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12 4 4L19 6" />
  </Icon>
);

export const Upload = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </Icon>
);

export const Camera = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 8h4l2-3h4l2 3h4v11H4V8Z" />
    <circle cx="12" cy="14" r="3.5" />
  </Icon>
);

export const X = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

export const MessageSquare = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 5h14v10H8l-3 3V5Z" />
  </Icon>
);

export const Send = (props: IconProps) => (
  <Icon {...props}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </Icon>
);

export const Bookmark = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 3h10v18-5-3-5 3V3Z" />
  </Icon>
);

export const MoreHorizontal = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Icon>
);

export const ChevronLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const Sliders = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="11" cy="18" r="2" />
  </Icon>
);

export const Activity = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </Icon>
);

export const FileText = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3h9l3 3v15H6V3Z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </Icon>
);

export const CloudRain = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 17a4 4 0 1 1 .8-7.9A6 6 0 0 1 19 11a3 3 0 0 1-1 5.8" />
    <path d="M8 20v1" />
    <path d="M12 19v1" />
    <path d="M16 20v1" />
  </Icon>
);

export const Info = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10v6" />
    <path d="M12 7h.01" />
  </Icon>
);

export const HelpCircle = Info;

export const TrendingUp = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 17 9 11l4 4 7-8" />
    <path d="M14 7h6v6" />
  </Icon>
);

export const Award = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="5" />
    <path d="m8.5 12.5-1 7 4.5-2 4.5 2-1-7" />
  </Icon>
);

export const Layers = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 16 9 5 9-5" />
  </Icon>
);

export const ShoppingBag = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 8h12l-1 13H7L6 8Z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </Icon>
);

export const Flame = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21a7 7 0 0 0 7-7c0-4-3-6-5-10-.5 3-2.5 4-4 5.5S8 12.5 8 14a4 4 0 0 0 4 7Z" />
  </Icon>
);

export const HeartHandshake = Heart;

export const User = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const Settings = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
    <path d="m4.9 4.9 2.1 2.1" />
    <path d="m17 17 2.1 2.1" />
    <path d="m19.1 4.9-2.1 2.1" />
    <path d="m7 17-2.1 2.1" />
  </Icon>
);

export const CheckCircle2 = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Icon>
);

export const RefreshCw = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 12a9 9 0 0 1-15.5 6.2" />
    <path d="M3 12A9 9 0 0 1 18.5 5.8" />
    <path d="M18 2v4h-4" />
    <path d="M6 22v-4h4" />
  </Icon>
);

export const AlertCircle = Info;

export const Shirt = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 4 4 6.5 2.5 10l4 2 1.5-2v10h8V10l1.5 2 4-2L20 6.5 16 4c-1 1-2.2 1.5-4 1.5S9 5 8 4Z" />
  </Icon>
);

export function ThumbsDown({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/>
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
        </svg>
    )
}

export const Trash2 = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </Icon>
);

export const Edit2 = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Icon>
);

export const Layout = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </Icon>
);
