# API Stress Test Results

**Tool:** [Autocannon](https://github.com/mcollina/autocannon)  
**Setup:** 4 API instances, 4 workers each  
**Base URL:** `http://127.0.0.1:4000`  
**Test duration:** 30s per run  

---

## Executive Summary

| Endpoint | Best case | Throughput (RPS) | Latency (p50) | Notes |
|----------|-----------|------------------|---------------|--------|
| GET sale-status | 100 conn | ~35.9k | 2 ms | Read-heavy; scales well until 1k conn, then latency grows |
| POST create order (1k stock) | 100 conn | ~19.8k | 4 ms | Stock exhausted early; most requests return 4xx |
| POST create order (10k stock) | 500 conn | ~20.8k | 22 ms | 10k successful orders; 28 5xx under load |

**Findings:** Sale-status is stable with zero errors across all connection levels. Create-order is limited by product stock and shows expected 4xx when stock is exhausted; at 10k stock, a small number of 5xx (28) appear under 500 connections.

---

## 1. GET Product Sale Status

**Endpoint:** `GET /api/v1/products/:sku/sale-status`  
**SKU:** `IPHONE-17-PRO-MAX-256-BLK`

### Summary by connection level

| Connections | Total requests | Avg RPS | Avg latency | p50 | p99 | Non-2xx | Errors |
|-------------|----------------|---------|-------------|-----|-----|---------|--------|
| 100 | 1,075,854 | 35,864 | 2.32 ms | 2 ms | 5 ms | 0 | 0 |
| 500 | 857,635 | 28,588 | 17.13 ms | 17 ms | 32 ms | 0 | 0 |
| 1,000 | 859,819 | 28,661 | 35.03 ms | 34 ms | 47 ms | 0 | 0 |
| 5,000 | 835,509 | 49,136 | 187.07 ms | 182 ms | 220 ms | 0 | 0 |

**Analysis:**

- **100 connections:** Best latency (p50 2 ms, p99 5 ms) and highest RPS (~35.9k). Ideal for read-heavy traffic.
- **500–1,000 connections:** RPS holds around ~28.6k; latency increases (p50 17–34 ms, p99 32–47 ms). No errors; system remains stable.
- **5,000 connections:** Throughput rises to ~49k RPS (likely due to more concurrent connections), but latency jumps (p50 182 ms, p99 220 ms, max 823 ms). Flat Req/Sec and high latency suggest the cluster is saturated; 100–1k connections are better for consistent low latency.

---

### 1.1 Raw output: 100 connections

```
Running 30s test @ http://127.0.0.1:4000/api/v1/products/IPHONE-17-PRO-MAX-256-BLK/sale-status
100 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 1 ms │ 2 ms │ 5 ms  │ 5 ms │ 2.32 ms │ 1.09 ms │ 50 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬───────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg       │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼──────────┼─────────┤
│ Req/Sec   │ 28,031  │ 28,031  │ 35,487  │ 39,071  │ 35,863.74 │ 2,258.12 │ 28,024  │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼──────────┼─────────┤
│ Bytes/Sec │ 17.6 MB │ 17.6 MB │ 22.3 MB │ 24.5 MB │ 22.5 MB   │ 1.42 MB  │ 17.6 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴───────────┴──────────┴─────────┘

1076k requests in 30.04s, 676 MB read

── Get Sale Status Benchmark Results ──
  Endpoint:     GET /api/v1/products/:sku/sale-status
  SKU:          IPHONE-17-PRO-MAX-256-BLK
  Connections:  100
  Duration:     30s
  Total Reqs:   1075854
  Avg RPS:      35863.74
  Avg Latency:  2.32ms
  p50 Latency:  2ms
  p97.5 Latency: 5ms
  p99 Latency:  5ms
  Throughput:   21992.0 KB/s
  Non-2xx:      0  3xx: 0  4xx: 0  5xx: 0  Errors: 0
```

---

### 1.2 Raw output: 500 connections

```
Running 30s test @ http://127.0.0.1:4000/api/v1/products/IPHONE-17-PRO-MAX-256-BLK/sale-status
500 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max    │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼────────┤
│ Latency │ 15 ms │ 17 ms │ 22 ms │ 32 ms │ 17.13 ms │ 3.71 ms │ 138 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬────────┬───────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%  │ Avg       │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼────────┼───────────┼──────────┼─────────┤
│ Req/Sec   │ 19,647  │ 19,647  │ 28,751  │ 30,223 │ 28,588.27 │ 1,800.34 │ 19,645  │
├───────────┼─────────┼─────────┼─────────┼────────┼───────────┼──────────┼─────────┤
│ Bytes/Sec │ 12.3 MB │ 12.3 MB │ 18.1 MB │ 19 MB  │ 18 MB     │ 1.13 MB  │ 12.3 MB │
└───────────┴─────────┴─────────┴─────────┴────────┴───────────┴──────────┴─────────┘

858k requests in 30.27s, 539 MB read

── Get Sale Status Benchmark Results ──
  Connections: 500  Duration: 30s  Total Reqs: 857635
  Avg RPS: 28588.27  Avg Latency: 17.13ms  p50: 17ms  p97.5: 22ms  p99: 32ms
  Throughput: 17532.4 KB/s  Non-2xx: 0  Errors: 0
```

---

### 1.3 Raw output: 1,000 connections

```
Running 30s test @ http://127.0.0.1:4000/api/v1/products/IPHONE-17-PRO-MAX-256-BLK/sale-status
1000 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max    │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼────────┤
│ Latency │ 31 ms │ 34 ms │ 41 ms │ 47 ms │ 35.03 ms │ 6.41 ms │ 259 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬───────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg       │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼─────────┼─────────┤
│ Req/Sec   │ 18,879  │ 18,879  │ 28,895  │ 29,983  │ 28,661.34 │ 2,005.2 │ 18,864  │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼─────────┼─────────┤
│ Bytes/Sec │ 11.9 MB │ 11.9 MB │ 18.2 MB │ 18.8 MB │ 18 MB     │ 1.26 MB │ 11.8 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴───────────┴─────────┴─────────┘

861k requests in 30.61s, 540 MB read

── Get Sale Status Benchmark Results ──
  Connections: 1000  Duration: 30s  Total Reqs: 859819
  Avg RPS: 28661.34  Avg Latency: 35.03ms  p50: 34ms  p97.5: 41ms  p99: 47ms
  Throughput: 17575.3 KB/s  Non-2xx: 0  Errors: 0
```

---

### 1.4 Raw output: 5,000 connections

```
Running 30s test @ http://127.0.0.1:4000/api/v1/products/IPHONE-17-PRO-MAX-256-BLK/sale-status
5000 connections

┌─────────┬────────┬────────┬────────┬────────┬───────────┬──────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev    │ Max    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼──────────┼────────┤
│ Latency │ 173 ms │ 182 ms │ 216 ms │ 220 ms │ 187.07 ms │ 39.05 ms │ 823 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴──────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┤
│ Req/Sec   │ 49,151  │ 49,151  │ 49,151  │ 49,151  │ 49,136  │ 0     │ 49,147  │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┤
│ Bytes/Sec │ 30.9 MB │ 30.9 MB │ 30.9 MB │ 30.9 MB │ 30.9 MB │ 0 B   │ 30.9 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴───────┴─────────┘

Req/Bytes counts sampled once per second. No. of samples: 17
841k requests in 31.62s, 525 MB read

── Get Sale Status Benchmark Results ──
  Connections: 5000  Duration: 30s  Total Reqs: 835509
  Avg RPS: 49136  Avg Latency: 187.07ms  p50: 182ms  p97.5: 216ms  p99: 220ms
  Throughput: 30136.0 KB/s  Non-2xx: 0  Errors: 0
```

---

## 2. POST Create Order

**Endpoint:** `POST /api/v1/orders`

### Summary

| Scenario | Connections | Total requests | 2xx | 4xx | 5xx | Avg RPS | Avg latency | p50 | p99 |
|----------|-------------|----------------|-----|-----|-----|---------|-------------|-----|-----|
| 1k stock limit | 100 | 594,421 | 1,000 | 593,421 | 0 | 19,814 | 4.54 ms | 4 ms | 10 ms |
| 10k stock limit | 500 | 625,104 | 10,000 | 615,076 | 28 | 20,838 | 23.75 ms | 22 ms | 50 ms |

**Analysis:**

- **1k stock:** Stock is exhausted after 1,000 successful orders. Remaining requests correctly return 4xx (e.g. out-of-stock). No 5xx; latency stays low (p99 10 ms). Behavior is as expected.
- **10k stock:** 10,000 orders succeed; the rest get 4xx. Under 500 connections there are 28 5xx responses—worth investigating (e.g. race conditions, timeouts, or DB contention) if the goal is zero server errors under load.

---

### 2.1 With 1k product stock limit (100 connections)

**Analysis:** Stock caps at 1,000; after that all further requests correctly receive 4xx. Throughput and latency are good (p50 4 ms); no server errors.

**Raw output:**

```
Running 30s test @ http://127.0.0.1:4000/api/v1/orders
100 connections

┌─────────┬──────┬──────┬───────┬───────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼───────┼─────────┼─────────┼───────┤
│ Latency │ 2 ms │ 4 ms │ 9 ms  │ 10 ms │ 4.54 ms │ 1.99 ms │ 50 ms │
└─────────┴──────┴──────┴───────┴───────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬───────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg       │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼────────┼─────────┤
│ Req/Sec   │ 15,399  │ 15,399  │ 19,935  │ 21,087  │ 19,813.74 │ 995.9  │ 15,395  │
├───────────┼─────────┼─────────┼─────────┼─────────┼───────────┼────────┼─────────┤
│ Bytes/Sec │ 5.62 MB │ 5.62 MB │ 6.78 MB │ 7.17 MB │ 6.75 MB   │ 285 kB │ 5.61 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴───────────┴────────┴─────────┘

1000 2xx responses, 593421 non 2xx responses
595k requests in 30.07s, 202 MB read

── Create Order Benchmark Results ──
  Connections: 100  Duration: 30s  Total Reqs: 594421
  Avg RPS: 19813.74  Avg Latency: 4.54ms  p50: 4ms  p97.5: 9ms  p99: 10ms
  Throughput: 6591.5 KB/s  Non-2xx: 593421  2xx: 1000  4xx: 593421  5xx: 0  Errors: 0
```

---

### 2.2 With 10k product stock limit (500 connections)

**Analysis:** 10,000 orders succeed; remaining requests return 4xx as expected. 28 responses are 5xx—likely under load (timeouts or contention); recommend checking logs and error paths to drive 5xx to zero if required.

**Raw output:**

```
Running 30s test @ http://127.0.0.1:4000/api/v1/orders
500 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max    │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼────────┤
│ Latency │ 19 ms │ 22 ms │ 45 ms │ 50 ms │ 23.75 ms │ 7.01 ms │ 178 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Req/Sec   │ 9,199   │ 9,199   │ 21,343  │ 22,319  │ 20,838  │ 2,263.46 │ 9,194   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Bytes/Sec │ 6.41 MB │ 6.41 MB │ 7.25 MB │ 7.59 MB │ 7.21 MB │ 256 kB   │ 6.41 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┘

10000 2xx responses, 615104 non 2xx responses
626k requests in 30.37s, 216 MB read

── Create Order Benchmark Results ──
  Connections: 500  Duration: 30s  Total Reqs: 625104
  Avg RPS: 20838  Avg Latency: 23.75ms  p50: 22ms  p97.5: 45ms  p99: 50ms
  Throughput: 7041.3 KB/s  Non-2xx: 615104  2xx: 10000  4xx: 615076  5xx: 28  Errors: 0
```

---

## Conclusions

1. **GET sale-status** is suitable for high read traffic: sub-5 ms p99 at 100 connections, ~28–35k RPS depending on connection count, and zero errors. For low latency, keep concurrent connections in the 100–500 range; 5k connections pushes p99 to ~220 ms.
2. **POST create order** respects stock limits and returns 4xx when exhausted. The 1k-stock run has no 5xx; the 10k-stock run at 500 connections has 28 5xx—a small fraction but worth tracing if the target is zero server errors.
3. **Recommendations:** Re-run create-order tests with higher stock or different connection levels to characterize when 5xx appear; add logging/monitoring for 5xx on order creation to debug root cause.
