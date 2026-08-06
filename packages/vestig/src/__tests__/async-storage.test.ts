import { describe, expect, test } from 'bun:test'
import { createAsyncStorage, loadAsyncLocalStorage } from '../async-storage'

describe('loadAsyncLocalStorage', () => {
	test('resolves AsyncLocalStorage on this runtime', () => {
		expect(loadAsyncLocalStorage()).toBeFunction()
	})

	test('creates a usable store', () => {
		const storage = createAsyncStorage<{ id: string }>()

		expect(storage).not.toBeNull()
		expect(storage?.run({ id: 'a' }, () => storage.getStore()?.id)).toBe('a')
	})

	test('stores are isolated per run', () => {
		const storage = createAsyncStorage<{ id: string }>()

		const outer = storage?.run({ id: 'outer' }, () => {
			const inner = storage.run({ id: 'inner' }, () => storage.getStore()?.id)
			return { inner, after: storage.getStore()?.id }
		})

		expect(outer).toEqual({ inner: 'inner', after: 'outer' })
	})

	test('propagates across await points', async () => {
		const storage = createAsyncStorage<{ id: string }>()

		const seen = await storage?.run({ id: 'req-1' }, async () => {
			await new Promise((resolve) => setTimeout(resolve, 5))
			return storage.getStore()?.id
		})

		expect(seen).toBe('req-1')
	})
})

/**
 * The regression this file exists for.
 *
 * The previous implementation reached `node:async_hooks` through `require`,
 * which does not exist inside a real ESM module. Under Node that threw, the
 * error was swallowed, and every context lookup returned undefined — traces
 * stopped correlating in production while the Bun-based test suite stayed
 * green, because Bun does expose `require` inside ESM.
 */
describe('context propagation under Node ESM', () => {
	function runUnderNode(source: string): string {
		const result = Bun.spawnSync(['node', '--input-type=module', '-e', source], {
			cwd: `${import.meta.dir}/../..`,
		})

		if (result.exitCode !== 0) {
			throw new Error(`Node probe failed (${result.exitCode}): ${result.stderr.toString()}`)
		}

		return result.stdout.toString().trim()
	}

	test('require is genuinely unavailable there', () => {
		const output = runUnderNode(`console.log(typeof require)`)

		expect(output).toBe('undefined')
	})

	test('the built package propagates context under Node', () => {
		const output = runUnderNode(`
			const { withContext, getContext } = await import('./dist/index.js')
			const seen = withContext({ requestId: 'r1' }, () => getContext()?.requestId ?? null)
			console.log(JSON.stringify({ seen }))
		`)

		expect(JSON.parse(output)).toEqual({ seen: 'r1' })
	})

	test('the built package keeps context across await points under Node', () => {
		const output = runUnderNode(`
			const { withContextAsync, getContext } = await import('./dist/index.js')
			const seen = await withContextAsync({ requestId: 'r2' }, async () => {
				await new Promise((r) => setTimeout(r, 5))
				return getContext()?.requestId ?? null
			})
			console.log(JSON.stringify({ seen }))
		`)

		expect(JSON.parse(output)).toEqual({ seen: 'r2' })
	})

	test('spans share a trace id with the logging context under Node', () => {
		const output = runUnderNode(`
			const { span, getContext } = await import('./dist/index.js')
			let inside = null
			const traceId = await span('parent', async () => {
				await new Promise((r) => setTimeout(r, 5))
				inside = getContext()?.traceId ?? null
				return inside
			})
			console.log(JSON.stringify({ correlated: Boolean(traceId) && traceId === inside }))
		`)

		expect(JSON.parse(output)).toEqual({ correlated: true })
	})

	test('concurrent requests keep separate contexts under Node', () => {
		const output = runUnderNode(`
			const { withContextAsync, getContext } = await import('./dist/index.js')
			const seen = await Promise.all([
				withContextAsync({ requestId: 'a' }, async () => {
					await new Promise((r) => setTimeout(r, 10))
					return getContext()?.requestId ?? null
				}),
				withContextAsync({ requestId: 'b' }, async () => {
					await new Promise((r) => setTimeout(r, 1))
					return getContext()?.requestId ?? null
				}),
			])
			console.log(JSON.stringify(seen))
		`)

		expect(JSON.parse(output)).toEqual(['a', 'b'])
	})

	test('the active wide event is visible under Node', () => {
		const output = runUnderNode(`
			const { createWideEvent, withWideEvent, getActiveWideEvent } = await import('./dist/index.js')
			const event = createWideEvent({ type: 'http.request' })
			const seen = withWideEvent(event, () => getActiveWideEvent() !== undefined)
			console.log(JSON.stringify({ seen }))
		`)

		expect(JSON.parse(output)).toEqual({ seen: true })
	})
})
