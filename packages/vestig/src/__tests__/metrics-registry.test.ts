import { beforeEach, describe, expect, test } from 'bun:test'
import { formatMetrics, PROMETHEUS_CONTENT_TYPE } from '../metrics/format'
import { Counter, Gauge, Histogram } from '../metrics/metrics'
import { MetricsRegistry } from '../metrics/registry'
import { canCollectRuntimeMetrics, collectRuntimeMetrics } from '../metrics/runtime'

describe('Counter', () => {
	test('starts at zero and accumulates', () => {
		const c = new Counter({ name: 'jobs_total', help: 'Jobs' })

		expect(c.get()).toBe(0)
		c.inc()
		c.inc({}, 4)

		expect(c.get()).toBe(5)
	})

	test('keeps one series per label set', () => {
		const c = new Counter({ name: 'orders_total', help: 'Orders', labelNames: ['status'] })
		c.inc({ status: 'paid' })
		c.inc({ status: 'paid' })
		c.inc({ status: 'refunded' })

		expect(c.get({ status: 'paid' })).toBe(2)
		expect(c.get({ status: 'refunded' })).toBe(1)
	})

	test('label order does not split a series', () => {
		const c = new Counter({ name: 'x_total', help: 'X', labelNames: ['a', 'b'] })
		c.inc({ a: '1', b: '2' })
		c.inc({ b: '2', a: '1' })

		expect(c.collect().samples).toHaveLength(1)
		expect(c.get({ a: '1', b: '2' })).toBe(2)
	})

	test('refuses to decrease', () => {
		const c = new Counter({ name: 'y_total', help: 'Y' })

		expect(() => c.inc({}, -1)).toThrow(/cannot decrease/)
	})

	test('rejects a label it was not declared with', () => {
		const c = new Counter({ name: 'z_total', help: 'Z', labelNames: ['status'] })

		// A typo would otherwise open a parallel series that never adds up.
		expect(() => c.inc({ staus: 'paid' })).toThrow(/not declared with label "staus"/)
	})

	test('rejects an invalid metric name', () => {
		expect(() => new Counter({ name: 'has-dashes', help: 'x' })).toThrow(/Invalid metric name/)
	})
})

describe('Gauge', () => {
	test('goes up and down', () => {
		const g = new Gauge({ name: 'queue_depth', help: 'Depth' })
		g.set(10)
		g.inc()
		g.dec({}, 4)

		expect(g.get()).toBe(7)
	})

	test('tracks values per label set', () => {
		const g = new Gauge({ name: 'depth', help: 'Depth', labelNames: ['queue'] })
		g.set(3, { queue: 'a' })
		g.set(9, { queue: 'b' })

		expect(g.get({ queue: 'a' })).toBe(3)
		expect(g.get({ queue: 'b' })).toBe(9)
	})
})

describe('Histogram', () => {
	test('buckets are cumulative', () => {
		const h = new Histogram({ name: 'd_seconds', help: 'D', buckets: [1, 5, 10] })
		h.observe(0.5)
		h.observe(3)
		h.observe(20)

		const byBucket = Object.fromEntries(
			h
				.collect()
				.samples.filter((s) => s.name === 'd_seconds_bucket')
				.map((s) => [s.labels.le, s.value]),
		)

		expect(byBucket['1']).toBe(1)
		expect(byBucket['5']).toBe(2)
		expect(byBucket['10']).toBe(2)
		expect(byBucket['+Inf']).toBe(3)
	})

	test('exports sum and count', () => {
		const h = new Histogram({ name: 'e_seconds', help: 'E', buckets: [1] })
		h.observe(2)
		h.observe(3)

		const samples = h.collect().samples
		expect(samples.find((s) => s.name === 'e_seconds_sum')?.value).toBe(5)
		expect(samples.find((s) => s.name === 'e_seconds_count')?.value).toBe(2)
	})

	test('sorts buckets given out of order', () => {
		const h = new Histogram({ name: 'f_seconds', help: 'F', buckets: [10, 1, 5] })

		expect(h.buckets).toEqual([1, 5, 10])
	})

	test('rejects the reserved le label', () => {
		expect(() => new Histogram({ name: 'g_seconds', help: 'G', labelNames: ['le'] })).toThrow(
			/reserved label "le"/,
		)
	})

	test('startTimer records elapsed seconds', async () => {
		const h = new Histogram({ name: 'h_seconds', help: 'H', buckets: [10] })
		const stop = h.startTimer()
		await new Promise((r) => setTimeout(r, 20))
		const elapsed = stop()

		expect(elapsed).toBeGreaterThan(0.01)
		expect(elapsed).toBeLessThan(5)
		expect(h.collect().samples.find((s) => s.name === 'h_seconds_count')?.value).toBe(1)
	})
})

describe('MetricsRegistry', () => {
	let registry: MetricsRegistry

	beforeEach(() => {
		registry = new MetricsRegistry()
	})

	test('declaring the same metric twice returns the same instrument', () => {
		const a = registry.counter('a_total', 'A')
		const b = registry.counter('a_total', 'A')

		expect(a).toBe(b)
		expect(registry.registered).toEqual(['a_total'])
	})

	test('registering a duplicate instance is an error', () => {
		registry.register(new Counter({ name: 'dup_total', help: 'Dup' }))

		expect(() => registry.register(new Counter({ name: 'dup_total', help: 'Dup' }))).toThrow(
			/already registered/,
		)
	})

	test('applies default labels without overriding a metric label', () => {
		registry.setDefaultLabels({ service: 'checkout', route: 'default' })
		registry.counter('r_total', 'R', ['route']).inc({ route: '/orders' })

		const sample = registry.collect()[0]?.samples[0]
		expect(sample?.labels).toEqual({ service: 'checkout', route: '/orders' })
	})

	test('runs collectors before collecting', () => {
		const g = registry.gauge('lazy', 'Lazy')
		let calls = 0
		registry.addCollector(() => {
			calls++
			g.set(42)
		})

		expect(registry.collect()[0]?.samples[0]?.value).toBe(42)
		expect(calls).toBe(1)
	})

	test('a failing collector does not break the scrape', () => {
		registry.counter('ok_total', 'OK').inc()
		registry.addCollector(() => {
			throw new Error('collector exploded')
		})

		expect(() => registry.collect()).not.toThrow()
		expect(registry.metricsText()).toContain('ok_total 1')
	})

	test('resetMetrics keeps declarations', () => {
		registry.counter('k_total', 'K').inc()
		registry.resetMetrics()

		expect(registry.registered).toEqual(['k_total'])
		expect(registry.metricsText()).toBe('')
	})
})

describe('exposition format', () => {
	test('renders HELP, TYPE and samples', () => {
		const registry = new MetricsRegistry()
		registry.counter('http_requests_total', 'Total requests', ['method']).inc({ method: 'GET' })

		expect(registry.metricsText()).toBe(
			[
				'# HELP http_requests_total Total requests',
				'# TYPE http_requests_total counter',
				'http_requests_total{method="GET"} 1',
				'',
			].join('\n'),
		)
	})

	test('ends with a newline, which scrapers require', () => {
		const registry = new MetricsRegistry()
		registry.counter('a_total', 'A').inc()

		expect(registry.metricsText().endsWith('\n')).toBe(true)
	})

	test('escapes quotes and backslashes in label values', () => {
		const registry = new MetricsRegistry()
		registry.counter('p_total', 'P', ['path']).inc({ path: 'C:\\a"b' })

		expect(registry.metricsText()).toContain('path="C:\\\\a\\"b"')
	})

	test('escapes newlines in help text', () => {
		const registry = new MetricsRegistry()
		registry.counter('n_total', 'first\nsecond').inc()

		expect(registry.metricsText()).toContain('# HELP n_total first\\nsecond')
	})

	test('renders infinity the way the format demands', () => {
		const registry = new MetricsRegistry()
		registry.gauge('inf_value', 'Inf').set(Number.POSITIVE_INFINITY)

		expect(registry.metricsText()).toContain('inf_value +Inf')
	})

	test('omits metrics that have no samples', () => {
		const registry = new MetricsRegistry()
		registry.counter('never_used_total', 'Never used')

		expect(registry.metricsText()).toBe('')
	})

	test('label values are sorted so output is stable', () => {
		const registry = new MetricsRegistry()
		registry.counter('s_total', 'S', ['b', 'a']).inc({ b: '2', a: '1' })

		expect(registry.metricsText()).toContain('s_total{a="1",b="2"} 1')
	})

	test('formatMetrics on an empty list returns an empty document', () => {
		expect(formatMetrics([])).toBe('')
	})

	test('exposes the content type scrapers expect', () => {
		expect(PROMETHEUS_CONTENT_TYPE).toBe('text/plain; version=0.0.4; charset=utf-8')
	})
})

describe('runtime metrics', () => {
	test('are available on this runtime', () => {
		expect(canCollectRuntimeMetrics()).toBe(true)
	})

	test('report memory and uptime', () => {
		const registry = new MetricsRegistry()

		expect(collectRuntimeMetrics(registry)).toBe(true)

		const text = registry.metricsText()
		expect(text).toContain('process_resident_memory_bytes')
		expect(text).toContain('nodejs_heap_size_used_bytes')
		expect(text).toContain('process_uptime_seconds')
	})

	test('memory is a positive number, not a placeholder zero', () => {
		const registry = new MetricsRegistry()
		collectRuntimeMetrics(registry)
		registry.collect()

		const rss = registry.collect().find((m) => m.name === 'process_resident_memory_bytes')
		expect(rss?.samples[0]?.value).toBeGreaterThan(0)
	})

	test('CPU time is a counter, so rate() over it is meaningful', () => {
		const registry = new MetricsRegistry()
		collectRuntimeMetrics(registry)

		const cpu = registry.collect().find((m) => m.name === 'process_cpu_seconds_total')
		expect(cpu?.type).toBe('counter')
	})

	test('CPU time never goes backwards across collections', () => {
		const registry = new MetricsRegistry()
		collectRuntimeMetrics(registry)

		const read = () =>
			registry.collect().find((m) => m.name === 'process_cpu_seconds_total')?.samples[0]?.value ?? 0

		const first = read()
		for (let i = 0; i < 50_000; i++) Math.sqrt(i)
		const second = read()

		expect(second).toBeGreaterThanOrEqual(first)
	})
})
