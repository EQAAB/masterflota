type FleetManagerLogoMarkProps = {
  className?: string;
  title?: string;
  monogram?: string;
};

/** Sidebar + login brand mark — rounded tile with monogram on teal. */
export function FleetManagerLogoMark({
  className = "h-9 w-9",
  title,
  monogram,
}: FleetManagerLogoMarkProps) {
  const label = title ?? "Fleet Manager";
  const letters = (monogram ?? "FM").slice(0, 3).toUpperCase();
  const fontSize = letters.length > 2 ? "9" : "11";
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
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
        fontSize={fontSize}
        fontWeight="700"
      >
        {letters}
      </text>
    </svg>
  );
}
