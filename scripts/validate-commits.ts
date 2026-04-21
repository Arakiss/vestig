#!/usr/bin/env bun

import { execFileSync } from 'node:child_process'

const ALLOWED_TYPES = new Set([
	'feat',
	'fix',
	'docs',
	'style',
	'refactor',
	'perf',
	'test',
	'build',
	'ci',
	'chore',
	'revert',
])

interface ParsedArgs {
	from: string
	to: string
}

function fail(message: string): never {
	console.error(`commits: ${message}`)
	process.exit(1)
}

function parseArgs(): ParsedArgs {
	const args = process.argv.slice(2)
	const from = args.find((arg) => arg.startsWith('--from='))?.split('=')[1]
	const to = args.find((arg) => arg.startsWith('--to='))?.split('=')[1]

	if (!from || !to) {
		fail('usage: bun scripts/validate-commits.ts --from=<sha> --to=<sha>')
	}

	return { from, to }
}

export function validateCommitSubject(subject: string): string | null {
	if (subject.startsWith('Merge ')) return null
	if (subject.startsWith('Revert "')) return null

	const match = subject.match(/^([a-z]+)(?:\([a-z0-9._/-]+\))?!?:\s+(.+)$/)
	if (!match) {
		return 'must use conventional commit format: <type>(optional-scope): <subject>'
	}

	const [, type, text] = match
	if (!ALLOWED_TYPES.has(type)) {
		return `uses unsupported type "${type}"`
	}

	if (!text.trim()) {
		return 'must include a non-empty subject'
	}

	return null
}

function getSubjects(from: string, to: string): string[] {
	const output = execFileSync('git', ['log', '--format=%s', `${from}..${to}`], {
		encoding: 'utf-8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim()

	return output ? output.split('\n') : []
}

function main(): void {
	const { from, to } = parseArgs()
	const subjects = getSubjects(from, to)
	const failures: string[] = []

	for (const subject of subjects) {
		const error = validateCommitSubject(subject)
		if (error) failures.push(`${subject} - ${error}`)
	}

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`commits: ${failure}`)
		}
		process.exit(1)
	}

	console.log(`commits: ${subjects.length} commit subject(s) passed`)
}

if (import.meta.main) {
	main()
}
