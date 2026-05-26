type IconCircleProps = {
  children: React.ReactNode;
  tint?: "brand" | "success" | "warning" | "danger" | "neutral";
  className?: string;
};

const tintClasses = {
  brand: "bg-brand-mint text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-surface text-ink-muted",
};

export function IconCircle({ children, tint = "brand", className = "" }: IconCircleProps) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tintClasses[tint]} ${className}`}
    >
      {children}
    </div>
  );
}
