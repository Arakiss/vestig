import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import React, { createElement } from 'react'
import {
	type Breadcrumb,
	VestigErrorBoundary,
	type VestigErrorBoundaryProps,
	addBreadcrumb,
	clearBreadcrumbs,
	getBreadcrumbs,
} from '../../client/error-boundary'

describe('Breadcrumb management', () => {
	beforeEach(() => {
		clearBreadcrumbs()
	})

	test('should add breadcrumbs', () => {
		addBreadcrumb({
			timestamp: '2025-01-01T00:00:00.000Z',
			level: 'info',
			message: 'Test message',
		})

		const crumbs = getBreadcrumbs()
		expect(crumbs.length).toBe(1)
		expect(crumbs[0]?.message).toBe('Test message')
		expect(crumbs[0]?.level).toBe('info')
	})

	test('should add multiple breadcrumbs in order', () => {
		addBreadcrumb({ message: 'First' })
		addBreadcrumb({ message: 'Second' })
		addBreadcrumb({ message: 'Third' })

		const crumbs = getBreadcrumbs()
		expect(crumbs.length).toBe(3)
		expect(crumbs[0]?.message).toBe('First')
		expect(crumbs[1]?.message).toBe('Second')
		expect(crumbs[2]?.message).toBe('Third')
	})

	test('should use defaults for missing fields', () => {
		addBreadcrumb({ message: 'Test' })

		const crumbs = getBreadcrumbs()
		expect(crumbs[0]?.level).toBe('info')
		expect(crumbs[0]?.timestamp).toBeDefined()
	})

	test('should clear breadcrumbs', () => {
		addBreadcrumb({ message: 'Test 1' })
		addBreadcrumb({ message: 'Test 2' })

		clearBreadcrumbs()

		const crumbs = getBreadcrumbs()
		expect(crumbs.length).toBe(0)
	})

	test('should limit breadcrumbs to max size', () => {
		// Default max is 20, add 25
		for (let i = 0; i < 25; i++) {
			addBreadcrumb({ message: `Message ${i}` })
		}

		const crumbs = getBreadcrumbs()
		expect(crumbs.length).toBe(20)
		// Should have the latest 20 (5-24)
		expect(crumbs[0]?.message).toBe('Message 5')
		expect(crumbs[19]?.message).toBe('Message 24')
	})

	test('should preserve namespace in breadcrumbs', () => {
		addBreadcrumb({
			message: 'Test',
			namespace: 'auth:login',
		})

		const crumbs = getBreadcrumbs()
		expect(crumbs[0]?.namespace).toBe('auth:login')
	})

	test('should handle undefined namespace', () => {
		addBreadcrumb({ message: 'Test' })

		const crumbs = getBreadcrumbs()
		expect(crumbs[0]?.namespace).toBeUndefined()
	})

	test('should return readonly array', () => {
		addBreadcrumb({ message: 'Test' })

		const crumbs = getBreadcrumbs()

		// TypeScript should prevent mutation, but runtime check
		expect(Array.isArray(crumbs)).toBe(true)
	})
})

describe('VestigErrorBoundary', () => {
	// Note: Full React component testing would require a React testing library
	// These are unit tests for the exported utilities

	beforeEach(() => {
		clearBreadcrumbs()
	})

	test('breadcrumbs should be available for error context', () => {
		// Simulate logging before an error
		addBreadcrumb({ level: 'info', message: 'User clicked button' })
		addBreadcrumb({ level: 'debug', message: 'Fetching data...' })
		addBreadcrumb({ level: 'warn', message: 'Slow response detected' })

		const crumbs = getBreadcrumbs()

		expect(crumbs.length).toBe(3)
		expect(crumbs.map((c) => c.level)).toEqual(['info', 'debug', 'warn'])
	})

	test('breadcrumbs should be clearable after error handling', () => {
		addBreadcrumb({ message: 'Before error' })

		// Simulate error handling
		const crumbsBeforeClear = getBreadcrumbs()
		expect(crumbsBeforeClear.length).toBe(1)

		clearBreadcrumbs()

		const crumbsAfterClear = getBreadcrumbs()
		expect(crumbsAfterClear.length).toBe(0)
	})
})

describe('VestigErrorBoundary Component', () => {
	beforeEach(() => {
		clearBreadcrumbs()
	})

	describe('component structure', () => {
		test('should be a valid React component', () => {
			expect(VestigErrorBoundary).toBeDefined()
			expect(typeof VestigErrorBoundary).toBe('function')
		})

		test('should return valid React element', () => {
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Hello World'),
			})

			expect(element).toBeDefined()
			expect(element.type).toBe(VestigErrorBoundary)
			expect(element.props.children).toBeDefined()
		})

		test('should accept children prop', () => {
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Test content'),
			})

			expect(element.props.children.props.children).toBe('Test content')
		})
	})

	describe('props', () => {
		test('should accept fallback as ReactNode', () => {
			const fallback = createElement('div', null, 'Error occurred')
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Normal content'),
				fallback,
			})

			expect(element.props.fallback).toBe(fallback)
		})

		test('should accept maxBreadcrumbs prop', () => {
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Content'),
				maxBreadcrumbs: 5,
			})

			expect(element.props.maxBreadcrumbs).toBe(5)
		})

		test('should accept onError callback prop', () => {
			const onError = mock(() => {})
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Content'),
				onError,
			})

			expect(element.props.onError).toBe(onError)
		})

		test('should accept resetOnNavigation prop', () => {
			const element = createElement(VestigErrorBoundary, {
				children: createElement('div', null, 'Content'),
				resetOnNavigation: false,
			})

			expect(element.props.resetOnNavigation).toBe(false)
		})
	})

	describe('exports', () => {
		test('should export VestigErrorBoundary component', async () => {
			const module = await import('../../client/error-boundary')
			expect(module.VestigErrorBoundary).toBeDefined()
			expect(typeof module.VestigErrorBoundary).toBe('function')
		})

		test('should export breadcrumb utilities', async () => {
			const module = await import('../../client/error-boundary')
			expect(module.addBreadcrumb).toBeDefined()
			expect(module.getBreadcrumbs).toBeDefined()
			expect(module.clearBreadcrumbs).toBeDefined()
		})

		test('should export from client index', async () => {
			const client = await import('../../client')
			expect(client.VestigErrorBoundary).toBeDefined()
			expect(client.addBreadcrumb).toBeDefined()
			expect(client.getBreadcrumbs).toBeDefined()
			expect(client.clearBreadcrumbs).toBeDefined()
		})
	})

	describe('type exports', () => {
		test('should export VestigErrorBoundaryProps type', async () => {
			// TypeScript compile-time check
			const props: VestigErrorBoundaryProps = {
				children: createElement('div', null, 'Test'),
				fallback: createElement('div', null, 'Error'),
				onError: () => {},
				maxBreadcrumbs: 10,
				resetOnNavigation: true,
			}

			expect(props.children).toBeDefined()
			expect(props.fallback).toBeDefined()
			expect(props.onError).toBeDefined()
			expect(props.maxBreadcrumbs).toBe(10)
			expect(props.resetOnNavigation).toBe(true)
		})

		test('should allow fallback as function type', () => {
			// TypeScript compile-time check
			const props: VestigErrorBoundaryProps = {
				children: createElement('div', null, 'Test'),
				fallback: (error, errorInfo) => createElement('div', null, `Error: ${error.message}`),
			}

			expect(typeof props.fallback).toBe('function')
		})

		test('should allow minimal props (only children)', () => {
			const props: VestigErrorBoundaryProps = {
				children: createElement('div', null, 'Just children'),
			}

			expect(props.children).toBeDefined()
		})
	})
})

describe('VestigErrorBoundary integration', () => {
	beforeEach(() => {
		clearBreadcrumbs()
	})

	test('breadcrumbs should accumulate with component lifecycle', () => {
		// Simulate logging before rendering
		addBreadcrumb({ level: 'info', message: 'App mounted' })
		addBreadcrumb({ level: 'info', message: 'User navigated to page' })

		// Create component element
		const element = createElement(VestigErrorBoundary, {
			children: createElement('div', null, 'Page content'),
		})

		// Breadcrumbs should still be available
		const crumbs = getBreadcrumbs()
		expect(crumbs.length).toBe(2)
		expect(crumbs[0]?.message).toBe('App mounted')
		expect(crumbs[1]?.message).toBe('User navigated to page')
	})

	test('should work without VestigProvider (component creation)', () => {
		// VestigErrorBoundary should work standalone
		const element = createElement(VestigErrorBoundary, {
			children: createElement('div', null, 'Standalone usage'),
		})

		expect(element).toBeDefined()
		expect(element.type).toBe(VestigErrorBoundary)
	})

	test('should support nested error boundaries', () => {
		const inner = createElement(VestigErrorBoundary, {
			fallback: createElement('div', null, 'Inner fallback'),
			children: createElement('div', null, 'Nested content'),
		})

		const outer = createElement(VestigErrorBoundary, {
			fallback: createElement('div', null, 'Outer fallback'),
			children: createElement('div', null, inner),
		})

		expect(outer).toBeDefined()
		expect(outer.props.children.props.children.type).toBe(VestigErrorBoundary)
	})

	test('should preserve breadcrumb order for debugging', () => {
		// Simulate realistic logging pattern
		addBreadcrumb({ level: 'info', message: 'Component mounted' })
		addBreadcrumb({ level: 'debug', message: 'Fetching user data' })
		addBreadcrumb({ level: 'info', message: 'User data received' })
		addBreadcrumb({ level: 'debug', message: 'Rendering dashboard' })
		addBreadcrumb({ level: 'warn', message: 'Slow API response' })

		const crumbs = getBreadcrumbs()
		const levels = crumbs.map((c) => c.level)

		expect(levels).toEqual(['info', 'debug', 'info', 'debug', 'warn'])
	})

	test('breadcrumbs should contain all log entry fields', () => {
		addBreadcrumb({
			timestamp: '2025-01-01T12:00:00.000Z',
			level: 'error',
			message: 'Critical failure',
			namespace: 'app:core',
		})

		const crumbs = getBreadcrumbs()
		expect(crumbs[0]).toEqual({
			timestamp: '2025-01-01T12:00:00.000Z',
			level: 'error',
			message: 'Critical failure',
			namespace: 'app:core',
		})
	})

	test('error boundary should work with all fallback types', () => {
		// String fallback
		const stringFallback = createElement(VestigErrorBoundary, {
			children: createElement('div'),
			fallback: 'Error occurred',
		})
		expect(stringFallback.props.fallback).toBe('Error occurred')

		// ReactNode fallback
		const nodeFallback = createElement(VestigErrorBoundary, {
			children: createElement('div'),
			fallback: createElement('div', { className: 'error' }, 'Custom Error'),
		})
		expect(nodeFallback.props.fallback.props.className).toBe('error')

		// Function fallback
		const fnFallback = (error: Error) => createElement('p', null, error.message)
		const functionFallback = createElement(VestigErrorBoundary, {
			children: createElement('div'),
			fallback: fnFallback,
		})
		expect(typeof functionFallback.props.fallback).toBe('function')
	})
})
