import { describe, expect, test, beforeEach } from 'bun:test'
import { MetricsCollector, createMetricsCollector, globalMetrics } from '../metrics'

describe('MetricsCollector', () => {
	let metrics: MetricsCollector

	beforeEach(() => {
		metrics = new MetricsCollector()
	})

	describe('constructor', () => {
		test('should create with default options', () => {
			const m = new MetricsCollector()
			expect(m.getMetrics().logs.info).toBe(0)
		})

		test('should accept custom prefix', () => {
			const m = new MetricsCollector({ prefix: 'myapp' })
			const output = m.toPrometheus()
			expect(output).toContain('myapp_logs_total')
		})

		test('should accept custom labels', () => {
			const m = new MetricsCollector({ labels: { env: 'production', service: 'api' } })
			const output = m.toPrometheus()
			expect(output).toContain('env="production"')
			expect(output).toContain('service="api"')
		})
	})

	describe('incLogs', () => {
		test('should increment log count for level', () => {
			metrics.incLogs('info')
			metrics.incLogs('info')
			metrics.incLogs('error')

			const result = metrics.getMetrics()
			expect(result.logs.info).toBe(2)
			expect(result.logs.error).toBe(1)
			expect(result.logs.debug).toBe(0)
		})

		test('should accept custom increment value', () => {
			metrics.incLogs('warn', 5)
			expect(metrics.getMetrics().logs.warn).toBe(5)
		})

		test('should handle all log levels', () => {
			metrics.incLogs('trace')
			metrics.incLogs('debug')
			metrics.incLogs('info')
			metrics.incLogs('warn')
			metrics.incLogs('error')

			const result = metrics.getMetrics()
			expect(result.logs.trace).toBe(1)
			expect(result.logs.debug).toBe(1)
			expect(result.logs.info).toBe(1)
			expect(result.logs.warn).toBe(1)
			expect(result.logs.error).toBe(1)
		})
	})

	describe('incDropped', () => {
		test('should increment dropped count', () => {
			metrics.incDropped()
			metrics.incDropped()
			expect(metrics.getMetrics().dropped).toBe(2)
		})

		test('should accept custom increment value', () => {
			metrics.incDropped(10)
			expect(metrics.getMetrics().dropped).toBe(10)
		})
	})

	describe('incTransportErrors', () => {
		test('should increment transport errors count', () => {
			metrics.incTransportErrors()
			expect(metrics.getMetrics().transportErrors).toBe(1)
		})

		test('should accept custom increment value', () => {
			metrics.incTransportErrors(3)
			expect(metrics.getMetrics().transportErrors).toBe(3)
		})
	})

	describe('incSampledOut', () => {
		test('should increment sampled out count', () => {
			metrics.incSampledOut()
			metrics.incSampledOut()
			expect(metrics.getMetrics().sampledOut).toBe(2)
		})
	})

	describe('recordFlush', () => {
		test('should record flush count and duration', () => {
			metrics.recordFlush(50)
			metrics.recordFlush(100)

			const result = metrics.getMetrics()
			expect(result.flushes).toBe(2)
			expect(result.lastFlushDurationMs).toBe(100)
		})
	})

	describe('reset', () => {
		test('should reset all metrics to zero', () => {
			metrics.incLogs('info', 10)
			metrics.incDropped(5)
			metrics.incTransportErrors(3)
			metrics.incSampledOut(2)
			metrics.recordFlush(100)

			metrics.reset()

			const result = metrics.getMetrics()
			expect(result.logs.info).toBe(0)
			expect(result.dropped).toBe(0)
			expect(result.transportErrors).toBe(0)
			expect(result.sampledOut).toBe(0)
			expect(result.flushes).toBe(0)
			expect(result.lastFlushDurationMs).toBe(0)
		})
	})

	describe('toPrometheus', () => {
		test('should output valid Prometheus format', () => {
			metrics.incLogs('info', 42)
			metrics.incLogs('error', 3)
			metrics.incDropped(1)
			metrics.incTransportErrors(2)
			metrics.recordFlush(75)

			const output = metrics.toPrometheus()

			// Check HELP comments
			expect(output).toContain('# HELP vestig_logs_total Total number of log entries by level')
			expect(output).toContain('# TYPE vestig_logs_total counter')

			// Check log counts
			expect(output).toContain('vestig_logs_total{level="info"} 42')
			expect(output).toContain('vestig_logs_total{level="error"} 3')

			// Check other counters
			expect(output).toContain('vestig_logs_dropped_total 1')
			expect(output).toContain('vestig_transport_errors_total 2')
			expect(output).toContain('vestig_flushes_total 1')
			expect(output).toContain('vestig_last_flush_duration_ms 75')
		})

		test('should include custom prefix', () => {
			const m = new MetricsCollector({ prefix: 'mylogger' })
			m.incLogs('info')

			const output = m.toPrometheus()
			expect(output).toContain('mylogger_logs_total{level="info"} 1')
		})

		test('should include custom labels', () => {
			const m = new MetricsCollector({ labels: { app: 'test', instance: 'web-1' } })
			m.incDropped(5)

			const output = m.toPrometheus()
			// Labels should appear in output (order may vary)
			expect(output).toContain('app="test"')
			expect(output).toContain('instance="web-1"')
		})

		test('should output zero values', () => {
			const output = metrics.toPrometheus()

			expect(output).toContain('vestig_logs_total{level="info"} 0')
			expect(output).toContain('vestig_logs_dropped_total 0')
		})
	})

	describe('toJSON', () => {
		test('should return metrics as JSON', () => {
			metrics.incLogs('info', 5)
			metrics.incDropped(2)

			const json = metrics.toJSON()

			expect(json.logs.info).toBe(5)
			expect(json.dropped).toBe(2)
			expect(json).toHaveProperty('logs')
			expect(json).toHaveProperty('transportErrors')
		})
	})
})

describe('createMetricsCollector', () => {
	test('should create a new MetricsCollector', () => {
		const m = createMetricsCollector()
		expect(m).toBeInstanceOf(MetricsCollector)
	})

	test('should accept options', () => {
		const m = createMetricsCollector({ prefix: 'custom', labels: { env: 'test' } })
		const output = m.toPrometheus()
		expect(output).toContain('custom_logs_total')
		expect(output).toContain('env="test"')
	})
})

describe('globalMetrics', () => {
	beforeEach(() => {
		globalMetrics.reset()
	})

	test('should be a singleton MetricsCollector', () => {
		expect(globalMetrics).toBeInstanceOf(MetricsCollector)
	})

	test('should accumulate metrics globally', () => {
		globalMetrics.incLogs('info')
		globalMetrics.incLogs('info')

		expect(globalMetrics.getMetrics().logs.info).toBe(2)
	})
})
