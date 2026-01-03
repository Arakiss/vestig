'use client'

import { type CSSProperties, memo, useState } from 'react'
import { useRouteMetricsData } from '../metrics/hooks/use-route-metrics'
import { useWebVitalsData, useWebVitalsSummary } from '../metrics/hooks/use-web-vitals'
import { metricsStore } from '../metrics/store'
import type { WebVitalName } from '../metrics/types'
import { MetricsCard } from './metrics-card'
import { MetricsHistogram } from './metrics-histogram'

interface MetricsPanelProps {
	/** Enable Web Vitals collection when panel is open */
	captureWebVitals?: boolean
}

/**
 * Panel for displaying Core Web Vitals and Route Metrics
 */
export const MetricsPanel = memo(function MetricsPanel({
	captureWebVitals = true,
}: MetricsPanelProps) {
	const vitals = useWebVitalsData()
	const summaries = useWebVitalsSummary()
	const routeMetrics = useRouteMetricsData()
	const [selectedVital, setSelectedVital] = useState<WebVitalName | null>(null)

	const containerStyle: CSSProperties = {
		flex: 1,
		overflow: 'auto',
		padding: '12px',
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	}

	const sectionTitleStyle: CSSProperties = {
		fontSize: '11px',
		fontWeight: 600,
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		marginBottom: '8px',
	}

	const gridStyle: CSSProperties = {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
		gap: '8px',
	}

	const emptyStyle: CSSProperties = {
		textAlign: 'center',
		padding: '40px 20px',
		color: '#9ca3af',
		fontSize: '12px',
	}

	const routeListStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
	}

	const routeItemStyle: CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '8px 10px',
		backgroundColor: '#f9fafb',
		borderRadius: '6px',
		fontSize: '11px',
	}

	const routePathStyle: CSSProperties = {
		color: '#374151',
		fontFamily: 'ui-monospace, SFMono-Regular, monospace',
	}

	const routeValueStyle: CSSProperties = {
		color: '#6b7280',
	}

	const histogramWrapperStyle: CSSProperties = {
		backgroundColor: '#f9fafb',
		borderRadius: '8px',
		marginTop: '8px',
	}

	const vitalNames: WebVitalName[] = ['LCP', 'CLS', 'INP', 'TTFB', 'FCP']
	const hasVitals = Object.keys(vitals).length > 0
	const hasRouteMetrics = routeMetrics.length > 0

	if (!hasVitals && !hasRouteMetrics) {
		return (
			<div style={containerStyle}>
				<div style={emptyStyle}>
					<div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
					<div style={{ fontWeight: 500, marginBottom: '4px' }}>No metrics yet</div>
					<div style={{ opacity: 0.7 }}>
						Metrics will appear as you navigate the app.
						<br />
						Add <code>&lt;VestigMetrics /&gt;</code> to capture Web Vitals.
					</div>
				</div>
			</div>
		)
	}

	return (
		<div style={containerStyle}>
			{/* Core Web Vitals Section */}
			{hasVitals && (
				<div>
					<div style={sectionTitleStyle}>Core Web Vitals</div>
					<div style={gridStyle}>
						{vitalNames.map((name) => {
							const latest = vitals[name]
							const summary = summaries[name]
							if (!latest && !summary) return null

							return (
								<div
									key={name}
									onClick={() => setSelectedVital(selectedVital === name ? null : name)}
									style={{ cursor: 'pointer' }}
								>
									<MetricsCard name={name} latest={latest} summary={summary} />
								</div>
							)
						})}
					</div>

					{/* Histogram for selected vital */}
					{selectedVital && (
						<div style={histogramWrapperStyle}>
							<MetricsHistogram
								name={selectedVital}
								buckets={metricsStore.getHistogram(selectedVital)}
							/>
						</div>
					)}
				</div>
			)}

			{/* Route Metrics Section */}
			{hasRouteMetrics && (
				<div>
					<div style={sectionTitleStyle}>Route Metrics</div>
					<div style={routeListStyle}>
						{routeMetrics.slice(-10).map((metric) => (
							<div key={metric.id} style={routeItemStyle}>
								<span style={routePathStyle}>{metric.metadata.pathname ?? '/'}</span>
								<span style={routeValueStyle}>
									{metric.name === 'hydration' && '🌊 '}
									{metric.name === 'navigation' && '🧭 '}
									{metric.value.toFixed(1)}ms
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
})
