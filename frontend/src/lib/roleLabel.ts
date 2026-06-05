export function roleLabel(role: string | undefined): string {
  if (!role) return "User";
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Administrator";
  if (role === "accountant") return "Accountant";
  if (role === "manager") return "Manager";
  if (role === "viewer") return "Viewer";
  if (role === "driver") return "Driver";
  return role.replace(/_/g, " ");
}
