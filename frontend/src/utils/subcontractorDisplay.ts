import type { Subcontractor } from "../api/subcontractors";

export type SubcontractorAvatarTone = "green" | "blue" | "orange" | "purple" | "gray";

const AVATAR_TONES: SubcontractorAvatarTone[] = ["green", "blue", "orange", "purple", "gray"];

const AVATAR_TONE_CLASSES: Record<SubcontractorAvatarTone, string> = {
  green: "bg-success/10 text-success",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-warning/10 text-warning",
  purple: "bg-purple-100 text-purple-700",
  gray: "bg-surface text-ink-muted ring-1 ring-border",
};

export function subcontractorAvatarTone(id: string): SubcontractorAvatarTone {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? "green";
}

export function subcontractorAvatarClass(tone: SubcontractorAvatarTone): string {
  return AVATAR_TONE_CLASSES[tone];
}

export function subcontractorInitials(legalName: string): string {
  const parts = legalName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !/^&+$/.test(p));
  if (parts.length === 0) return "?";
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  const word = parts[0];
  return word.length >= 2 ? word.slice(0, 2).toUpperCase() : word.toUpperCase();
}

export function formatSubcontractorDisplayId(
  sub: Pick<Subcontractor, "id" | "registration_number">,
  index?: number,
): string {
  const reg = sub.registration_number?.trim();
  if (reg) return reg.startsWith("SUB-") ? reg : `SUB-${reg}`;
  if (index !== undefined) return `SUB-${1001 + index}`;
  return `SUB-${sub.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export function formatJoinedDate(createdAt: string | null | undefined): string {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDriverCount(count: number | undefined | null): string {
  const n = count ?? 0;
  return `${n}${n === 1 ? "" : "s"}`;
}

export function formatKpiCount(value: number): string {
  return value.toString().padStart(2, "0");
}
