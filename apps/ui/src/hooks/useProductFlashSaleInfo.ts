import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../lib/api";
import {
  productToFlashSaleInfo,
  type ProductFlashSaleInfo,
} from "../lib/flashSale";

export interface UseProductFlashSaleInfoOptions {
  refetchInterval?: number;
}

/**
 * Fetches product by SKU and derives flash sale status. Polls at refetchInterval (e.g. 2000 ms on ProductPage).
 */
export function useProductFlashSaleInfo(
  sku: string | undefined,
  options?: UseProductFlashSaleInfoOptions
) {
  const { refetchInterval = 2000 } = options ?? {};

  return useQuery({
    queryKey: ["product", "flashSale", sku],
    queryFn: async (): Promise<ProductFlashSaleInfo> => {
      const product = await getProduct(sku!);
      return productToFlashSaleInfo(product);
    },
    enabled: !!sku,
    refetchInterval,
  });
}
