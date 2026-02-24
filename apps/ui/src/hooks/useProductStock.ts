import { useQuery } from "@tanstack/react-query";
import type { ProductStock } from "../lib/api";
import { getProductStock } from "../lib/api";

export interface UseProductStockOptions {
  refetchInterval?: number;
}

/**
 * Fetches current stock for a product (GET /api/v1/products/:sku/stock).
 * Uses live Redis count when in flash sale. Poll at refetchInterval for latest stock.
 */
export function useProductStock(
  sku: string | undefined,
  options?: UseProductStockOptions
) {
  const { refetchInterval = 2000 } = options ?? {};

  return useQuery({
    queryKey: ["product", "stock", sku],
    queryFn: async (): Promise<ProductStock> => getProductStock(sku!),
    enabled: !!sku,
    refetchInterval,
  });
}
