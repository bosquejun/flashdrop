import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || "http://127.0.0.1:4000";
const SKU = __ENV.SKU || "IPHONE-17-PRO-MAX-256-BLK";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const url = `${BASE_URL}/api/v1/products/${encodeURIComponent(SKU)}/sale-status`;
  const res = http.get(url, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "has status field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && ["upcoming", "active", "ended"].includes(body.data.status);
      } catch {
        return false;
      }
    },
  });

  sleep(0.1);
}
