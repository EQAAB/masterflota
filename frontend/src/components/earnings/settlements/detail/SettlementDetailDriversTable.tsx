import type { SubcontractorSettlementDetailDriver } from "../../../../api/subcontractorPayouts";
import { formatCurrency } from "../../../../utils/currency";
import { transitionDefault } from "../../../../theme/classNames";
import { moneyAccentClass } from "./settlementDetailDisplayUtils";

type FooterTotals = {
  gross: number;
  tips: number;
  commission: number;
  vehicle_rent: number;
  account_opening_fee: number;
  platform_fees: number;
  daily_cash: number;
  custom_deductions: number;
  custom_additions: number;
  net: number;
};

function MoneyCell({
  amount,
  accentNegative = false,
  className = "",
}: {
  amount: number;
  accentNegative?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`tabular-nums whitespace-nowrap ${moneyAccentClass(amount, accentNegative)} ${className}`}
      style={{ fontFeatureSettings: '"tnum"' }}
    >
      {formatCurrency(amount)}
    </span>
  );
}

const thClass =
  "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap";
const tdClass = "px-2.5 py-2.5 text-sm align-middle";

type SettlementDetailDriversTableProps = {
  drivers: SubcontractorSettlementDetailDriver[];
  footer: FooterTotals;
};

export function SettlementDetailDriversTable({ drivers, footer }: SettlementDetailDriversTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-soft ${transitionDefault}`}
    >
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">Driver breakdown</h2>
        <p className="mt-0.5 text-xs text-slate-500">Per-driver earnings and deductions for this settlement.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-[#F8FAFC] text-left">
            <tr>
              <th className={thClass}>Driver</th>
              <th
                className={`${thClass} text-right`}
                title="Sum of driver gross earnings (income + tips). Tips column is separate."
              >
                Gross incl. tips
              </th>
              <th className={`${thClass} text-right`}>Tips</th>
              <th className={`${thClass} text-right`}>Commission</th>
              <th className={`${thClass} text-right`}>Vehicle rent</th>
              <th className={`${thClass} text-right`}>Acct. fee</th>
              <th className={`${thClass} text-right`}>Platform fee</th>
              <th className={`${thClass} text-right`}>Daily cash</th>
              <th className={`${thClass} text-right`}>Custom ded.</th>
              <th className={`${thClass} text-right`}>Custom add.</th>
              <th className={`${thClass} text-right`}>Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {drivers.map((d) => (
              <tr
                key={d.id}
                className="bg-white transition-colors duration-150 hover:bg-slate-50/80"
              >
                <td className={`${tdClass} font-medium text-slate-900`}>{d.name || "—"}</td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.gross)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.tips)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.commission)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.vehicle_rent)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.account_opening_fee)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.platform_fees)} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.daily_cash)} accentNegative />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.custom_deductions)} accentNegative />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={Number(d.custom_additions)} />
                </td>
                <td className={`${tdClass} text-right font-medium`}>
                  <MoneyCell amount={Number(d.net)} />
                </td>
              </tr>
            ))}
          </tbody>
          {drivers.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-semibold text-slate-900">
              <tr>
                <td className={`${tdClass} text-slate-800`}>Total</td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.gross} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.tips} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.commission} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.vehicle_rent} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.account_opening_fee} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.platform_fees} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.daily_cash} accentNegative />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.custom_deductions} accentNegative />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.custom_additions} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <MoneyCell amount={footer.net} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {drivers.length === 0 && (
        <p className="border-t border-slate-100 p-4 text-sm text-slate-500">
          No driver payouts linked to this settlement. Run Refresh settlements on the list page.
        </p>
      )}
    </div>
  );
}
