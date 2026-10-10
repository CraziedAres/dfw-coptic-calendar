/** Thin-line Coptic cross: equal arms, each ending in three small knobs. Inherits currentColor. */
export function CopticCross({ size = 28, className }: { size?: number; className?: string }) {
  const knobs = (
    <g>
      <circle cx="21" cy="5.6" r="1.35" />
      <circle cx="24" cy="4" r="1.35" />
      <circle cx="27" cy="5.6" r="1.35" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M21 8 H27 V21 H40 V27 H27 V40 H21 V27 H8 V21 H21 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <g fill="currentColor">
        {knobs}
        <g transform="rotate(90 24 24)">{knobs}</g>
        <g transform="rotate(180 24 24)">{knobs}</g>
        <g transform="rotate(270 24 24)">{knobs}</g>
      </g>
    </svg>
  );
}

/** Horizontal rule with the cross centered — the site's one ornament. */
export function CrossRule() {
  return (
    <div className="cross-rule" role="separator">
      <span />
      <CopticCross size={18} />
      <span />
    </div>
  );
}
