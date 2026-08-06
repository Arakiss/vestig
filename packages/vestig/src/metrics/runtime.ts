/**
 * Runtime metrics
 *
 * Process-level numbers Prometheus users expect to find next to their
 * application metrics: memory, CPU and uptime. Sampled at scrape time through
 * the registry's collector hook, so nothing runs on a timer.
 *
 * Names follow the conventions of the ecosystem's client libraries, so existing
 * dashboards and alerts work unchanged.
 */

import type { MetricsRegistry } from './registry'

interface NodeLikeProcess {
	memoryUsage?: () => {
		rss: number
		heapTotal: number
		heapUsed: number
		external: number
	}
	cpuUsage?: () => { user: number; system: number }
	uptime?: () => number
	version?: string
}

/**
 * The current process object, when the runtime exposes one usable for metrics.
 *
 * Edge runtimes define a stub `process` without these methods, so presence of
 * the global is not enough.
 */
function nodeProcess(): NodeLikeProcess | null {
	try {
		const proc = globalThis.process as NodeLikeProcess | undefined
		return typeof proc?.memoryUsage === 'function' ? proc : null
	} catch {
		return null
	}
}

/**
 * Whether runtime metrics can be collected here.
 *
 * @returns false on Edge runtimes and in browsers, where the process metrics
 * simply do not exist
 */
export function canCollectRuntimeMetrics(): boolean {
	return nodeProcess() !== null
}

/**
 * Register process metrics on a registry.
 *
 * Safe to call where the runtime cannot provide them: it registers nothing and
 * reports so, rather than exporting zeroes that would look like a healthy
 * process using no memory.
 *
 * @param registry - Registry to add the metrics to
 * @returns Whether the metrics were registered
 *
 * @example
 * ```typescript
 * import { globalRegistry, collectRuntimeMetrics } from 'vestig/metrics'
 *
 * collectRuntimeMetrics(globalRegistry)
 * ```
 */
export function collectRuntimeMetrics(registry: MetricsRegistry): boolean {
	const proc = nodeProcess()
	if (!proc) return false

	const residentMemory = registry.gauge(
		'process_resident_memory_bytes',
		'Resident memory size in bytes',
	)
	const heapTotal = registry.gauge('nodejs_heap_size_total_bytes', 'Total heap size in bytes')
	const heapUsed = registry.gauge('nodejs_heap_size_used_bytes', 'Used heap size in bytes')
	const external = registry.gauge(
		'nodejs_external_memory_bytes',
		'Memory used by C++ objects bound to JavaScript objects, in bytes',
	)
	// A counter, not a gauge: CPU time only ever goes up, and the ecosystem
	// declares this name as a counter. Declaring it as a gauge would still
	// render, but rate() over it is only meaningful against a counter.
	const cpuSeconds = registry.counter(
		'process_cpu_seconds_total',
		'Total user and system CPU time spent in seconds',
	)
	const uptime = registry.gauge('process_uptime_seconds', 'Process uptime in seconds')

	// cpuUsage reports the absolute total; the counter takes increments, so
	// track what has already been recorded.
	let recordedCpuSeconds = 0

	registry.addCollector(() => {
		const memory = proc.memoryUsage?.()
		if (memory) {
			residentMemory.set(memory.rss)
			heapTotal.set(memory.heapTotal)
			heapUsed.set(memory.heapUsed)
			external.set(memory.external)
		}

		const cpu = proc.cpuUsage?.()
		if (cpu) {
			// cpuUsage reports microseconds; Prometheus convention is seconds.
			const total = (cpu.user + cpu.system) / 1_000_000
			const delta = total - recordedCpuSeconds
			if (delta > 0) {
				cpuSeconds.inc({}, delta)
				recordedCpuSeconds = total
			}
		}

		const up = proc.uptime?.()
		if (typeof up === 'number') uptime.set(up)
	})

	return true
}
