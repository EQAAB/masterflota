import { StatusBadge } from "../../theme/StatusBadge";
import { HighlightText } from "./HighlightText";

type PayoutStatusBadgeProps = {
  status: string;
  highlightQuery?: string;
};

export function PayoutStatusBadge({ status, highlightQuery = "" }: PayoutStatusBadgeProps) {
  return (
    <StatusBadge status={status} className="!px-2.5 !py-1 !text-[11px] !font-semibold ring-1 ring-inset ring-black/5">
      <HighlightText text={status} query={highlightQuery} />
    </StatusBadge>
  );
}
