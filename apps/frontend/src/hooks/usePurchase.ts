import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { PurchaseResponse } from "../types/api";

export interface PurchaseVariables {
  userId: string;
  sku: string;
}

/**
 * Legacy purchase mutation using POST /api/sale/purchase.
 * Uses shared API_BASE logic from lib/api via apiFetch so dev/prod envs are consistent.
 */
export function usePurchase() {
  return useMutation<PurchaseResponse, unknown, PurchaseVariables>({
    mutationFn: async ({ userId, sku }) =>
      apiFetch<PurchaseResponse>("/api/sale/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sku }),
      }),
  });
}
