import { IS_SERVER } from '../runtime'
import type { FileTransportConfig, LogEntry } from '../types'
import { BatchTransport } from './batch'

/**
 * Default file transport configuration
 */
const DEFAULTS = {
	maxSize: 10 * 1024 * 1024, // 10MB
	maxFiles: 5,
	compress: false,
} as const

/**
 * File transport for writing logs to disk
 *
 * Server-side only. Supports log rotation by size and optional gzip compression.
 *
 * @example
 * ```typescript
 * const transport = new FileTransport({
 *   name: 'file',
 *   path: '/var/log/app/app.log',
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   maxFiles: 5,
 *   compress: true,
 * })
 * ```
 */
export class FileTransport extends BatchTransport {
	readonly name: string

	private readonly path: string
	private readonly maxSize: number
	private readonly maxFiles: number
	private readonly compress: boolean

	private currentSize = 0
	private fd: FileHandle | null = null
	private fs: typeof import('node:fs/promises') | null = null
	private zlib: typeof import('node:zlib') | null = null

	constructor(config: FileTransportConfig) {
		if (!IS_SERVER) {
			throw new Error('FileTransport is only available in server environments (Node.js, Bun, Deno)')
		}

		super({
			...config,
			name: config.name ?? 'file',
		})

		this.name = config.name ?? 'file'
		this.path = config.path
		this.maxSize = config.maxSize ?? DEFAULTS.maxSize
		this.maxFiles = config.maxFiles ?? DEFAULTS.maxFiles
		this.compress = config.compress ?? DEFAULTS.compress
	}

	/**
	 * Initialize the file transport
	 */
	override async init(): Promise<void> {
		// Dynamic import for server-only modules
		this.fs = await import('node:fs/promises')
		if (this.compress) {
			this.zlib = await import('node:zlib')
		}

		// Ensure directory exists
		const dir = this.path.substring(0, this.path.lastIndexOf('/'))
		if (dir) {
			await this.fs.mkdir(dir, { recursive: true })
		}

		// Open or create file
		await this.openFile()

		// Start the flush timer
		await super.init()
	}

	/**
	 * Open the log file for appending
	 */
	private async openFile(): Promise<void> {
		if (!this.fs) return

		this.fd = await this.fs.open(this.path, 'a')

		// Get current file size
		const stats = await this.fd.stat()
		this.currentSize = stats.size
	}

	/**
	 * Send entries to the file
	 */
	protected async send(entries: LogEntry[]): Promise<void> {
		if (!this.fd || !this.fs) {
			throw new Error('FileTransport not initialized')
		}

		// Format entries as newline-delimited JSON
		const data = `${entries.map((e) => JSON.stringify(e)).join('\n')}\n`
		const bytes = Buffer.byteLength(data, 'utf8')

		// Check if rotation needed
		if (this.currentSize + bytes > this.maxSize) {
			await this.rotate()
		}

		// Write to file
		await this.fd.write(data)
		this.currentSize += bytes
	}

	/**
	 * Rotate log files
	 */
	private async rotate(): Promise<void> {
		if (!this.fd || !this.fs) return

		// Close current file
		await this.fd.close()
		this.fd = null

		// Rotate existing files
		for (let i = this.maxFiles - 1; i >= 1; i--) {
			const oldPath = i === 1 ? this.path : `${this.path}.${i - 1}${this.compress ? '.gz' : ''}`
			const newPath = `${this.path}.${i}${this.compress ? '.gz' : ''}`

			try {
				await this.fs.access(oldPath)
				if (i === 1 && this.compress) {
					// Compress the current log file
					await this.compressFile(oldPath, newPath)
					await this.fs.unlink(oldPath)
				} else {
					await this.fs.rename(oldPath, newPath)
				}
			} catch {
				// File doesn't exist, skip
			}
		}

		// Delete oldest file if it exists
		const oldestPath = `${this.path}.${this.maxFiles}${this.compress ? '.gz' : ''}`
		try {
			await this.fs.unlink(oldestPath)
		} catch {
			// File doesn't exist
		}

		// Reopen file
		await this.openFile()
	}

	/**
	 * Compress a file using gzip
	 */
	private async compressFile(src: string, dest: string): Promise<void> {
		if (!this.fs || !this.zlib) return

		const { promisify } = await import('node:util')
		const gzip = promisify(this.zlib.gzip)

		const content = await this.fs.readFile(src)
		const compressed = await gzip(content)
		await this.fs.writeFile(dest, compressed)
	}

	/**
	 * Cleanup and close the file
	 */
	override async destroy(): Promise<void> {
		await super.destroy()

		if (this.fd) {
			await this.fd.close()
			this.fd = null
		}
	}

	/**
	 * Get current file size
	 */
	getCurrentSize(): number {
		return this.currentSize
	}
}

/**
 * File handle type from node:fs/promises
 */
type FileHandle = Awaited<ReturnType<typeof import('node:fs/promises').open>>
