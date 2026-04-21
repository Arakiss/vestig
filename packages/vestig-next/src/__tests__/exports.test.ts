import { describe, expect, test } from 'bun:test'

describe('@vestig/next public exports', () => {
	test('exports server logger configuration API', async () => {
		const mod = await import('../index')

		expect(mod.configureServerLogger).toBeDefined()
		expect(typeof mod.configureServerLogger).toBe('function')
	})
})
