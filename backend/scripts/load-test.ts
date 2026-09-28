/**
 * Production Load & Concurrency Testing Script
 *
 * Executes realistic synthetic traffic against public, catalog, search, and AI endpoints
 * without generating fake orders, fake users, or modifying production database records.
 *
 * Measures:
 *  - Requests per second (Throughput)
 *  - Latency: Min, Median (p50), 95th percentile (p95), 99th percentile (p99), Max
 *  - Success vs Error rates
 *  - Memory usage & process runtime telemetry
 */

interface RequestMetrics {
  endpoint: string;
  statusCode: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

interface LoadTestScenario {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  body?: any;
}

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000';

const SCENARIOS: LoadTestScenario[] = [
  { name: 'System Liveness Probe', endpoint: '/api/v1/health/live', method: 'GET' },
  { name: 'System Diagnostics & Health', endpoint: '/api/v1/health', method: 'GET' },
  { name: 'Category Catalog Listing (Cached)', endpoint: '/api/v1/categories', method: 'GET' },
  { name: 'Brand Directory (Cached)', endpoint: '/api/v1/brands', method: 'GET' },
  { name: 'Public FAQ Articles (Cached)', endpoint: '/api/v1/faqs', method: 'GET' },
  { name: 'Product Catalog Listing & Pagination', endpoint: '/api/v1/products?limit=12', method: 'GET' },
  { name: 'Dynamic XML Sitemap', endpoint: '/sitemap.xml', method: 'GET' },
  { name: 'Crawler Directives (robots.txt)', endpoint: '/robots.txt', method: 'GET' },
  { name: 'AI Recommendations Fallback / Home Feed', endpoint: '/api/v1/recommendations/home', method: 'GET' },
  { name: 'Smart Search Intent Parsing', endpoint: '/api/v1/ai/smart-search?q=laptop', method: 'GET' },
];

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

async function sendRequest(scenario: LoadTestScenario, baseUrl: string = BASE_URL): Promise<RequestMetrics> {
  const start = performance.now();
  const url = `${baseUrl}${scenario.endpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: scenario.method,
      headers: {
        'Accept': 'application/json, text/plain, application/xml, */*',
        'User-Agent': 'NexusCommerce-LoadTester/1.0',
        'X-Request-Id': `load-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      body: scenario.body ? JSON.stringify(scenario.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const durationMs = performance.now() - start;

    return {
      endpoint: scenario.endpoint,
      statusCode: res.status,
      durationMs,
      success: res.status >= 200 && res.status < 400,
    };
  } catch (err: any) {
    const durationMs = performance.now() - start;
    return {
      endpoint: scenario.endpoint,
      statusCode: 0,
      durationMs,
      success: false,
      error: err.name === 'AbortError' ? 'TIMEOUT_EXCEEDED' : err.message,
    };
  }
}

export async function runLoadTest(
  concurrency: number = 10,
  totalRequests: number = 100,
  baseUrl: string = BASE_URL
): Promise<void> {
  console.log('===============================================================');
  console.log(` Starting Nexus Commerce Load Test`);
  console.log(` Target URL:     ${baseUrl}`);
  console.log(` Concurrency:    ${concurrency} virtual workers`);
  console.log(` Total Requests: ${totalRequests}`);
  console.log(` Scenarios:      ${SCENARIOS.length} endpoints`);
  console.log('===============================================================\n');

  const results: RequestMetrics[] = [];
  const startTime = performance.now();

  let scenarioIndex = 0;
  const worker = async () => {
    while (results.length < totalRequests) {
      const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];
      scenarioIndex++;
      const metric = await sendRequest(scenario, baseUrl);
      results.push(metric);
      if (results.length % 25 === 0 || results.length === totalRequests) {
        process.stdout.write(` Progress: ${results.length}/${totalRequests} requests completed...\r`);
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalDurationMs = performance.now() - startTime;
  const totalDurationSec = totalDurationMs / 1000;
  const rps = (results.length / totalDurationSec).toFixed(2);

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;
  const errorRate = ((failed / results.length) * 100).toFixed(2);

  const minLatency = latencies[0]?.toFixed(2) || '0';
  const medianLatency = calculatePercentile(latencies, 50).toFixed(2);
  const p95Latency = calculatePercentile(latencies, 95).toFixed(2);
  const p99Latency = calculatePercentile(latencies, 99).toFixed(2);
  const maxLatency = latencies[latencies.length - 1]?.toFixed(2) || '0';

  console.log('\n\n===============================================================');
  console.log('                   LOAD TEST RESULTS REPORT                    ');
  console.log('===============================================================');
  console.log(` Total Duration:         ${totalDurationSec.toFixed(2)}s`);
  console.log(` Total Requests:         ${results.length}`);
  console.log(` Successful:             ${successful} (${(((successful) / results.length) * 100).toFixed(1)}%)`);
  console.log(` Failed:                 ${failed} (${errorRate}%)`);
  console.log(` Throughput:             ${rps} requests/sec`);
  console.log('---------------------------------------------------------------');
  console.log(' Latency Metrics:');
  console.log(`   Min:                  ${minLatency} ms`);
  console.log(`   Median (p50):         ${medianLatency} ms`);
  console.log(`   95th percentile (p95):${p95Latency} ms`);
  console.log(`   99th percentile (p99):${p99Latency} ms`);
  console.log(`   Max:                  ${maxLatency} ms`);
  console.log('---------------------------------------------------------------');

  // Breakdown per scenario
  console.log('\n Endpoint Breakdown:');
  const perEndpoint = new Map<string, RequestMetrics[]>();
  for (const r of results) {
    if (!perEndpoint.has(r.endpoint)) perEndpoint.set(r.endpoint, []);
    perEndpoint.get(r.endpoint)!.push(r);
  }

  for (const [ep, metrics] of perEndpoint.entries()) {
    const epLatencies = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const epSuccess = metrics.filter((m) => m.success).length;
    const epP95 = calculatePercentile(epLatencies, 95).toFixed(1);
    console.log(
      `   ${ep.padEnd(42)} | ${epSuccess}/${metrics.length} ok | p95: ${epP95}ms`
    );
  }

  console.log('===============================================================\n');
}

import http from 'http';
import { app } from '../src/app.js';
import { dbManager } from '../src/config/database.js';

let internalServer: http.Server | null = null;

async function bootstrapTarget(): Promise<string> {
  const candidate = process.env.LOAD_TEST_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${candidate}/api/v1/health/live`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      console.log(`Discovered active server at ${candidate}`);
      return candidate;
    }
  } catch {
    // Local server not listening, start internal server
  }

  console.log('Target server not detected. Starting in-process load test server on port 5099...');
  try {
    await dbManager.connect();
  } catch (err: any) {
    console.warn('MongoDB connection warning in load test:', err.message);
  }

  await new Promise<void>((resolve) => {
    internalServer = app.listen(5099, () => {
      console.log('In-process load test server listening on http://localhost:5099');
      resolve();
    });
  });

  return 'http://localhost:5099';
}

export async function main() {
  const targetUrl = await bootstrapTarget();
  let concurrency = parseInt(process.env.CONCURRENCY || '15', 10);
  let total = parseInt(process.env.TOTAL_REQUESTS || '150', 10);

  try {
    await runLoadTest(concurrency, total, targetUrl);
  } finally {
    if (internalServer) {
      console.log('Shutting down in-process load test server...');
      await new Promise<void>((resolve) => internalServer!.close(() => resolve()));
      await dbManager.disconnect();
      console.log('Load test teardown complete.');
    }
  }
}

main().catch((err) => {
  console.error('Load test encountered unhandled exception:', err);
  process.exit(1);
});
