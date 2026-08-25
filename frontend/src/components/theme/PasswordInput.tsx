import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { input, sectionLabel } from "../../theme/classNames";
import { generateStrongPassword } from "../../utils/generateStrongPassword";
import {
  getPasswordStrength,
  strengthBarClass,
  strengthBarPercent,
  strengthLabel,
} from "../../utils/passwordStrength";

type PasswordInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  showStrength?: boolean;
  helperText?: string;
  className?: string;
};

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="fm-password-input__action-btn"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  showStrength = true,
  helperText,
  className,
}: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = getPasswordStrength(value);

  const handleGenerate = useCallback(() => {
    const pwd = generateStrongPassword();
    onChange(pwd);
    setVisible(true);
  }, [onChange]);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={sectionLabel}>
          {label}
          {required ? " *" : ""}
        </label>
      )}
      <div className="fm-password-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${input} fm-password-input__field`}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
        />
        <div className="fm-password-input__actions">
          <IconButton
            label={visible ? t("common.hidePassword") : t("common.showPassword")}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </IconButton>
          <IconButton label={t("common.generateStrongPassword")} onClick={handleGenerate}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </IconButton>
          <IconButton label={t("common.copyPassword")} onClick={handleCopy} disabled={!value}>
            {copied ? (
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </IconButton>
        </div>
      </div>
      {copied && <p className="mt-1 text-xs text-emerald-700">{t("common.copiedToClipboard")}</p>}
      {helperText && <p className="mt-1 text-xs text-ink-muted">{helperText}</p>}
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">{t("common.passwordStrength")}</span>
            <span className="font-medium text-ink">{strengthLabel(strength)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${strengthBarClass(strength)}`}
              style={{ width: `${strengthBarPercent(strength)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
