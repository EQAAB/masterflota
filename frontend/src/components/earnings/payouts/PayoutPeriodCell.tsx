import type { PayoutListItem } from "../../../api/earnings";
import { HighlightText } from "./HighlightText";
import { formatPayoutPeriodDisplay } from "./payoutRowUtils";

type PayoutPeriodCellProps = {
  row: PayoutListItem;
  query: string;
};

export function PayoutPeriodCell({ row, query }: PayoutPeriodCellProps) {
  const { dateLine, secondaryLine } = formatPayoutPeriodDisplay(row);

  return (
    <div className="min-w-[7.5rem] max-w-[10rem]">
      <div className="text-sm font-medium text-ink leading-snug whitespace-nowrap">
        <HighlightText text={dateLine} query={query} />
      </div>
      <div className="text-xs text-ink-muted truncate">
        <HighlightText text={secondaryLine} query={query} />
      </div>
    </div>
  );
}
