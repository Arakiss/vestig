/**
 * Breadcrumb System
 *
 * Captures user actions and events leading up to an error.
 * Provides context for debugging by showing what happened before the crash.
 *
 * @packageDocumentation
 */

import type { Breadcrumb, BreadcrumbCategory, BreadcrumbStore } from './types'

/**
 * Create a unique breadcrumb ID
 */
function createBreadcrumbId(): string {
	return `bc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`
}

/**
 * Create the breadcrumb store
 */
function createBreadcrumbStore(): BreadcrumbStore {
	let breadcrumbs: Breadcrumb[] = []
	let maxSize = 50

	return {
		add(entry: Omit<Breadcrumb, 'id' | 'timestamp'>): void {
			const breadcrumb: Breadcrumb = {
				...entry,
				id: createBreadcrumbId(),
				timestamp: new Date().toISOString(),
			}

			breadcrumbs.push(breadcrumb)

			// Trim to max size
			if (breadcrumbs.length > maxSize) {
				breadcrumbs = breadcrumbs.slice(-maxSize)
			}
		},

		getAll(): Breadcrumb[] {
			return [...breadcrumbs]
		},

		getByCategory(category: BreadcrumbCategory): Breadcrumb[] {
			return breadcrumbs.filter((b) => b.category === category)
		},

		clear(): void {
			breadcrumbs = []
		},

		setMaxSize(size: number): void {
			maxSize = size
			if (breadcrumbs.length > maxSize) {
				breadcrumbs = breadcrumbs.slice(-maxSize)
			}
		},
	}
}

/**
 * Global breadcrumb store singleton
 */
export const breadcrumbStore = createBreadcrumbStore()

/**
 * Add a log breadcrumb
 *
 * @example
 * ```ts
 * addLogBreadcrumb('info', 'User clicked button', 'ui')
 * ```
 */
export function addLogBreadcrumb(
	level: Breadcrumb['level'],
	message: string,
	namespace?: string,
	data?: Record<string, unknown>,
): void {
	breadcrumbStore.add({
		category: 'log',
		level,
		message,
		namespace,
		data,
	})
}

/**
 * Add a navigation breadcrumb
 *
 * @example
 * ```ts
 * addNavigationBreadcrumb('/dashboard', '/settings')
 * ```
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
	breadcrumbStore.add({
		category: 'navigation',
		message: `Navigated from ${from} to ${to}`,
		data: { from, to },
	})
}

/**
 * Add a click breadcrumb
 *
 * @example
 * ```ts
 * addClickBreadcrumb('Submit button', 'button#submit')
 * ```
 */
export function addClickBreadcrumb(elementDescription: string, selector?: string): void {
	breadcrumbStore.add({
		category: 'click',
		message: `Clicked: ${elementDescription}`,
		data: selector ? { selector } : undefined,
	})
}

/**
 * Add an input breadcrumb (sanitizes sensitive data)
 *
 * @example
 * ```ts
 * addInputBreadcrumb('email', 'user@example.com', 'input#email')
 * ```
 */
export function addInputBreadcrumb(fieldName: string, value?: string, selector?: string): void {
	// Sanitize potentially sensitive fields
	const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit', 'card', 'ssn', 'cvv']
	const isSensitive = sensitiveFields.some((f) => fieldName.toLowerCase().includes(f))

	breadcrumbStore.add({
		category: 'input',
		message: `Input: ${fieldName}`,
		data: {
			field: fieldName,
			value: isSensitive ? '[REDACTED]' : value,
			selector,
		},
	})
}

/**
 * Add a fetch/API breadcrumb
 *
 * @example
 * ```ts
 * addFetchBreadcrumb('GET', '/api/users', 200, 150)
 * ```
 */
export function addFetchBreadcrumb(
	method: string,
	url: string,
	status?: number,
	durationMs?: number,
): void {
	breadcrumbStore.add({
		category: 'fetch',
		message: `${method} ${url}${status ? ` → ${status}` : ''}`,
		data: {
			method,
			url,
			status,
			durationMs,
		},
	})
}

/**
 * Add an error breadcrumb (for non-fatal errors)
 *
 * @example
 * ```ts
 * addErrorBreadcrumb('Failed to load user preferences', error)
 * ```
 */
export function addErrorBreadcrumb(message: string, error?: Error): void {
	breadcrumbStore.add({
		category: 'error',
		level: 'error',
		message,
		data: error
			? {
					name: error.name,
					message: error.message,
				}
			: undefined,
	})
}

/**
 * Add a custom breadcrumb
 *
 * @example
 * ```ts
 * addCustomBreadcrumb('Feature flag enabled', { flag: 'new-dashboard' })
 * ```
 */
export function addCustomBreadcrumb(message: string, data?: Record<string, unknown>): void {
	breadcrumbStore.add({
		category: 'custom',
		message,
		data,
	})
}

/**
 * Setup automatic click tracking
 * Call this once in your app to capture click breadcrumbs
 */
export function setupClickTracking(): () => void {
	if (typeof document === 'undefined') return () => {}

	const handleClick = (event: MouseEvent): void => {
		const target = event.target as HTMLElement
		if (!target) return

		// Get a description of the clicked element
		let description = target.tagName.toLowerCase()

		// Add text content if short enough
		const textContent = target.textContent?.trim()
		if (textContent && textContent.length < 50) {
			description += `: "${textContent.slice(0, 30)}${textContent.length > 30 ? '...' : ''}"`
		}

		// Add id or class for identification
		if (target.id) {
			description += ` #${target.id}`
		} else if (target.className && typeof target.className === 'string') {
			const firstClass = target.className.split(' ')[0]
			if (firstClass) description += ` .${firstClass}`
		}

		// Build selector
		let selector = target.tagName.toLowerCase()
		if (target.id) selector += `#${target.id}`

		addClickBreadcrumb(description, selector)
	}

	document.addEventListener('click', handleClick, { capture: true, passive: true })

	return () => {
		document.removeEventListener('click', handleClick, { capture: true })
	}
}

/**
 * Setup automatic fetch tracking
 * Patches global fetch to capture API call breadcrumbs
 */
export function setupFetchTracking(): () => void {
	if (typeof window === 'undefined') return () => {}

	const originalFetch = window.fetch

	window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
		const method = init?.method ?? 'GET'
		const startTime = performance.now()

		try {
			const response = await originalFetch.call(this, input, init)
			const duration = performance.now() - startTime

			addFetchBreadcrumb(method, url, response.status, duration)

			return response
		} catch (error) {
			const duration = performance.now() - startTime
			addFetchBreadcrumb(method, url, 0, duration)
			throw error
		}
	}

	return () => {
		window.fetch = originalFetch
	}
}

/**
 * Format breadcrumbs for display
 */
export function formatBreadcrumbs(breadcrumbs: Breadcrumb[]): string {
	return breadcrumbs
		.map((b) => {
			const time = new Date(b.timestamp).toLocaleTimeString()
			const prefix = b.level ? `[${b.level.toUpperCase()}]` : `[${b.category.toUpperCase()}]`
			return `${time} ${prefix} ${b.message}`
		})
		.join('\n')
}

/**
 * Get category icon for display
 */
export function getCategoryIcon(category: BreadcrumbCategory): string {
	const icons: Record<BreadcrumbCategory, string> = {
		log: '📝',
		navigation: '🧭',
		click: '👆',
		input: '⌨️',
		fetch: '🌐',
		error: '❌',
		custom: '📌',
	}
	return icons[category]
}
