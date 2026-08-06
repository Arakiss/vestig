/**
 * Prometheus text exposition format
 *
 * The format is unforgiving: an unescaped quote in a label value or a name with
 * a dash produces output Prometheus rejects at scrape time, and the failure
 * shows up as a missing target rather than as an error in your application.
 * Everything that reaches the output goes through here.
 */

import type { CollectedMetric, MetricLabels } from './types'

/** Valid metric name, per the exposition format. */
const METRIC_NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/

/** Valid label name. `__` is reserved for Prometheus internals. */
const LABEL_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Reject a metric name the scraper would not accept.
 *
 * Failing here, at registration, is far cheaper than shipping a metric that is
 * silently dropped in production.
 */
export function assertValidMetricName(name: string): void {
	if (!METRIC_NAME_RE.test(name)) {
		throw new Error(
			`Invalid metric name "${name}": must match [a-zA-Z_:][a-zA-Z0-9_:]* (use snake_case, e.g. http_requests_total)`,
		)
	}
}

/**
 * Reject a label name the scraper would not accept.
 */
export function assertValidLabelName(name: string): void {
	if (!LABEL_NAME_RE.test(name)) {
		throw new Error(`Invalid label name "${name}": must match [a-zA-Z_][a-zA-Z0-9_]*`)
	}
	if (name.startsWith('__')) {
		throw new Error(`Invalid label name "${name}": the __ prefix is reserved for Prometheus`)
	}
}

/**
 * Escape a label value: backslash, double quote and newline.
 */
export function escapeLabelValue(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Escape HELP text: backslash and newline (quotes are literal there).
 */
export function escapeHelp(help: string): string {
	return help.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')
}

/**
 * Normalise label values to strings, dropping undefined entries.
 */
export function normalizeLabels(labels: MetricLabels = {}): Record<string, string> {
	const out: Record<string, string> = {}
	for (const [key, value] of Object.entries(labels)) {
		if (value === undefined || value === null) continue
		out[key] = String(value)
	}
	return out
}

/**
 * A stable key for a label set.
 *
 * Sorted by label name so that `{a,b}` and `{b,a}` address the same series —
 * otherwise the same counter would split into two on call-site ordering.
 */
export function labelKey(labels: Record<string, string>): string {
	const keys = Object.keys(labels).sort()
	if (keys.length === 0) return ''
	return keys.map((k) => `${k}=${labels[k]}`).join(',')
}

/**
 * Render a label set as `{a="1",b="2"}`, or an empty string when there is none.
 */
export function formatLabels(labels: Record<string, string>): string {
	const keys = Object.keys(labels).sort()
	if (keys.length === 0) return ''

	const pairs = keys.map((k) => `${k}="${escapeLabelValue(labels[k] as string)}"`)
	return `{${pairs.join(',')}}`
}

/**
 * Render a value the way the exposition format expects.
 *
 * Infinity must be `+Inf`/`-Inf`; JavaScript's default stringification is not
 * accepted by the scraper.
 */
export function formatValue(value: number): string {
	if (Number.isNaN(value)) return 'NaN'
	if (value === Number.POSITIVE_INFINITY) return '+Inf'
	if (value === Number.NEGATIVE_INFINITY) return '-Inf'
	return String(value)
}

/**
 * Render collected metrics as a complete exposition document.
 *
 * The trailing newline is required: scrapers reject a body that does not end
 * with one.
 */
export function formatMetrics(metrics: CollectedMetric[]): string {
	const lines: string[] = []

	for (const metric of metrics) {
		if (metric.samples.length === 0) continue

		lines.push(`# HELP ${metric.name} ${escapeHelp(metric.help)}`)
		lines.push(`# TYPE ${metric.name} ${metric.type}`)

		for (const sample of metric.samples) {
			lines.push(`${sample.name}${formatLabels(sample.labels)} ${formatValue(sample.value)}`)
		}
	}

	return lines.length > 0 ? `${lines.join('\n')}\n` : ''
}

/** Content type Prometheus expects for the text format. */
export const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8'
