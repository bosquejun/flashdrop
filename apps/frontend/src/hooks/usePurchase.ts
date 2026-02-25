import { useCallback, useState } from "react";
import type { PurchaseResponse } from "../types/api";

export function usePurchase() {
  const [result, setResult] = useState<PurchaseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (userId: string, sku: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000"}/api/sale/purchase`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, sku }),
        }
      );

      const data = (await res.json()) as PurchaseResponse;

      if (!res.ok) {
        // Only set error, result will contain the error message
        setError(data.message || "Purchase failed");
        setResult(data);
      } else {
        setResult(data);
        setError(null); // Clear any previous errors on success
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Purchase failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, purchase, reset };
}
