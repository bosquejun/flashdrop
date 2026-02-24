import { check, sleep } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || "http://127.0.0.1:4000";
const SKU = __ENV.SKU || "IPHONE-17-PRO-MAX-256-BLK";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 10000 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<1"],
  },
};

export default function () {
  const url = `${BASE_URL}/api/v1/orders`;
  const payload = JSON.stringify({
    productSKU: SKU,
    quantity: 1,
  });
  const userId = `stress-vu-${__VU}-iter-${__ITER}`;
  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: `flashdrop-user-id=${userId}`,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status is 201 or expected 4xx": (r) =>
      r.status === 201 || r.status === 400 || r.status === 403 || r.status === 409,
  });

  sleep(0.2);
}
