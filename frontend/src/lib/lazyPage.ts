import { lazy, type ComponentType } from "react";

/** Lazy-load a named export from a page module (route code-splitting). */
export function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<Record<string, T>>,
  exportName: string,
) {
  return lazy(() => factory().then((m) => ({ default: m[exportName] as T })));
}
