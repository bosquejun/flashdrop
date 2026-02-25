import { useEffect, useState, useCallback } from "react";
import type { LandingSaleData } from "../types/api";
import { getProduct, getSaleStatus, isApiError } from "../lib/api";

function mergeToLandingSaleData(
  statusData: Awaited<ReturnType<typeof getSaleStatus>>,
  product: Awaited<ReturnType<typeof getProduct>>
): LandingSaleData {
  return {
    ...statusData,
    _id: product._id,
    snapshot: {
      name: product.name,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
    },
    salePrice: product.price,
    originalPrice: product.price,
  };
}

export function useSaleStatus(sku: string, pollIntervalMs = 2000) {
  const [data, setData] = useState<LandingSaleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusData, product] = await Promise.all([getSaleStatus(sku), getProduct(sku)]);
      setData(mergeToLandingSaleData(statusData, product));
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
