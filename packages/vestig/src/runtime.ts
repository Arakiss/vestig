import type { Runtime } from './types'

/**
 * Runtime capabilities
 */
export interface RuntimeCapabilities {
	hasAsyncLocalStorage: boolean
	hasProcess: boolean
	hasPerformance: boolean
	hasConsole: boolean
	hasCrypto: boolean
}

/**
 * Safe check for Node.js version (Edge-compatible)
 */
function hasNodeVersion(): boolean {
	try {
		// Use dynamic access to avoid static analysis
		const p = globalThis.process as NodeJS.Process | undefined
		return Boolean(p?.versions?.node)
	} catch {
		return false
	}
}

/**
 * Detect the current runtime environment
 */
function detectRuntime(): Runtime {
	// Bun detection (highest priority)
	if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
		return 'bun'
	}

	// Edge runtime detection
	if (typeof globalThis !== 'undefined') {
		// Vercel Edge Runtime
		if ('EdgeRuntime' in globalThis) {
			return 'edge'
		}
		// Next.js Edge - check environment variable safely
		try {
			const p = globalThis.process as NodeJS.Process | undefined
			if (p?.env?.NEXT_RUNTIME === 'edge') {
				return 'edge'
			}
		} catch {
			// process not available, continue checking
		}
		// Cloudflare Workers (has caches but no window/process.versions)
		if (
			'caches' in globalThis &&
			typeof (globalThis as Record<string, unknown>).Request === 'function' &&
			typeof (globalThis as Record<string, unknown>).Response === 'function' &&
			typeof window === 'undefined' &&
			!hasNodeVersion()
		) {
			return 'edge'
		}
	}

	// Node.js detection
	if (hasNodeVersion() && typeof window === 'undefined') {
		return 'node'
	}

	// Browser detection
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		return 'browser'
	}

	// Web Worker detection
	if (
		typeof self !== 'undefined' &&
		typeof (self as unknown as Record<string, unknown>).importScripts === 'function'
	) {
		return 'worker'
	}

	return 'unknown'
}

/**
 * Detect runtime capabilities
 */
function detectCapabilities(): RuntimeCapabilities {
	const hasProc = typeof globalThis.process !== 'undefined'
	return {
		hasAsyncLocalStorage: hasProc && (RUNTIME === 'node' || RUNTIME === 'bun'),
		hasProcess: hasProc,
		hasPerformance: typeof performance !== 'undefined',
		hasConsole: typeof console !== 'undefined',
		hasCrypto: typeof crypto !== 'undefined',
	}
}

/**
 * Current runtime (computed once at module load)
 */
export const RUNTIME: Runtime = detectRuntime()

/**
 * Current capabilities (computed once at module load)
 */
export const CAPABILITIES: RuntimeCapabilities = detectCapabilities()

/**
 * Convenience flags
 */
export const IS_NODE = RUNTIME === 'node'
export const IS_BUN = RUNTIME === 'bun'
export const IS_EDGE = RUNTIME === 'edge'
export const IS_BROWSER = RUNTIME === 'browser'
export const IS_WORKER = RUNTIME === 'worker'
export const IS_SERVER = IS_NODE || IS_BUN || IS_EDGE
