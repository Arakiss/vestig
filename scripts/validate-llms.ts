#!/usr/bin/env bun

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const WEB_ROOT = resolve(ROOT, 'apps/web')
const CONTENT_DIR = resolve(WEB_ROOT, 'content/llm')
const LLMS_TXT = resolve(WEB_ROOT, 'public/llms.txt')
const LLMS_FULL = resolve(WEB_ROOT, 'public/llms-full.txt')

const REQUIRED_PHRASES = [
	'Agent Quickstart',
	'createLogger',
	'HTTPTransport',
	'BatchTransportError',
	'logger.flush',
	'configureServerLogger',
	'VestigProvider',
	'endpoint={false}',
	'Cloudflare Workers',
	'VESTIG_SANITIZE',
	'Runtime constraints',
	'Failure behavior',
]

function fail(message: string): never {
	console.error(`llms: ${message}`)
	process.exit(1)
}

function read(path: string): string {
	return readFileSync(path, 'utf-8')
}

function main(): void {
	if (!existsSync(LLMS_TXT)) fail('apps/web/public/llms.txt is missing')
	if (!existsSync(LLMS_FULL)) fail('apps/web/public/llms-full.txt is missing')

	const index = read(LLMS_TXT)
	const full = read(LLMS_FULL)
	const normalizedFull = full.toLowerCase()

	if (!index.includes('https://vestig.dev/llms-full.txt')) {
		fail('llms.txt must link to llms-full.txt')
	}

	for (const phrase of REQUIRED_PHRASES) {
		if (!normalizedFull.includes(phrase.toLowerCase())) {
			fail(`llms-full.txt is missing required agent-facing phrase: ${phrase}`)
		}
	}

	const contentFiles = readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.md'))
	for (const file of contentFiles) {
		const content = read(resolve(CONTENT_DIR, file))
		const heading = content.match(/^#\s+(.+)$/m)?.[1]
		if (heading && !full.includes(`# ${heading}`)) {
			fail(`llms-full.txt is missing content/llm/${file}`)
		}
	}

	console.log(`llms: ${contentFiles.length} supplemental LLM document(s) are included`)
}

main()
