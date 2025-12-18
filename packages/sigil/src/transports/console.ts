import { IS_BROWSER } from '../runtime'
import type { LogEntry, LogLevel, Transport, TransportConfig } from '../types'

/**
 * ANSI color codes for terminal output
 */
const COLORS: Record<LogLevel, string> = {
	trace: '\x1b[90m', // gray
	debug: '\x1b[36m', // cyan
	info: '\x1b[32m', // green
	warn: '\x1b[33m', // yellow
	error: '\x1b[31m', // red
}

const RESET = '\x1b[0m'

/**
 * Console method mapping
 */
const CONSOLE_METHODS: Record<LogLevel, keyof Console> = {
	trace: 'debug',
	debug: 'debug',
	info: 'info',
	warn: 'warn',
	error: 'error',
}

/**
 * Format a log entry as a structured JSON string
 */
function formatStructured(entry: LogEntry): string {
	return JSON.stringify(entry)
}

/**
 * Format a log entry for human-readable output
 */
function formatPretty(entry: LogEntry, useColors: boolean): string {
	const color = useColors ? COLORS[entry.level] : ''
	const reset = useColors ? RESET : ''
	const level = entry.level.toUpperCase().padEnd(5)
	const namespace = entry.namespace ? `[${entry.namespace}] ` : ''
	const timestamp = new Date(entry.timestamp).toISOString()

	let output = `${color}${level}${reset} ${timestamp} ${namespace}${entry.message}`

	if (entry.metadata && Object.keys(entry.metadata).length > 0) {
		output += ` ${JSON.stringify(entry.metadata)}`
	}

	if (entry.error) {
		output += `\n${entry.error.stack ?? entry.error.message}`
	}

	return output
}

/**
 * Console transport configuration
 */
export interface ConsoleTransportConfig extends Omit<TransportConfig, 'name'> {
	/** Use structured JSON output */
	structured?: boolean
	/** Use colors in output (only for non-structured) */
	colors?: boolean
}

/**
 * Console transport for logging to stdout/stderr
 */
export class ConsoleTransport implements Transport {
	readonly name = 'console'
	readonly config: TransportConfig
	private structured: boolean
	private colors: boolean

	constructor(config: ConsoleTransportConfig = {}) {
		this.config = {
			name: 'console',
			enabled: config.enabled ?? true,
			level: config.level,
			filter: config.filter,
		}
		this.structured = config.structured ?? false
		this.colors = config.colors ?? !IS_BROWSER
	}

	log(entry: LogEntry): void {
		const method = CONSOLE_METHODS[entry.level]
		const output = this.structured ? formatStructured(entry) : formatPretty(entry, this.colors)

		// Use appropriate console method
		const consoleFn = console[method] as (...args: unknown[]) => void
		consoleFn(output)
	}

	/**
	 * Update configuration
	 */
	setStructured(structured: boolean): void {
		this.structured = structured
	}

	setColors(colors: boolean): void {
		this.colors = colors
	}
}
