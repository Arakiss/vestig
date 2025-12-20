import { withVestig } from '@vestig/next'
import { RUNTIME } from 'vestig'

/**
 * Demo API endpoint that demonstrates logging in API Routes
 * using @vestig/next's withVestig wrapper.
 *
 * GET /api/demo - Returns mock data with full logging
 * POST /api/demo - Accepts data and logs the processing
 */

export const GET = withVestig(
	async (request, { log, ctx, timing }) => {
		log.info('API request received', {
			method: 'GET',
			url: request.url,
			runtime: RUNTIME,
		})

		try {
			// Simulate database fetch
			log.debug('Fetching data from database')
			await new Promise((r) => setTimeout(r, 100))

			const data = {
				users: [
					{ id: 1, name: 'Alice', email: 'alice@example.com' },
					{ id: 2, name: 'Bob', email: 'bob@example.com' },
				],
				meta: {
					total: 2,
					page: 1,
					requestId: ctx.requestId,
					traceId: ctx.traceId,
				},
			}

			log.debug('Data fetched successfully', { userCount: data.users.length })

			// Simulate some processing
			log.trace('Processing data')
			await new Promise((r) => setTimeout(r, 50))

			log.info('API response sent', {
				status: 200,
				duration: `${timing.elapsed().toFixed(2)}ms`,
				itemCount: data.users.length,
			})

			return Response.json(data, {
				headers: {
					'X-Request-Id': ctx.requestId!,
					'X-Trace-Id': ctx.traceId!,
				},
			})
		} catch (error) {
			log.error('API request failed', {
				error,
				duration: `${timing.elapsed().toFixed(2)}ms`,
			})

			return Response.json({ error: 'Internal server error', requestId: ctx.requestId }, { status: 500 })
		}
	},
	{ namespace: 'api:demo', level: 'trace' },
)

export const POST = withVestig(
	async (request, { log, ctx, timing }) => {
		log.info('API POST request received', {
			method: 'POST',
			url: request.url,
		})

		try {
			// Parse request body
			log.debug('Parsing request body')
			const body = await request.json()

			log.info('Request body parsed', {
				fieldCount: Object.keys(body).length,
				fields: Object.keys(body),
			})

			// Simulate validation
			log.trace('Validating input')
			await new Promise((r) => setTimeout(r, 50))

			// Log the data (will be sanitized if PII is present)
			log.debug('Processing user data', {
				data: body,
			})

			// Simulate database write
			log.debug('Saving to database')
			await new Promise((r) => setTimeout(r, 100))

			const result = {
				success: true,
				id: Math.floor(Math.random() * 10000),
				requestId: ctx.requestId,
			}

			log.info('POST request completed', {
				status: 201,
				duration: `${timing.elapsed().toFixed(2)}ms`,
				createdId: result.id,
			})

			return Response.json(result, {
				status: 201,
				headers: {
					'X-Request-Id': ctx.requestId!,
					'X-Trace-Id': ctx.traceId!,
				},
			})
		} catch (error) {
			log.error('POST request failed', {
				error,
				duration: `${timing.elapsed().toFixed(2)}ms`,
			})

			return Response.json({ error: 'Bad request', requestId: ctx.requestId }, { status: 400 })
		}
	},
	{ namespace: 'api:demo', level: 'trace' },
)
