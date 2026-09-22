import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>
)
export const IconBook = (p: P) => (
  <svg {...base(p)}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></svg>
)
export const IconChart = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
)
export const IconGear = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" /></svg>
)
export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>
)
export const IconSound = (p: P) => (
  <svg {...base(p)}><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" fill="currentColor" stroke="none" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18 6a9 9 0 0 1 0 12" /></svg>
)
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M4.5 12.5l5 5L19.5 6.5" /></svg>
)
export const IconClose = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
)
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M9 4h6l-1 6 2.5 2.5H7.5L10 10z" /><path d="M12 12.5V20" /></svg>
)
export const IconFlame = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5c1 3-2.5 4.5-2.5 8A4 4 0 0 0 16 13.5c0-.8-.2-1.6-.6-2.2 1.4 1.4 2.1 3 2.1 4.7a6.5 6.5 0 1 1-13 0C4.5 10.5 8.5 10 12 2.5z" /></svg>
)
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>
)
export const IconTrophy = (p: P) => (
  <svg {...base(p)}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3" /><path d="M17 5h3v2a3 3 0 0 1-3 3" /><path d="M12 14v3.5" /><path d="M8.5 20h7" /></svg>
)
export const IconRefresh = (p: P) => (
  <svg {...base(p)}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 3v4h-4" /></svg>
)
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6.5 7l1 13h9l1-13" /></svg>
)
