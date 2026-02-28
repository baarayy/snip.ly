"use client";

/**
 * Snip.ly Logo — abstract link-chain / compressed-arrow mark.
 * Two interlocking rounded paths forming a stylised "S" that represents
 * URL compression.  Works on both light and dark backgrounds.
 */
export function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Snip.ly logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#982598" />
          <stop offset="100%" stopColor="#E491C9" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
      {/* Chain link / arrow abstraction */}
      <path
        d="M14 22l4-4 4 4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <path
        d="M22 18l4-4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M12 26c0-2.2 1.8-4 4-4h8c2.2 0 4-1.8 4-4v-4"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="26" cy="14" r="2" fill="white" />
      <circle cx="14" cy="26" r="2" fill="white" />
    </svg>
  );
}

export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Logo size={32} />
      <span className="text-lg font-bold tracking-tight">
        <span className="gradient-text">snip</span>
        <span className="text-brand-cream/60">.ly</span>
      </span>
    </div>
  );
}
