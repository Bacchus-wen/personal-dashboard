import type { SVGProps } from "react";
import type { NavId } from "@/data/site-content";

type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

export function NavIcon({ name, ...props }: IconProps & { name: NavId }) {
  const shapes: Record<NavId, React.ReactNode> = {
    home: <><path d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" /><path d="M9 20v-6h6v6" /></>,
    articles: <><path d="M6 3h11a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z" /><path d="M8 7h7M8 11h7M8 15h5" /></>,
    projects: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    about: <><circle cx="12" cy="12" r="8" /><path d="M8.5 13.5c1.8 1.8 5.2 1.8 7 0M9 9.5h.01M15 9.5h.01" /></>,
    resources: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />,
    blogs: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  };
  return <svg {...base} {...props}>{shapes[name]}</svg>;
}

export function SunIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><circle cx="12" cy="12" r="4" /></svg>;
}

export function UpIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 15 6-6 6 6" /></svg>;
}
