import { useQuery } from "@tanstack/react-query";
import { getPayoutPlatformBreakdown } from "../../api/earnings";
import { formatCurrency } from "../../utils/currency";
import { earningsPlatformLabel } from "../../utils/earningsPlatformLabel";

type Props = {
  payoutId: string;
  enabled: boolean;
};

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function PayoutPlatformBreakdown({ payoutId, enabled }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["earnings", "payout-platform-breakdown", payoutId],
    queryFn: () => getPayoutPlatformBreakdown(payoutId).then((r) => r.data),
    enabled: enabled && Boolean(payoutId),
    staleTime: 60_000,
  });

  const platforms = data?.platforms ?? [];

  if (!enabled) return null;
  if (isLoading) {
    return <p className="mt-2 text-[11px] text-slate-500">Loading platform split…</p>;
  }
  if (isError) {
    return <p className="mt-2 text-[11px] text-red-700">Could not load platform breakdown.</p>;
  }
  if (platforms.length === 0) {
    return <p className="mt-2 text-[11px] text-slate-500">No per-platform earnings rows for this period.</p>;
  }

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold text-slate-800">By platform</p>
      <table className="mt-1 w-full max-w-md text-[11px]">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="py-1 pr-3 font-medium">Platform</th>
            <th className="py-1 pr-3 font-medium">Gross</th>
            <th className="py-1 pr-3 font-medium">Fees</th>
            <th className="py-1 font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {platforms.map((p) => (
            <tr key={p.platform} className="text-slate-800">
              <td className="py-0.5 pr-3">{earningsPlatformLabel(p.platform)}</td>
              <td className="py-0.5 pr-3">{formatCurrency(toNum(p.gross))}</td>
              <td className="py-0.5 pr-3">{formatCurrency(toNum(p.fees))}</td>
              <td className="py-0.5">{formatCurrency(toNum(p.net))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
