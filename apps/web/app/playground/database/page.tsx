import type { Metadata } from 'next'
import { DatabaseClient } from './database-client'

export const metadata: Metadata = {
	title: 'Database Logging',
	description:
		'Query logging for Prisma and Drizzle ORMs with slow query detection and parameter sanitization.',
}

export default function DatabasePage() {
	return <DatabaseClient />
}
