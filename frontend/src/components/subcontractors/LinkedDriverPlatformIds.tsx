import { useTranslation } from "react-i18next";
import {
  getFilledPlatformIds,
  type LinkedDriverPlatformFields,
} from "./linkedDriverPlatformIdUtils";

type LinkedDriverPlatformIdsProps = {
  driver: LinkedDriverPlatformFields;
  className?: string;
};

export function LinkedDriverPlatformIds({ driver, className = "" }: LinkedDriverPlatformIdsProps) {
  const { t } = useTranslation();
  const ids = getFilledPlatformIds(driver);

  if (ids.length === 0) {
    return (
      <p className={`text-xs text-slate-400 ${className}`.trim()}>
        {t("pages.subcontractorDetail.noPlatformIds")}
      </p>
    );
  }

  return (
    <ul className={`mt-1 flex flex-wrap gap-1 ${className}`.trim()}>
      {ids.map((p) => (
        <li
          key={`${p.platform}-${p.value}`}
          className="inline-flex max-w-full items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-border/80"
          title={`${p.label}: ${p.value}`}
        >
          <span className="shrink-0 text-slate-500">{p.label}</span>
          <span className="truncate font-mono text-slate-900">{p.value}</span>
        </li>
      ))}
    </ul>
  );
}
