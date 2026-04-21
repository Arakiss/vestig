import { describe, expect, test } from 'bun:test'
import { validateCommitSubject } from '../validate-commits'

describe('validateCommitSubject', () => {
	test('accepts conventional commit subjects', () => {
		expect(validateCommitSubject('fix: keep docs and entrypoints edge safe')).toBeNull()
		expect(validateCommitSubject('chore(deps-dev): bump typescript from 5.9.3 to 6.0.3')).toBeNull()
		expect(validateCommitSubject('feat(next)!: remove deprecated provider option')).toBeNull()
		expect(validateCommitSubject('Revert "fix: keep docs and entrypoints edge safe"')).toBeNull()
	})

	test('allows dependabot package scopes with slashes', () => {
		expect(validateCommitSubject('chore(deps): bump actions/cache from 4 to 5')).toBeNull()
		expect(
			validateCommitSubject('chore(deps): bump @shikijs/rehype from 3.23.0 to 4.0.2'),
		).toBeNull()
	})

	test('rejects unsupported types and malformed subjects', () => {
		expect(validateCommitSubject('misc: update stuff')).toContain('unsupported type')
		expect(validateCommitSubject('update stuff')).toContain('conventional commit format')
		expect(validateCommitSubject('fix:   ')).toContain('non-empty subject')
	})
})
