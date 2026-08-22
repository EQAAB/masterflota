import i18n from "../i18n";

const ROLE_KEYS = [
  "super_admin",
  "admin",
  "accountant",
  "manager",
  "viewer",
  "driver",
] as const;

export function roleLabel(role: string | undefined): string {
  if (!role) return i18n.t("roles.user");
  if ((ROLE_KEYS as readonly string[]).includes(role)) {
    return i18n.t(`roles.${role}`);
  }
  return role.replace(/_/g, " ");
}
