import { describe, expect, test } from 'bun:test'
import { getErrorMessage, isError, serializeError } from '../utils/error'

describe('isError', () => {
	test('should return true for Error instances', () => {
		expect(isError(new Error('test'))).toBe(true)
		expect(isError(new TypeError('test'))).toBe(true)
		expect(isError(new RangeError('test'))).toBe(true)
		expect(isError(new SyntaxError('test'))).toBe(true)
	})

	test('should return true for error-like objects', () => {
		expect(isError({ message: 'test error' })).toBe(true)
		expect(isError({ message: 'test', name: 'CustomError' })).toBe(true)
	})

	test('should return false for non-error values', () => {
		expect(isError(null)).toBe(false)
		expect(isError(undefined)).toBe(false)
		expect(isError('error string')).toBe(false)
		expect(isError(123)).toBe(false)
		expect(isError({})).toBe(false)
		expect(isError({ name: 'Error' })).toBe(false) // missing message
		expect(isError({ message: 123 })).toBe(false) // message not string
	})

	test('should return false for arrays', () => {
		expect(isError(['error'])).toBe(false)
		expect(isError([{ message: 'test' }])).toBe(false)
	})
})

describe('serializeError', () => {
	test('should serialize basic Error', () => {
		const error = new Error('test message')
		const serialized = serializeError(error)

		expect(serialized).toBeDefined()
		expect(serialized?.name).toBe('Error')
		expect(serialized?.message).toBe('test message')
		expect(serialized?.stack).toContain('test message')
	})

	test('should serialize TypeError', () => {
		const error = new TypeError('type error')
		const serialized = serializeError(error)

		expect(serialized?.name).toBe('TypeError')
		expect(serialized?.message).toBe('type error')
	})

	test('should extract code property', () => {
		const error = new Error('test') as Error & { code: string }
		error.code = 'ENOENT'
		const serialized = serializeError(error)

		expect(serialized?.code).toBe('ENOENT')
	})

	test('should extract statusCode property', () => {
		const error = new Error('not found') as Error & { statusCode: number }
		error.statusCode = 404
		const serialized = serializeError(error)

		expect(serialized?.statusCode).toBe(404)
	})

	test('should handle error cause chain', () => {
		const cause = new Error('root cause')
		const error = new Error('outer error', { cause })
		const serialized = serializeError(error)

		expect(serialized?.cause).toBeDefined()
		expect(serialized?.cause?.message).toBe('root cause')
	})

	test('should handle nested cause chain', () => {
		const rootCause = new Error('root')
		const middleCause = new Error('middle', { cause: rootCause })
		const error = new Error('outer', { cause: middleCause })
		const serialized = serializeError(error)

		expect(serialized?.cause?.message).toBe('middle')
		expect(serialized?.cause?.cause?.message).toBe('root')
	})

	test('should serialize error-like objects', () => {
		const errorLike = { message: 'error message', name: 'CustomError' }
		const serialized = serializeError(errorLike)

		expect(serialized?.name).toBe('CustomError')
		expect(serialized?.message).toBe('error message')
	})

	test('should serialize error-like objects without name', () => {
		const errorLike = { message: 'error message' }
		const serialized = serializeError(errorLike)

		expect(serialized?.name).toBe('Error')
		expect(serialized?.message).toBe('error message')
	})

	test('should serialize string errors', () => {
		const serialized = serializeError('string error')

		expect(serialized?.name).toBe('Error')
		expect(serialized?.message).toBe('string error')
	})

	test('should return undefined for falsy values', () => {
		expect(serializeError(null)).toBeUndefined()
		expect(serializeError(undefined)).toBeUndefined()
		expect(serializeError(0)).toBeUndefined()
		expect(serializeError('')).toBeUndefined()
	})

	test('should return undefined for non-error objects without message', () => {
		expect(serializeError({ name: 'Error' })).toBeUndefined()
		expect(serializeError({ foo: 'bar' })).toBeUndefined()
	})

	test('should handle max depth to prevent infinite loops', () => {
		// Create a deeply nested cause chain
		let error: Error = new Error('level 0')
		for (let i = 1; i <= 15; i++) {
			error = new Error(`level ${i}`, { cause: error })
		}

		const serialized = serializeError(error)
		expect(serialized).toBeDefined()
		// Should not throw and should eventually stop at max depth
	})

	test('should extract additional error properties', () => {
		const error = new Error('test') as Error & {
			errno: number
			syscall: string
			path: string
			address: string
			port: number
		}
		error.errno = -2
		error.syscall = 'open'
		error.path = '/test/path'
		error.address = '127.0.0.1'
		error.port = 8080

		const serialized = serializeError(error)

		expect(serialized?.errno).toBe(-2)
		expect(serialized?.syscall).toBe('open')
		expect(serialized?.path).toBe('/test/path')
		expect(serialized?.address).toBe('127.0.0.1')
		expect(serialized?.port).toBe(8080)
	})
})

describe('getErrorMessage', () => {
	test('should extract message from Error', () => {
		expect(getErrorMessage(new Error('test message'))).toBe('test message')
	})

	test('should return string directly', () => {
		expect(getErrorMessage('string error')).toBe('string error')
	})

	test('should extract message from error-like object', () => {
		expect(getErrorMessage({ message: 'error message' })).toBe('error message')
	})

	test('should convert other values to string', () => {
		expect(getErrorMessage(123)).toBe('123')
		expect(getErrorMessage(null)).toBe('null')
		expect(getErrorMessage(undefined)).toBe('undefined')
		expect(getErrorMessage(true)).toBe('true')
	})

	test('should handle objects without message', () => {
		expect(getErrorMessage({ foo: 'bar' })).toBe('[object Object]')
	})

	test('should handle arrays', () => {
		expect(getErrorMessage([1, 2, 3])).toBe('1,2,3')
	})
})
