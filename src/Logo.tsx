interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Open-book / ruled-ledger mark. Drawn in currentColor so it inherits
 * whichever text color the caller sets (--ink in the landing header,
 * --accent if used somewhere accented). Purely decorative: it always sits
 * beside a text wordmark that carries the accessible name.
 */
function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="26" height="22" rx="3" stroke="currentColor" strokeWidth="2.4" />
      <line x1="8" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="8" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default Logo;
