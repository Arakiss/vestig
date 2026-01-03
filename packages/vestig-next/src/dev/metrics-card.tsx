'use client'

import { type CSSProperties, memo } from 'react'
import {
	RATING_COLORS,
	THRESHOLDS,
	formatMetricValue,
	getMetricDescription,
} from '../metrics/thresholds'
import type { MetricEntry, MetricRating, WebVitalName } from '../metrics/types'

interface MetricsCardProps {
	name: WebVitalName
	latest?: MetricEntry
	/** If provided, shows summary stats */
	summary?: {
		count: number
		avg: number
		p75: number
		rating: MetricRating
	}
}

/**
 * Card component for displaying a single Web Vital metric
 */
export const MetricsCard = memo(function MetricsCard({ name, latest, summary }: MetricsCardProps) {
	const rating = latest?.rating ?? summary?.rating ?? 'needs-improvement'
	const colors = RATING_COLORS[rating]
	const threshold = THRESHOLDS[name]
	const value = latest?.value ?? summary?.avg ?? 0

	const cardStyle: CSSProperties = {
		backgroundColor: colors.bg,
		border: `1px solid ${colors.border}`,
		borderRadius: '8px',
		padding: '12px',
		display: 'flex',
		flexDirection: 'column',
		gap: '6px',
	}

	const headerStyle: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	}

	const nameStyle: CSSProperties = {
		fontSize: '12px',
		fontWeight: 600,
		color: colors.text,
	}

	const ratingBadgeStyle: CSSProperties = {
		fontSize: '9px',
		fontWeight: 600,
		textTransform: 'uppercase',
		padding: '2px 6px',
		borderRadius: '4px',
		backgroundColor: colors.text,
		color: colors.bg,
	}

	const valueStyle: CSSProperties = {
		fontSize: '24px',
		fontWeight: 700,
		color: colors.text,
		letterSpacing: '-0.5px',
	}

	const descriptionStyle: CSSProperties = {
		fontSize: '10px',
		color: colors.text,
		opacity: 0.7,
	}

	const thresholdStyle: CSSProperties = {
		fontSize: '10px',
		color: colors.text,
		opacity: 0.6,
		marginTop: '4px',
		display: 'flex',
		gap: '8px',
	}

	const statsStyle: CSSProperties = {
		display: 'flex',
		gap: '12px',
		marginTop: '4px',
		fontSize: '10px',
		color: colors.text,
		opacity: 0.8,
	}

	const formatThreshold = (val: number): string => {
		if (threshold.unit === 'score') return val.toString()
		return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val}ms`
	}

	return (
		<div style={cardStyle}>
			<div style={headerStyle}>
				<span style={nameStyle}>{name}</span>
				<span style={ratingBadgeStyle}>{rating.replace('-', ' ')}</span>
			</div>

			<div style={valueStyle}>{formatMetricValue(name, value)}</div>

			<div style={descriptionStyle}>{getMetricDescription(name)}</div>

			{summary && summary.count > 1 && (
				<div style={statsStyle}>
					<span>Samples: {summary.count}</span>
					<span>P75: {formatMetricValue(name, summary.p75)}</span>
				</div>
			)}

			<div style={thresholdStyle}>
				<span>Good: &lt;{formatThreshold(threshold.good)}</span>
				<span>Poor: &gt;{formatThreshold(threshold.poor)}</span>
			</div>
		</div>
	)
})
