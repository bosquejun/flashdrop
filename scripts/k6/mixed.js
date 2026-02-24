import { check, sleep } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || "http://127.0.0.1:4000";
const SKU = __ENV.SKU || "IPHONE-17-PRO-MAX-256-BLK";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 40 },
    { duration: "1m", target: 40 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<1"],
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
        r.status === 201 || r.status === 400 || r.status === 403 || r.status === 409,
    });
  }

  sleep(0.2);
}
