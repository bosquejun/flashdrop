import { useQuery } from "@tanstack/react-query";
import type { Order } from "@repo/schema";
import { getOrder } from "../lib/api";

/**
 * Fetches the current user's order for a product (by productSKU). Polls every 5s.
 * "Already purchased" when data is non-null (e.g. status === 'completed').
 */
export function useMyOrderForProduct(productSKU: string | undefined) {
  return useQuery({
    queryKey: ["orders", productSKU],
    queryFn: async (): Promise<Order | null> => getOrder(productSKU!),
    enabled: !!productSKU,
    refetchInterval: 5000,
  });
}
