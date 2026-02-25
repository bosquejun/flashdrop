import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import type { OrderCheckResponse } from "../types/api";

export function useOrderCheck(sku: string | undefined, userId: string | undefined, enabled = true) {
  const [data, setData] = useState<OrderCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkOrder = useCallback(async () => {
    if (!sku || !userId || !enabled) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<OrderCheckResponse>(`/api/sale/${sku}/order/${userId}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check order status");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [sku, userId, enabled]);

  useEffect(() => {
    checkOrder();
    // Poll every 5 seconds if enabled
    if (enabled && sku && userId) {
      const interval = setInterval(checkOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [checkOrder, enabled, sku, userId]);

  return { data, error, loading, refetch: checkOrder };
}
