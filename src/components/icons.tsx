// Small inline icon set — kept local rather than pulling in an icon
// library for a handful of glyphs used once each.
export function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-5h-5v5H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
export function IconClassroom(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="4" width="14" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 17h6M10 13v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function IconAssignments(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="4" y="3" width="12" height="14" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function IconExams(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M6 3h8l2 2v12H4V3h2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 9.5 9 11l3.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconLibrary(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M4 4h4v13H4V4ZM12 4h4v13h-4V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
export function IconHelp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8a2 2 0 1 1 2.6 1.9c-.6.2-1.1.7-1.1 1.4v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="13.7" r="0.9" fill="currentColor" />
    </svg>
  );
}
export function IconBack(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconMinus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
export function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
export function IconChevron(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M10 3.5c-2 0-3.5 1.6-3.5 3.7v2.2c0 .5-.2 1-.6 1.4L5 11.8v.7h10v-.7l-.9-1c-.4-.4-.6-.9-.6-1.4V7.2c0-2.1-1.5-3.7-3.5-3.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.3 14.5a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
export function IconSparkle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M10 2.5c.4 2.7 1 4.4 2 5.5s2.8 1.6 5.5 2c-2.7.4-4.4 1-5.5 2s-1.6 2.8-2 5.5c-.4-2.7-1-4.4-2-5.5s-2.8-1.6-5.5-2c2.7-.4 4.4-1 5.5-2s1.6-2.8 2-5.5Z" />
    </svg>
  );
}
export function IconPanel(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4v12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
export function TeacherIllustration(props: React.SVGProps<SVGSVGElement>) {
  // A simple, friendly illustrated avatar — deliberately not a photo of a
  // real or fabricated person.
  return (
    <svg viewBox="0 0 96 96" fill="none" {...props}>
      <circle cx="48" cy="48" r="46" fill="var(--accent-soft)" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <circle
          key={deg}
          cx={48 + 44 * Math.cos((deg * Math.PI) / 180)}
          cy={48 + 44 * Math.sin((deg * Math.PI) / 180)}
          r="3"
          fill="var(--accent)"
        />
      ))}
      <circle cx="48" cy="48" r="34" fill="white" />
      <circle cx="48" cy="40" r="13" fill="var(--accent)" opacity="0.85" />
      <path d="M22 78c3-14 12-22 26-22s23 8 26 22" fill="var(--accent)" opacity="0.85" />
    </svg>
  );
}
