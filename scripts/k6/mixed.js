import { check, sleep } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || "http://127.0.0.1:4000";
const SKU = __ENV.SKU || "IPHONE-17-PRO-MAX-256-BLK";

/**
 * ~10 min real-life flash sale simulation:
 * - Ramp up: anticipation (browsing, checking status)
 * - Spike: sale goes live (traffic surge)
 * - Peak: sustained frenzy (high concurrency)
 * - Ramp down: stock depleting, traffic tapers
 * - Cool down: traffic winds down to zero
 */
export const options = {
  stages: [
    // Ramp up — pre-sale: people waiting, checking if sale started (1 min)
    { duration: "1m", target: 150 },
    // Spike — sale just went live: sharp increase (1 min)
    { duration: "1m", target: 600 },
    // Peak — sustained high load, retries + new users (3 min)
    { duration: "3m", target: 900 },
    // Ramp down — stock running out, some users leave (2 min)
    { duration: "2m", target: 400 },
    // Late phase — mostly status checks, last orders (2 min)
    { duration: "2m", target: 150 },
    // Cool down — traffic winds down (1 min)
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const saleStatusUrl = `${BASE_URL}/api/v1/products/${encodeURIComponent(SKU)}/sale-status`;
  const statusRes = http.get(saleStatusUrl, {
    headers: { "Content-Type": "application/json" },
  });

  check(statusRes, {
    "sale-status status is 200": (r) => r.status === 200,
  });

  let status = null;
  try {
    const body = JSON.parse(statusRes.body);
    status = body.data?.status;
  } catch (_) {}

  if (status === "active") {
    const orderUrl = `${BASE_URL}/api/v1/orders`;
    const payload = JSON.stringify({
      productSKU: SKU,
      quantity: 1,
    });
    const userId = `stress-mixed-vu-${__VU}-iter-${__ITER}`;
    const orderRes = http.post(orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Cookie: `flashdrop-user-id=${userId}`,
      },
    });

    check(orderRes, {
      "order status is 201 or expected 4xx": (r) =>
        r.status === 201 ||
        r.status === 400 ||
        r.status === 403 ||
        r.status === 409,
    });
  }

  // Realistic think time: 100–800 ms (browse, decide, retry)
  sleep(Math.random() * 0.7 + 0.1);
}
