import autocannon from "autocannon";

const API_URL = process.env["API_URL"] ?? "http://127.0.0.1:4000";
const CONNECTIONS = Number.parseInt(process.env["CONNECTIONS"] ?? "20000", 10);
const DURATION = Number.parseInt(process.env["DURATION"] ?? "10", 10);

let counter = 0;

async function run() {
  const getProduct = async () => {
    const response = await fetch(`${API_URL}/api/v1/products`);
    const data = await response.json();
    return data?.data?.[0];
  };

  const product = await getProduct();

  const instance = autocannon({
    url: `${API_URL}/api/v1/products/${product.sku}`,
    connections: CONNECTIONS,
    duration: DURATION,
    method: "GET",
    headers: { "Content-Type": "application/json" },
    setupClient(client) {
      client.on("response", () => {
        client.setBody(
          JSON.stringify({ userId: `bench-user-${counter++}`, productSKU: product.sku })
        );
      });
    },
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on("done", (result) => {
    console.log("\n── Product Flash Sale Benchmark Results ──\n");
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
    console.log(`  3xx:          ${result["3xx"] ?? 0}`);
    console.log(`  4xx:          ${result["4xx"] ?? 0}`);
    console.log(`  5xx:          ${result["5xx"] ?? 0}`);
    console.log(`  Errors:       ${errors}`);
    console.log("");
  });
}

run();
