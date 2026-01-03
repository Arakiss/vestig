#!/usr/bin/env bun
/**
 * Generate llms.txt files for AI context
 *
 * This script generates:
 * - /public/llms.txt - Basic overview for quick context
 * - /public/llms-full.txt - Complete API reference
 *
 * Run: bun scripts/generate-llms.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const contentDir = join(rootDir, 'content', 'llm')
const publicDir = join(rootDir, 'public')

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true })

// Read source files
const overview = readFileSync(join(contentDir, 'overview.md'), 'utf-8')
const apiReference = readFileSync(join(contentDir, 'api-reference.md'), 'utf-8')

// Generate llms.txt (basic)
const llmsTxt = overview
writeFileSync(join(publicDir, 'llms.txt'), llmsTxt)
console.log('✓ Generated /public/llms.txt')

// Generate llms-full.txt (complete)
const llmsFullTxt = `${overview}\n\n---\n\n${apiReference}`
writeFileSync(join(publicDir, 'llms-full.txt'), llmsFullTxt)
console.log('✓ Generated /public/llms-full.txt')

console.log('\nDone! LLM context files generated.')
