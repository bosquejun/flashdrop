import type {
  CreateOrderRequest,
  ErrorResponse,
  Order,
  Product,
  SaleStatusResponse,
} from "@repo/schema";

interface SuccessBody<T> {
  status: "ok";
  data: T;
  error: null;
  code: null;
  timestamp: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

function defaultHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  return headers;
}

/** Legacy fetch for hooks still used by Landing (e.g. useSaleStatus). Uses same base URL and credentials. */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders(),
      ...(options?.headers as Record<string, string>),
    } as HeadersInit,
  });
  return res.json() as Promise<T>;
}

async function request<T>(path: string, options?: RequestInit): Promise<SuccessBody<T>> {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders(),
      ...(options?.headers as Record<string, string>),
    } as HeadersInit,
  });
  const body = (await res.json()) as SuccessBody<T> | ErrorResponse;

  if (body.status === "error") {
    const err = body as ErrorResponse;
    const message = typeof err.error === "string" ? err.error : "Request failed";
    throw new ApiError(message, res.status, err.code);
  }

  return body as SuccessBody<T>;
}

/** GET /api/v1/products/:sku - returns product or throws ApiError (404 when not found). */
export async function getProduct(sku: string): Promise<Product> {
  const res = await fetch(`${API_BASE}${API_PREFIX}/products/${encodeURIComponent(sku)}`, {
    credentials: "include",
    headers: defaultHeaders(),
  });
  const body = await res.json();

  if (body.status === "error") {
    const message = typeof body.error === "string" ? body.error : "Product not found";
    throw new ApiError(message, res.status, body.code);
  }

  return (body as SuccessBody<Product>).data;
}

/** GET /api/v1/products - list products (optional, for future use). */
export async function getProducts(): Promise<Product[]> {
  const body = await request<Product[]>("/products");
  return body.data;
}

export interface ProductStock {
  availableStock: number;
  totalStock: number;
}

/** GET /api/v1/products/:sku/stock - returns current stock (uses Redis live count when in flash sale). */
export async function getProductStock(sku: string): Promise<ProductStock> {
  const body = await request<ProductStock>(`/products/${encodeURIComponent(sku)}/stock`);
  return body.data;
}

/** GET /api/v1/products/:sku/sale-status - returns sale status (server-cached). Throws ApiError on 404. */
export async function getSaleStatus(sku: string): Promise<SaleStatusResponse> {
  const body = await request<SaleStatusResponse>(
    `/products/${encodeURIComponent(sku)}/sale-status`
  );
  return body.data;
}

/** POST /api/v1/orders - create order. Throws ApiError on failure (e.g. FLASH_SALE_ENDED, FLASH_SALE_NOT_STARTED, LIMIT_EXCEEDED). */
export async function createOrder(payload: CreateOrderRequest): Promise<Order> {
  const body = await request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return body.data;
}

/** POST /api/v1/auth/login - send identifier, API sets userId cookie (hashed) and returns userId. Replaces anonymous session. */
export async function login(identifier: string): Promise<{ userId: string }> {
  const body = await request<{ userId: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: identifier.trim() }),
  });
  return body.data;
}

/** GET /api/v1/orders/:productSKU - returns order or null when 404 (user has no order for this product). */
export async function getOrder(productSKU: string): Promise<Order | null> {
  const res = await fetch(`${API_BASE}${API_PREFIX}/orders/${encodeURIComponent(productSKU)}`, {
    credentials: "include",
    headers: defaultHeaders(),
  });
  const body = await res.json();

  if (res.status === 404 || body.status === "error") {
    return null;
  }

  return (body as SuccessBody<Order>).data;
}
