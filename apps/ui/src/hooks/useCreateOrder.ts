import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateOrderRequest, Order } from "@repo/schema";
import { ApiError, createOrder as createOrderApi } from "../lib/api";

export interface CreateOrderVariables extends CreateOrderRequest {}

/**
 * Mutation to create an order. On success invalidates product flash sale and orders for the productSKU.
 * Map API error code to user-facing message for proper response feedback.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: CreateOrderVariables): Promise<Order> => {
      return createOrderApi(variables);
    },
    onSuccess: (_, variables) => {
      const sku = variables.productSKU;
      queryClient.invalidateQueries({ queryKey: ["product", "flashSale", sku] });
      queryClient.invalidateQueries({ queryKey: ["orders", sku] });
    },
  });
}

/** User-facing message for API error codes from create order. */
export function getCreateOrderErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code) {
    switch (error.code) {
      case "FLASH_SALE_ENDED":
        return "Sale has ended.";
      case "FLASH_SALE_NOT_STARTED":
        return "Sale has not started yet.";
      case "PRODUCT_NOT_FOUND":
        return "Product not found.";
      case "LIMIT_EXCEEDED":
        return "You have reached the maximum purchase limit for this item.";
      case "INTERNAL_SERVER_ERROR":
        return "Something went wrong. Please try again.";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Purchase failed.";
}
