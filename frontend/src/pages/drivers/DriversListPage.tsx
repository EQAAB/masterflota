import { useQuery } from "@tanstack/react-query";
import { getDrivers } from "../../api/drivers";
import { DriversList } from "../../components/drivers/DriversList";
import { useListSort } from "../../hooks/useListSort";

export function DriversListPage() {
  const { sortParams, getHeaderProps } = useListSort();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers", "list", sortParams],
    queryFn: async () => {
      const { data: rows } = await getDrivers({
        limit: 10_000,
        ...(sortParams ?? {}),
      });
      return rows;
    },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated">
      <DriversList
        drivers={data}
        isLoading={isLoading}
        isError={isError}
        getHeaderProps={getHeaderProps}
      />
    </div>
  );
}
