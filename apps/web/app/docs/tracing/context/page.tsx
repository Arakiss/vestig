import Content from './content.mdx'

export const metadata = {
	title: 'Context Propagation',
	description:
		'Automatic context propagation across async operations using AsyncLocalStorage. Correlation IDs, request context, and more.',
}

export default function Page() {
	return <Content />
}
