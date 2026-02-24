import { useEffect, useState, useCallback } from "react";
import type { SaleStatusResponse } from "../types/legacySchemas";
import { getProduct, getProductStock, isApiError } from "../lib/api";
import { productToFlashSaleInfo } from "../lib/flashSale";

function productToSaleStatusResponse(product: Awaited<ReturnType<typeof getProduct>>): SaleStatusResponse {
  const info = productToFlashSaleInfo(product);
  return {
    status: info.status,
    remainingStock: info.availableStock,
    sale: {
      sku: info.sku,
      startTime: info.startDate.toISOString(),
      endTime: info.endDate.toISOString(),
      salePrice: info.price,
      originalPrice: info.price,
      maxPerUser: info.limitPerUser,
      totalStock: info.totalStock,
      snapshot: {
        name: info.name,
        description: info.description ?? "",
        imageUrl: info.imageUrl ?? "",
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
      const product = await getProduct(sku);
      const response = productToSaleStatusResponse(product);
      try {
        const stock = await getProductStock(sku);
        response.remainingStock = stock.availableStock;
        if (response.sale) response.sale.totalStock = stock.totalStock;
      } catch {
        // keep product-based stock if stock endpoint fails
      }
      setData(response);
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
