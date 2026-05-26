import { StatusBadge } from "../../theme/StatusBadge";
import { HighlightText } from "./HighlightText";

type PayoutStatusBadgeProps = {
  status: string;
  highlightQuery?: string;
};

export function PayoutStatusBadge({ status, highlightQuery = "" }: PayoutStatusBadgeProps) {
  return (
    <StatusBadge status={status}>
      <HighlightText text={status} query={highlightQuery} />
    </StatusBadge>
  );
}
