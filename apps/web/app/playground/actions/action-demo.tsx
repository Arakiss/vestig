'use client'

import { useState } from 'react'
import { useLogger } from '@vestig/next/client'
import { submitFormAction, greetUserAction, simulateErrorAction } from './actions'

export function ActionDemo() {
	const log = useLogger('actions-demo:client')
	const [results, setResults] = useState<Array<{ action: string; result: unknown; time: string }>>(
		[],
	)
	const [loading, setLoading] = useState<string | null>(null)

	const runAction = async (name: string, action: () => Promise<unknown>) => {
		setLoading(name)
		log.info('Invoking server action', { action: name })

		const startTime = performance.now()
		try {
			const result = await action()
			const duration = (performance.now() - startTime).toFixed(2)

			log.info('Server action completed', {
				action: name,
				duration: `${duration}ms`,
				success: true,
			})

			setResults((prev) => [
				{
					action: name,
					result,
					time: new Date().toLocaleTimeString(),
				},
				...prev.slice(0, 4),
			])
		} catch (error) {
			const duration = (performance.now() - startTime).toFixed(2)

			log.error('Server action failed', {
				action: name,
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : String(error),
			})

			setResults((prev) => [
				{
					action: name,
					result: { error: error instanceof Error ? error.message : 'Unknown error' },
					time: new Date().toLocaleTimeString(),
				},
				...prev.slice(0, 4),
			])
		} finally {
			setLoading(null)
		}
	}

	return (
		<div className="space-y-4">
			{/* Action buttons */}
			<div className="flex flex-wrap gap-3">
				<button
					onClick={() =>
						runAction('submitForm', () =>
							submitFormAction({ name: 'John Doe', email: 'john@example.com' }),
						)
					}
					disabled={loading !== null}
					className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
				>
					{loading === 'submitForm' ? 'Submitting...' : 'Submit Form'}
				</button>

				<button
					onClick={() => runAction('greetUser', () => greetUserAction('World'))}
					disabled={loading !== null}
					className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
				>
					{loading === 'greetUser' ? 'Greeting...' : 'Greet User'}
				</button>

				<button
					onClick={() => runAction('simulateError', simulateErrorAction)}
					disabled={loading !== null}
					className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
				>
					{loading === 'simulateError' ? 'Simulating...' : 'Simulate Error'}
				</button>
			</div>

			{/* Results */}
			{results.length > 0 && (
				<div className="mt-4">
					<h4 className="text-sm font-medium text-gray-400 mb-2">Recent Results</h4>
					<div className="space-y-2">
						{results.map((r, i) => (
							<div
								key={`${r.action}-${r.time}-${i}`}
								className="bg-gray-900/50 border border-white/10 rounded-lg p-3 text-sm"
							>
								<div className="flex justify-between items-center mb-1">
									<span className="font-medium text-white">{r.action}</span>
									<span className="text-gray-500 text-xs">{r.time}</span>
								</div>
								<pre className="text-xs text-gray-400 overflow-x-auto">
									{JSON.stringify(r.result, null, 2)}
								</pre>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Instructions */}
			<div className="mt-4 text-xs text-gray-500">
				💡 Click the buttons above and watch the log panel below for real-time action logs
			</div>
		</div>
	)
}
