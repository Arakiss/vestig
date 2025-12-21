import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with conflict resolution
 *
 * Uses clsx for conditional classes and tailwind-merge
 * to intelligently merge conflicting Tailwind utilities.
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * cn('text-red-500', 'text-blue-500') // → 'text-blue-500'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes'

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str
	return str.slice(0, maxLength - 3) + '...'
}

/**
 * Generate a random ID
 */
export function generateId(prefix = ''): string {
	const random = Math.random().toString(36).substring(2, 9)
	return prefix ? `${prefix}_${random}` : random
}

/**
 * Check if we're running on the client side
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if we're running on the server side
 */
export const isServer = !isClient
