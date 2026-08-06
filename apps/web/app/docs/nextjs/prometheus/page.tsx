import Content from './content.mdx'

export const metadata = {
	title: 'Prometheus Metrics',
	description:
		'Expose counters, gauges and histograms from a Next.js app on a /metrics endpoint Prometheus can scrape.',
}

export default function Page() {
	return <Content />
}
