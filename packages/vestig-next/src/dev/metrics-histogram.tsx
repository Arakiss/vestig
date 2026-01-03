'use client'

import { type CSSProperties, memo } from 'react'
import { RATING_COLORS, THRESHOLDS } from '../metrics/thresholds'
import type { HistogramBucket, WebVitalName } from '../metrics/types'

interface MetricsHistogramProps {
	name: WebVitalName
	buckets: HistogramBucket[]
	height?: number
}

/**
 * Histogram visualization for metric distribution
 */
export const MetricsHistogram = memo(function MetricsHistogram({
	name,
	buckets,
	height = 80,
}: MetricsHistogramProps) {
	if (buckets.length === 0) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
				No data available
			</div>
		)
	}

	const threshold = THRESHOLDS[name]
	const maxPercentage = Math.max(...buckets.map((b) => b.percentage), 1)

	const containerStyle: CSSProperties = {
		padding: '12px',
	}

	const titleStyle: CSSProperties = {
		fontSize: '11px',
		fontWeight: 600,
		color: '#374151',
		marginBottom: '8px',
	}

	const chartStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'flex-end',
		gap: '2px',
		height: `${height}px`,
	}

	const getBarColor = (min: number): string => {
		if (min < threshold.good) return RATING_COLORS.good.bg
		if (min < threshold.poor) return RATING_COLORS['needs-improvement'].bg
		return RATING_COLORS.poor.bg
	}

	const getBarBorder = (min: number): string => {
		if (min < threshold.good) return RATING_COLORS.good.border
		if (min < threshold.poor) return RATING_COLORS['needs-improvement'].border
		return RATING_COLORS.poor.border
	}

	const labelStyle: CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '9px',
		color: '#9ca3af',
		marginTop: '4px',
	}

	const formatValue = (val: number): string => {
		if (threshold.unit === 'score') return val.toFixed(2)
		return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${Math.round(val)}ms`
	}

	return (
		<div style={containerStyle}>
			<div style={titleStyle}>{name} Distribution</div>

			<div style={chartStyle}>
				{buckets.map((bucket, i) => {
					const barHeight = (bucket.percentage / maxPercentage) * height
					const barStyle: CSSProperties = {
						flex: 1,
						height: `${barHeight}px`,
						minHeight: bucket.count > 0 ? '4px' : '1px',
						backgroundColor: getBarColor(bucket.min),
						border: `1px solid ${getBarBorder(bucket.min)}`,
						borderRadius: '2px 2px 0 0',
						transition: 'height 0.2s ease',
					}

					return (
						<div
							key={i}
							style={barStyle}
							title={`${formatValue(bucket.min)} - ${formatValue(bucket.max)}: ${bucket.count} (${bucket.percentage.toFixed(1)}%)`}
						/>
					)
				})}
			</div>

			<div style={labelStyle}>
				<span>{formatValue(buckets[0]?.min ?? 0)}</span>
				<span>{formatValue(buckets[buckets.length - 1]?.max ?? 0)}</span>
			</div>
		</div>
	)
})
