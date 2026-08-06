import { beforeEach, describe, expect, test } from 'bun:test'
import { MetricsRegistry } from 'vestig'
import { createMetricsHandler } from '../prometheus/handler'
import { httpMetrics, withMetrics } from '../prometheus/http'

function get(url = 'http://localhost/metrics', headers: Record<string, string> = {}): Request {
	return new Request(url, { headers })
}

describe('createMetricsHandler', () => {
	let registry: MetricsRegistry

	beforeEach(() => {
		registry = new MetricsRegistry()
	})

	test('serves the registry in Prometheus format', async () => {
		registry.counter('orders_total', 'Orders', ['status']).inc({ status: 'paid' })
		const handler = createMetricsHandler({ registry, runtimeMetrics: false })

		const response = await handler(get())
		const body = await response.text()

		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toBe('text/plain; version=0.0.4; charset=utf-8')
		expect(body).toContain('# TYPE orders_total counter')
		expect(body).toContain('orders_total{status="paid"} 1')
	})

	test('is never cached', async () => {
		const handler = createMetricsHandler({ registry, runtimeMetrics: false })
		const response = await handler(get())

		// A cached scrape reports the past as if it were the present.
		expect(response.headers.get('cache-control')).toContain('no-store')
	})

	test('includes runtime metrics by default', async () => {
		const handler = createMetricsHandler({ registry })
		const body = await (await handler(get())).text()

		expect(body).toContain('process_resident_memory_bytes')
	})

	test('omits runtime metrics when asked', async () => {
		registry.counter('x_total', 'X').inc()
		const handler = createMetricsHandler({ registry, runtimeMetrics: false })
		const body = await (await handler(get())).text()

		expect(body).not.toContain('process_resident_memory_bytes')
	})

	test('applies default labels', async () => {
		registry.counter('y_total', 'Y').inc()
		const handler = createMetricsHandler({
			registry,
			runtimeMetrics: false,
			defaultLabels: { service: 'checkout' },
		})

		expect(await (await handler(get())).text()).toContain('y_total{service="checkout"} 1')
	})

	describe('with a token', () => {
		test('rejects a request without one', async () => {
			const handler = createMetricsHandler({ registry, token: 'secret', runtimeMetrics: false })
			const response = await handler(get())

			expect(response.status).toBe(401)
			expect(response.headers.get('www-authenticate')).toBe('Bearer')
		})

		test('rejects a wrong token', async () => {
			const handler = createMetricsHandler({ registry, token: 'secret', runtimeMetrics: false })
			const response = await handler(
				get('http://localhost/metrics', { authorization: 'Bearer nope' }),
			)

			expect(response.status).toBe(401)
		})

		test('accepts the right token', async () => {
			registry.counter('z_total', 'Z').inc()
			const handler = createMetricsHandler({ registry, token: 'secret', runtimeMetrics: false })
			const response = await handler(
				get('http://localhost/metrics', { authorization: 'Bearer secret' }),
			)

			expect(response.status).toBe(200)
			expect(await response.text()).toContain('z_total 1')
		})

		test('does not leak metrics in the unauthorized body', async () => {
			registry.counter('secret_total', 'Secret').inc()
			const handler = createMetricsHandler({ registry, token: 'secret', runtimeMetrics: false })
			const body = await (await handler(get())).text()

			expect(body).not.toContain('secret_total')
		})
	})
})

describe('withMetrics', () => {
	let registry: MetricsRegistry

	beforeEach(() => {
		registry = new MetricsRegistry()
	})

	test('counts requests by method, route and status class', async () => {
		const handler = withMetrics(async () => Response.json({ ok: true }), {
			registry,
			route: '/api/orders',
		})

		await handler(new Request('http://localhost/api/orders', { method: 'POST' }))

		expect(registry.metricsText()).toContain(
			'http_requests_total{method="POST",route="/api/orders",status="2xx"} 1',
		)
	})

	test('records duration', async () => {
		const handler = withMetrics(async () => new Response('ok'), { registry, route: '/r' })
		await handler(new Request('http://localhost/r'))

		const text = registry.metricsText()
		expect(text).toContain('http_request_duration_seconds_count{method="GET",route="/r"} 1')
		expect(text).toContain('http_request_duration_seconds_bucket')
	})

	test('counts a thrown handler as 5xx and rethrows', async () => {
		const handler = withMetrics(
			async () => {
				throw new Error('boom')
			},
			{ registry, route: '/fail' },
		)

		await expect(handler(new Request('http://localhost/fail'))).rejects.toThrow('boom')
		expect(registry.metricsText()).toContain('status="5xx"')
	})

	test('leaves no in-flight request behind after an error', async () => {
		const handler = withMetrics(
			async () => {
				throw new Error('boom')
			},
			{ registry, route: '/fail' },
		)

		await handler(new Request('http://localhost/fail')).catch(() => {})

		const inFlight = registry.collect().find((m) => m.name === 'http_requests_in_flight')
			?.samples[0]?.value

		expect(inFlight).toBe(0)
	})

	test('classifies error responses', async () => {
		const handler = withMetrics(async () => new Response('nope', { status: 404 }), {
			registry,
			route: '/missing',
		})
		await handler(new Request('http://localhost/missing'))

		expect(registry.metricsText()).toContain('status="4xx"')
	})

	test('falls back to the pathname when no route pattern is given', async () => {
		const handler = withMetrics(async () => new Response('ok'), { registry })
		await handler(new Request('http://localhost/api/orders/42'))

		// Documented fallback: this is why passing `route` matters, since each id
		// would otherwise become its own series.
		expect(registry.metricsText()).toContain('route="/api/orders/42"')
	})

	test('httpMetrics is idempotent', () => {
		const a = httpMetrics({ registry })
		const b = httpMetrics({ registry })

		expect(a.requestsTotal).toBe(b.requestsTotal)
	})
})
