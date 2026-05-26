import { card, tableHeader, tableWrap } from "../../theme/classNames";

type DataTableProps = {
  children: React.ReactNode;
  className?: string;
  wrapClassName?: string;
};

export function DataTable({ children, className = "", wrapClassName = "" }: DataTableProps) {
  return (
    <div className={`${card} overflow-hidden p-0 ${className}`}>
      <div className={`${tableWrap} ${wrapClassName}`}>
        <table className="min-w-full text-sm text-left">{children}</table>
      </div>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return <thead className={tableHeader}>{children}</thead>;
}

export function DataTableBody({
  children,
  className = "divide-y divide-border",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={className}>{children}</tbody>;
}
