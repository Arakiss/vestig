import { describe, expect, test } from 'bun:test'
import { createWideEvent } from '../../wide-events/builder'
import { httpFields, jobFields, HTTP_EVENT_TYPES, JOB_EVENT_TYPES } from '../../wide-events/schemas'

describe('HTTP event schema', () => {
	test('should have correct event type constants', () => {
		expect(HTTP_EVENT_TYPES.REQUEST).toBe('http.request')
		expect(HTTP_EVENT_TYPES.RESPONSE).toBe('http.response')
		expect(HTTP_EVENT_TYPES.ERROR).toBe('http.error')
	})

	test('httpFields should pass through fields correctly', () => {
		const fields = httpFields({
			http: { method: 'POST', path: '/api/checkout', status_code: 200 },
			user: { id: 'user-123', subscription: 'premium' },
			performance: { db_query_count: 3, cache_hits: 2 },
		})

		expect(fields.http?.method).toBe('POST')
		expect(fields.http?.path).toBe('/api/checkout')
		expect(fields.user?.id).toBe('user-123')
		expect(fields.performance?.db_query_count).toBe(3)
	})

	test('should work with createWideEvent', () => {
		const event = createWideEvent({ type: HTTP_EVENT_TYPES.REQUEST })

		event.mergeAll(
			httpFields({
				http: { method: 'GET', path: '/api/users', status_code: 200 },
				user: { id: 'user-456' },
			}),
		)

		expect(event.get('http', 'method')).toBe('GET')
		expect(event.get('user', 'id')).toBe('user-456')

		const wideEvent = event.end()
		expect(wideEvent.event_type).toBe('http.request')
		expect(wideEvent.fields.http?.method).toBe('GET')
	})

	test('should support all HTTP field categories', () => {
		const fields = httpFields({
			http: {
				method: 'POST',
				path: '/api/checkout',
				status_code: 500,
				client_ip: '192.168.1.1',
			},
			user: {
				id: 'user-123',
				subscription: 'enterprise',
				account_age_days: 365,
			},
			performance: {
				duration_ms: 1247,
				db_query_count: 5,
				cache_hits: 10,
				external_call_count: 2,
			},
			error: {
				type: 'PaymentError',
				code: 'CARD_DECLINED',
				retriable: false,
			},
			service: {
				name: 'checkout-api',
				version: '2.4.1',
				region: 'us-east-1',
			},
			feature_flags: {
				new_checkout: true,
				beta_features: false,
			},
		})

		expect(fields.http?.method).toBe('POST')
		expect(fields.user?.subscription).toBe('enterprise')
		expect(fields.performance?.duration_ms).toBe(1247)
		expect(fields.error?.type).toBe('PaymentError')
		expect(fields.service?.name).toBe('checkout-api')
		expect(fields.feature_flags?.new_checkout).toBe(true)
	})
})

describe('Job event schema', () => {
	test('should have correct event type constants', () => {
		expect(JOB_EVENT_TYPES.EXECUTE).toBe('job.execute')
		expect(JOB_EVENT_TYPES.COMPLETE).toBe('job.complete')
		expect(JOB_EVENT_TYPES.FAIL).toBe('job.fail')
		expect(JOB_EVENT_TYPES.RETRY).toBe('job.retry')
		expect(JOB_EVENT_TYPES.CANCEL).toBe('job.cancel')
	})

	test('jobFields should pass through fields correctly', () => {
		const fields = jobFields({
			job: { id: 'job-123', type: 'email_digest', attempt: 1 },
			job_data: { input_count: 100, success_count: 98, failure_count: 2 },
			performance: { duration_ms: 5420, db_query_count: 50 },
		})

		expect(fields.job?.id).toBe('job-123')
		expect(fields.job?.type).toBe('email_digest')
		expect(fields.job_data?.input_count).toBe(100)
		expect(fields.performance?.duration_ms).toBe(5420)
	})

	test('should work with createWideEvent', () => {
		const event = createWideEvent({ type: JOB_EVENT_TYPES.EXECUTE })

		event.mergeAll(
			jobFields({
				job: { id: 'job-456', type: 'data_sync', queue: 'high-priority' },
				job_data: { input_count: 1000 },
			}),
		)

		expect(event.get('job', 'id')).toBe('job-456')
		expect(event.get('job', 'queue')).toBe('high-priority')

		const wideEvent = event.end()
		expect(wideEvent.event_type).toBe('job.execute')
		expect(wideEvent.fields.job?.type).toBe('data_sync')
	})

	test('should support all job field categories', () => {
		const fields = jobFields({
			job: {
				id: 'job-789',
				type: 'report_generation',
				queue: 'low-priority',
				priority: 10,
				attempt: 2,
				max_attempts: 5,
				status: 'failed',
				worker_id: 'worker-01',
			},
			job_data: {
				input_count: 500,
				success_count: 450,
				failure_count: 50,
				output_size_bytes: 1024000,
			},
			performance: {
				duration_ms: 12500,
				queue_time_ms: 500,
				processing_time_ms: 12000,
				db_query_count: 100,
				external_call_count: 5,
			},
			error: {
				type: 'TimeoutError',
				code: 'EXTERNAL_API_TIMEOUT',
				message: 'External API did not respond in time',
				retriable: true,
				backoff_ms: 5000,
			},
		})

		expect(fields.job?.id).toBe('job-789')
		expect(fields.job?.status).toBe('failed')
		expect(fields.job_data?.success_count).toBe(450)
		expect(fields.performance?.processing_time_ms).toBe(12000)
		expect(fields.error?.retriable).toBe(true)
	})
})
