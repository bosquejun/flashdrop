/** In-app types for landing page and legacy hooks (replaces @repo/shared-schemas). */

export type SaleStatus = "upcoming" | "active" | "ended";

export interface SaleStatusResponse {
  status: SaleStatus;
  sale?: {
    _id?: string;
    sku: string;
    startTime: string;
    endTime: string;
    salePrice: number;
    originalPrice?: number;
    maxPerUser?: number;
    totalStock?: number;
    flashSale?: { urgencyText?: string; maxPerUser?: number };
    snapshot: {
      name: string;
      description: string;
      imageUrl: string;
    };
  };
  remainingStock?: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

export interface OrderCheckResponse {
  purchased: boolean;
  orderId?: string;
}
