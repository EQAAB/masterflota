import { useEffect, useState } from "react";
import { api } from "../lib/api";

type UseAuthenticatedImageUrlResult = {
  url: string | null;
  loading: boolean;
  error: boolean;
};

export function useAuthenticatedImageUrl(
  apiPath: string | null,
  enabled = true,
): UseAuthenticatedImageUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || !apiPath) {
      setUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    api
      .get<Blob>(apiPath, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiPath, enabled]);

  return { url, loading, error };
}
