import {
  btnDangerOutline,
  btnGhost,
  btnPrimary,
  btnSecondary,
  transitionDefault,
} from "../../theme/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: btnPrimary,
  secondary: btnSecondary,
  ghost: btnGhost,
  danger: btnDangerOutline,
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "",
};

export function PrimaryButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${sizeClass[size]} ${transitionDefault} ${className}`.trim()}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
