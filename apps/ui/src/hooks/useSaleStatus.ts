import { useEffect, useState, useCallback } from "react";
import type { SaleStatusResponse } from "../types/legacySchemas";
import { getSaleStatus, isApiError } from "../lib/api";

function saleStatusApiToResponse(api: Awaited<ReturnType<typeof getSaleStatus>>): SaleStatusResponse {
  return {
    status: api.status,
    remainingStock: api.availableStock,
    sale: {
      sku: api.sku,
      startTime: api.startDate,
      endTime: api.endDate,
      salePrice: api.price,
      originalPrice: api.price,
      maxPerUser: api.limitPerUser,
      totalStock: api.totalStock,
      snapshot: {
        name: api.name,
        description: api.description ?? "",
        imageUrl: api.imageUrl ?? "",
      },
    },
  };
}

export function useSaleStatus(sku: string, pollIntervalMs = 2000) {
  const [data, setData] = useState<SaleStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const api = await getSaleStatus(sku);
      setData(saleStatusApiToResponse(api));
      setError(null);
    } catch (err) {
      if (isApiError(err) && err.statusCode === 404) {
        setData(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
      }
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchStatus, pollIntervalMs]);

  return { data, error, loading, refetch: fetchStatus };
}
