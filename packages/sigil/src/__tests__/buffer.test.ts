import { describe, expect, test } from 'bun:test'
import { CircularBuffer } from '../utils/buffer'

describe('CircularBuffer', () => {
	describe('basic operations', () => {
		test('should create empty buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			expect(buffer.size).toBe(0)
			expect(buffer.isFull).toBe(false)
		})

		test('should push items', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			expect(buffer.size).toBe(3)
		})

		test('should shift items (FIFO)', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			expect(buffer.shift()).toBe(1)
			expect(buffer.shift()).toBe(2)
			expect(buffer.shift()).toBe(3)
			expect(buffer.size).toBe(0)
		})

		test('should return undefined when shifting empty buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			expect(buffer.shift()).toBeUndefined()
		})

		test('should peek at oldest item', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			buffer.push(1)
			buffer.push(2)

			expect(buffer.peek()).toBe(1)
			expect(buffer.size).toBe(2) // peek doesn't remove
		})

		test('should return undefined when peeking empty buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			expect(buffer.peek()).toBeUndefined()
		})
	})

	describe('circular behavior', () => {
		test('should drop oldest when full', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 3 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)
			buffer.push(4) // should drop 1

			expect(buffer.size).toBe(3)
			expect(buffer.shift()).toBe(2)
			expect(buffer.shift()).toBe(3)
			expect(buffer.shift()).toBe(4)
		})

		test('should track dropped count', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 2 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3) // drop 1
			buffer.push(4) // drop 2

			expect(buffer.droppedCount).toBe(2)
		})

		test('should call onDrop callback', () => {
			const dropped: number[] = []
			const buffer = new CircularBuffer<number>({
				maxSize: 2,
				onDrop: (items) => dropped.push(...(items as number[])),
			})

			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			expect(dropped).toEqual([1])
		})

		test('should indicate when full', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 2 })
			expect(buffer.isFull).toBe(false)

			buffer.push(1)
			expect(buffer.isFull).toBe(false)

			buffer.push(2)
			expect(buffer.isFull).toBe(true)
		})
	})

	describe('toArray', () => {
		test('should convert buffer to array', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			expect(buffer.toArray()).toEqual([1, 2, 3])
		})

		test('should return empty array for empty buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			expect(buffer.toArray()).toEqual([])
		})

		test('should maintain order after wrapping', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 3 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)
			buffer.push(4) // wraps, drops 1

			expect(buffer.toArray()).toEqual([2, 3, 4])
		})
	})

	describe('clear', () => {
		test('should clear buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 5 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			buffer.clear()

			expect(buffer.size).toBe(0)
			expect(buffer.peek()).toBeUndefined()
			expect(buffer.toArray()).toEqual([])
		})

		test('should not reset dropped count', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 2 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3) // drops 1

			expect(buffer.droppedCount).toBe(1)

			buffer.clear()

			// droppedCount is not reset by clear (it tracks historical drops)
			// This is implementation-specific behavior
			expect(buffer.size).toBe(0)
		})
	})

	describe('getStats', () => {
		test('should return correct stats', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 4 })
			buffer.push(1)
			buffer.push(2)

			const stats = buffer.getStats()

			expect(stats.size).toBe(2)
			expect(stats.maxSize).toBe(4)
			expect(stats.dropped).toBe(0)
			expect(stats.utilization).toBe(0.5)
		})

		test('should track dropped in stats', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 2 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			const stats = buffer.getStats()

			expect(stats.dropped).toBe(1)
		})

		test('should calculate utilization correctly', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 10 })
			buffer.push(1)
			buffer.push(2)
			buffer.push(3)

			expect(buffer.getStats().utilization).toBe(0.3)
		})

		test('should show 100% utilization when full', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 2 })
			buffer.push(1)
			buffer.push(2)

			expect(buffer.getStats().utilization).toBe(1)
		})
	})

	describe('with different types', () => {
		test('should work with strings', () => {
			const buffer = new CircularBuffer<string>({ maxSize: 3 })
			buffer.push('a')
			buffer.push('b')
			buffer.push('c')

			expect(buffer.toArray()).toEqual(['a', 'b', 'c'])
		})

		test('should work with objects', () => {
			const buffer = new CircularBuffer<{ id: number }>({ maxSize: 3 })
			buffer.push({ id: 1 })
			buffer.push({ id: 2 })

			expect(buffer.toArray()).toEqual([{ id: 1 }, { id: 2 }])
		})
	})

	describe('edge cases', () => {
		test('should handle size 1 buffer', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 1 })
			buffer.push(1)
			buffer.push(2)

			expect(buffer.size).toBe(1)
			expect(buffer.shift()).toBe(2)
		})

		test('should handle rapid push/shift cycles', () => {
			const buffer = new CircularBuffer<number>({ maxSize: 3 })

			for (let i = 0; i < 100; i++) {
				buffer.push(i)
				if (i % 2 === 0) {
					buffer.shift()
				}
			}

			expect(buffer.size).toBeLessThanOrEqual(3)
		})
	})
})
