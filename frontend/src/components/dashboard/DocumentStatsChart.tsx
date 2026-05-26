import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_SUCCESS, CHART_WARNING } from "./chartPalette";
import { EmptyState } from "../theme/EmptyState";
import { ChartEmptyIllustration } from "./illustrations/ChartEmptyIllustration";

export interface DocumentStatsItem {
  documentType: string;
  total: number;
  verified: number;
  pending: number;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  trc_card: "TRC Card",
  drivers_license: "License",
  contract: "Contract",
  insurance: "Insurance",
  vehicle_permit: "Permit",
  passport: "Passport",
  other: "Other",
};

export function DocumentStatsChart({ data }: { data: DocumentStatsItem[] }) {
  const chartData = data.map((d) => ({
    name: DOC_TYPE_LABELS[d.documentType] ?? d.documentType,
    verified: d.verified,
    pending: d.pending,
    total: d.total,
  }));
  if (chartData.every((d) => d.total === 0)) {
    return (
      <EmptyState
        title="No document data"
        description="Upload and verify driver documents to see stats here."
        illustration={<ChartEmptyIllustration className="w-20 h-20" />}
        className="border-0 bg-transparent py-6"
      />
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
        <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="verified" fill={CHART_SUCCESS} name="Verified" stackId="a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" fill={CHART_WARNING} name="Pending" stackId="a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
