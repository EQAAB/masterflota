type FleetManagerLogoMarkProps = {
  className?: string;
  title?: string;
};

/** Sidebar + favicon brand mark — rounded tile with “FM” on teal. */
export function FleetManagerLogoMark({ className = "h-9 w-9", title = "Fleet Manager" }: FleetManagerLogoMarkProps) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="8" fill="#003D38" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
      >
        FM
      </text>
    </svg>
  );
}
