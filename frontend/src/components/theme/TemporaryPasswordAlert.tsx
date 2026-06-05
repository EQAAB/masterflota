import { useCallback, useState } from "react";
import { alertSuccess, btnSecondary } from "../../theme/classNames";

type TemporaryPasswordAlertProps = {
  password: string;
  onDismiss: () => void;
  heading?: string;
};

export function TemporaryPasswordAlert({
  password,
  onDismiss,
  heading = "User created successfully.",
}: TemporaryPasswordAlertProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [password]);

  return (
    <div className={`${alertSuccess} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
      <div>
        <p className="font-medium">{heading}</p>
        <p className="mt-1 text-sm">
          One-time password — copy now; it will not be shown again:{" "}
          <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-sm">{password}</code>
        </p>
        {copied && <p className="mt-1 text-xs text-emerald-800">Copied to clipboard</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" className={btnSecondary} onClick={handleCopy}>
          Copy password
        </button>
        <button type="button" className={btnSecondary} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
