export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 4) return "fair";
  if (score <= 5) return "good";
  return "strong";
}

export function strengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
  }
}

export function strengthBarPercent(strength: PasswordStrength): number {
  switch (strength) {
    case "weak":
      return 25;
    case "fair":
      return 50;
    case "good":
      return 75;
    case "strong":
      return 100;
  }
}

export function strengthBarClass(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "bg-rose-400";
    case "fair":
      return "bg-amber-400";
    case "good":
      return "bg-emerald-400";
    case "strong":
      return "bg-teal-600";
  }
}
