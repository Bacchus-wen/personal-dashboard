import type { SVGProps } from "react";
import type { NavId } from "@/data/site-content";

type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

export function NavIcon({ name, ...props }: IconProps & { name: NavId }) {
  const shapes: Record<NavId, React.ReactNode> = {
    home: <><path d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" /><path d="M9 20v-6h6v6" /></>,
    plans: <><path d="M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="m9 9 1.5 1.5L14 7M9 15h6" /></>,
    works: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 7h.01M10 7h.01M13 7h.01" /></>,
    projects: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    about: <><circle cx="12" cy="12" r="8" /><path d="M8.5 13.5c1.8 1.8 5.2 1.8 7 0M9 9.5h.01M15 9.5h.01" /></>,
    collections: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 5.5v15M9 7h6M9 11h6" /></>,
  };
  return <svg {...base} {...props}>{shapes[name]}</svg>;
}

export function SunIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><circle cx="12" cy="12" r="4" /></svg>;
}

export function UpIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 15 6-6 6 6" /></svg>;
}

export function AdminIcon(props: IconProps) {
  return <svg {...base} {...props}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>;
}

export function MoonIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5Z" /></svg>;
}

export function WavesIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></svg>;
}
