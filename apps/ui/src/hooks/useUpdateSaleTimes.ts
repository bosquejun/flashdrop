import { useState, useCallback } from "react";
import { apiFetch } from "../lib/api";

interface UpdateResult {
  success: boolean;
  message: string;
  sale?: { _id: string; startTime: string; endTime: string };
}

export function useUpdateSaleTimes() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);

  const updateTimes = useCallback(
    async (saleId: string, times: { startTime?: string; endTime?: string }) => {
      setLoading(true);
      setResult(null);
      try {
        const res = await apiFetch<UpdateResult>(
          `/api/sale/${saleId}/times`,
          { method: "PATCH", body: JSON.stringify(times) },
        );
        setResult(res);
      } catch (err) {
        setResult({
          success: false,
          message: err instanceof Error ? err.message : "Failed to update",
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => setResult(null), []);

  return { loading, result, updateTimes, reset };
}
