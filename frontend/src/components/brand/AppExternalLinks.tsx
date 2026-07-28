import { getAppBranding } from "../../lib/appBranding";

function externalLinkLabel(url: string, fallback: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return fallback;
  }
}

type AppExternalLinksProps = {
  className?: string;
  linkClassName?: string;
};

/** Footer links to product marketing site and company site (when configured). */
export function AppExternalLinks({ className = "", linkClassName = "" }: AppExternalLinksProps) {
  const { marketingUrl, companyName, companyUrl } = getAppBranding();
  const links: { href: string; label: string }[] = [];

  if (marketingUrl) {
    links.push({ href: marketingUrl, label: externalLinkLabel(marketingUrl, "Website") });
  }
  if (companyUrl && companyName) {
    links.push({ href: companyUrl, label: companyName });
  }

  if (links.length === 0) return null;

  const defaultLink =
    "text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded";

  return (
    <p className={`text-center text-xs text-ink-muted ${className}`.trim()}>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? <span className="mx-1.5 text-slate-300">·</span> : null}
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName || defaultLink}
          >
            {link.label}
          </a>
        </span>
      ))}
    </p>
  );
}
