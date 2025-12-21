'use server'

import { vestigAction } from '@vestig/next'

/**
 * Example server action: Submit a form
 */
export const submitFormAction = vestigAction(
	async (data: { name: string; email: string }, { log, ctx }) => {
		log.info('Processing form submission', {
			requestId: ctx.requestId,
			inputType: 'object',
		})

		log.debug('Validating input data', {
			hasName: !!data.name,
			hasEmail: !!data.email,
		})

		// Simulate validation
		if (!data.name || data.name.length < 2) {
			log.warn('Validation failed: name too short')
			throw new Error('Name must be at least 2 characters')
		}

		if (!data.email || !data.email.includes('@')) {
			log.warn('Validation failed: invalid email')
			throw new Error('Invalid email address')
		}

		// Simulate database write
		log.debug('Writing to database...')
		await new Promise((r) => setTimeout(r, 300))

		const result = {
			success: true,
			id: crypto.randomUUID(),
			message: `Form submitted for ${data.name}`,
		}

		log.info('Form submission completed', {
			userId: result.id,
			email: data.email, // Will be sanitized
		})

		return result
	},
	{
		namespace: 'actions:submitForm',
		logInput: false, // Don't log PII
		logOutput: false,
	},
)

/**
 * Example server action: Greet a user
 */
export const greetUserAction = vestigAction(
	async (name: string, { log, ctx }) => {
		log.info('Generating greeting', {
			requestId: ctx.requestId,
			nameLength: name.length,
		})

		// Simulate some processing
		await new Promise((r) => setTimeout(r, 100))

		const greeting = `Hello, ${name}! Welcome to Vestig.`

		log.debug('Greeting generated', {
			greetingLength: greeting.length,
		})

		return { greeting, timestamp: new Date().toISOString() }
	},
	{ namespace: 'actions:greetUser' },
)

/**
 * Example server action: Simulate an error
 */
export const simulateErrorAction = vestigAction(
	async (_input: void, { log, ctx }) => {
		log.info('Starting error simulation', {
			requestId: ctx.requestId,
		})

		await new Promise((r) => setTimeout(r, 200))

		log.warn('About to throw simulated error')

		// This error will be caught and logged by vestigAction
		throw new Error('This is a simulated error for demo purposes')
	},
	{ namespace: 'actions:simulateError' },
)
