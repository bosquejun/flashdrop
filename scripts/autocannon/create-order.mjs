import { randomUUID } from "node:crypto";
import autocannon from "autocannon";
const API_URL = process.env["API_URL"] ?? "http://127.0.0.1:4000";
const CONNECTIONS = Number.parseInt(process.env["CONNECTIONS"] ?? "100", 10);
const DURATION = Number.parseInt(process.env["DURATION"] ?? "10", 10);
const TIMEOUT = Number.parseInt(process.env["TIMEOUT"] ?? "240", 10);

async function run() {
  const getProduct = async () => {
    const response = await fetch(`${API_URL}/api/v1/products`);
    const data = await response.json();
    return data?.data?.[0];
  };

  const product = await getProduct();
  if (!product?.sku) {
    console.error("No product found. Run seed first: pnpm seed");
    process.exit(1);
  }

  const body = JSON.stringify({
    productSKU: product.sku,
    quantity: 1,
  });

  const instance = autocannon({
    url: `${API_URL}/api/v1/orders`,
    connections: CONNECTIONS,
    duration: DURATION,
    timeout: TIMEOUT,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `flashdrop-user-id=bench-user-${randomUUID()}`,
    },
    body,
    setupClient(client) {
      client.on("response", () => {
        const userId = `bench-user-${randomUUID()}`;
        client.setHeadersAndBody(
          {
            "Content-Type": "application/json",
            Cookie: `flashdrop-user-id=${userId}`,
          },
          body
        );
      });
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on("done", (result) => {
    console.log("\n── Create Order Benchmark Results ──\n");
    console.log(`  Connections:  ${result.connections}`);
    console.log(`  Duration:     ${DURATION}s`);
    console.log(`  Total Reqs:   ${result.requests.total}`);
    console.log(`  Avg RPS:      ${result.requests.average}`);
    console.log(`  Avg Latency:  ${result.latency.average}ms`);
    console.log(`  p50 Latency:  ${result.latency.p50}ms`);
    console.log(`  p97.5 Latency: ${result.latency.p97_5}ms`);
    console.log(`  p99 Latency:  ${result.latency.p99}ms`);
    console.log(`  Throughput:   ${(result.throughput.average / 1024).toFixed(1)} KB/s`);

    const non2xx = result.non2xx ?? 0;
    const errors = result.errors ?? 0;
    console.log(`  Non-2xx:      ${non2xx}`);
    console.log(`  2xx:          ${result["2xx"] ?? 0}`);
    console.log(`  4xx:          ${result["4xx"] ?? 0}`);
    console.log(`  5xx:          ${result["5xx"] ?? 0}`);
    console.log(`  Errors:       ${errors}`);
    console.log("");
  });
}

run();
