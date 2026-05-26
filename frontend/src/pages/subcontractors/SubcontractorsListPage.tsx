import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { getSubcontractors } from "../../api/subcontractors";
import { SubcontractorsList } from "../../components/subcontractors/SubcontractorsList";

export function SubcontractorsListPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => getSubcontractors().then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6">
        <p className="text-ink-muted">You do not have access.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <SubcontractorsList subcontractors={data} isLoading={isLoading} isError={isError} />
    </div>
  );
}
