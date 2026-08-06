/**
 * Multiple Instance Guard (Next.js integration)
 * =============================================
 *
 * Mirrors the guard in the core package. It stays self-contained on purpose:
 * importing the registry from `vestig` would turn an unmet peer dependency into
 * a hard module-resolution error, which is worse than the warning it is meant
 * to produce. The two implementations only share the registry shape and its
 * `Symbol.for` key.
 *
 * On top of counting its own copies, this guard checks that the `vestig` copy
 * @vestig/next resolves is aligned with its own version. That is the exact
 * shape of the bug this file exists for: a consumer resolving `vestig@0.23.0`
 * while `@vestig/next@0.22.1` drags in a nested `vestig@0.22.1`, each with its
 * own AsyncLocalStorage and no shared trace id between them.
 */

import { VERSION as CORE_VERSION } from 'vestig'
import { VERSION } from './version'

/**
 * Registry key shared with the core package.
 * @internal
 */
const REGISTRY_KEY = Symbol.for('vestig.instances')

/**
 * Package name registered by this module.
 * @internal
 */
const PACKAGE_NAME = '@vestig/next'

/**
 * A single loaded copy of a vestig package.
 */
export interface VestigInstanceRecord {
	/** Package name, e.g. `vestig` or `@vestig/next` */
	package: string
	/** Version of that copy */
	version: string
}

/**
 * Registry shape stored on `globalThis`, shared with the core package.
 * @internal
 */
interface InstanceRegistry {
	instances: VestigInstanceRecord[]
	warned: string[]
}

/**
 * Read an environment variable without assuming `process` exists.
 */
function readEnv(name: string): string | undefined {
	try {
		const p = globalThis.process as NodeJS.Process | undefined
		return p?.env?.[name]
	} catch {
		return undefined
	}
}

/**
 * Whether duplicate warnings have been silenced by the consumer.
 */
function isWarningSilenced(): boolean {
	const value = readEnv('VESTIG_SILENCE_DUPLICATE_WARNING')
	return value === '1' || value === 'true'
}

/**
 * Get the shared registry, creating it on first use.
 * @internal
 */
function getRegistry(): InstanceRegistry {
	const holder = globalThis as typeof globalThis & {
		[REGISTRY_KEY]?: InstanceRegistry
	}

	let registry = holder[REGISTRY_KEY]
	if (!registry) {
		registry = { instances: [], warned: [] }
		holder[REGISTRY_KEY] = registry
	}

	return registry
}

/**
 * Emit a warning once per signature.
 * @internal
 */
function warnOnce(registry: InstanceRegistry, signature: string, message: string): void {
	if (isWarningSilenced()) return
	if (registry.warned.includes(signature)) return
	registry.warned.push(signature)

	if (typeof console !== 'undefined' && typeof console.warn === 'function') {
		console.warn(message)
	}
}

/**
 * The compatible core range for a given @vestig/next version.
 *
 * Versions are released in lockstep, and while the package is below 1.0 every
 * minor is a breaking boundary — so alignment is checked on major.minor.
 * @internal
 */
function versionLine(version: string): string {
	const [major = '0', minor = '0'] = version.split('.')
	return `${major}.${minor}`
}

/**
 * The mismatch message for a resolved core version, or `null` when aligned.
 *
 * Pure on purpose: the versions it compares are frozen at module load, so this
 * is the only part of the check that can be exercised directly.
 * @internal
 */
export function describeCoreMismatch(
	coreVersion: string,
	ownVersion: string = VERSION,
): string | null {
	if (versionLine(coreVersion) === versionLine(ownVersion)) return null

	return [
		`[vestig] Version mismatch: ${PACKAGE_NAME}@${ownVersion} resolved vestig@${coreVersion}.`,
		'These packages are released together and share module-level context state,',
		'so a mismatch usually means a nested copy of vestig was installed: spans',
		'created by your application will not share a trace id with the ones emitted',
		'by registerVestig().',
		`Pin both to the same version (${PACKAGE_NAME} declares vestig as a peer dependency`,
		'so your package manager resolves exactly one copy).',
	].join(' ')
}

/**
 * Warn when the resolved core copy is not aligned with this integration.
 * @internal
 */
function checkCoreAlignment(registry: InstanceRegistry): void {
	const message = describeCoreMismatch(CORE_VERSION)
	if (!message) return

	warnOnce(registry, `${PACKAGE_NAME}@${VERSION}+vestig@${CORE_VERSION}`, message)
}

/**
 * Warn when more than one copy of @vestig/next is loaded.
 * @internal
 */
function checkOwnDuplicates(registry: InstanceRegistry): void {
	const versions = registry.instances
		.filter((entry) => entry.package === PACKAGE_NAME)
		.map((entry) => entry.version)

	if (versions.length < 2) return

	const unique = [...new Set(versions)]
	const detail =
		unique.length > 1
			? `versions ${unique.join(', ')} are loaded at the same time`
			: `version ${unique[0]} is loaded ${versions.length} times from different paths`

	warnOnce(
		registry,
		`${PACKAGE_NAME}@${[...versions].sort().join('+')}`,
		[
			`[vestig] Multiple copies of "${PACKAGE_NAME}" detected: ${detail}.`,
			'Request context and web-vitals reporting are module state, so each copy',
			'behaves as a separate installation. Deduplicate the dependency in your lockfile.',
			'Silence this warning with VESTIG_SILENCE_DUPLICATE_WARNING=1 once it is intentional.',
		].join(' '),
	)
}

/**
 * Whether this copy of the module already registered itself.
 */
let registered = false

/**
 * Register this copy of @vestig/next and report anything that breaks trace
 * correlation: a duplicated integration, or a core copy from another version.
 *
 * Safe to call repeatedly — only the first call per loaded copy records anything.
 *
 * @returns The registry entries for @vestig/next, this copy included
 */
export function registerNextInstance(): VestigInstanceRecord[] {
	const registry = getRegistry()

	if (!registered) {
		registered = true
		registry.instances.push({ package: PACKAGE_NAME, version: VERSION })
	}

	checkOwnDuplicates(registry)
	checkCoreAlignment(registry)

	return registry.instances.filter((entry) => entry.package === PACKAGE_NAME)
}

/**
 * List every vestig copy loaded in the current process, core included.
 *
 * Useful as a diagnostic when traces do not correlate: more than one entry for
 * the same package is the cause.
 *
 * @example
 * ```typescript
 * import { getLoadedInstances } from '@vestig/next'
 *
 * console.log(getLoadedInstances())
 * // [{ package: 'vestig', version: '0.23.0' },
 * //  { package: '@vestig/next', version: '0.23.0' }]
 * ```
 */
export function getLoadedInstances(): VestigInstanceRecord[] {
	return [...getRegistry().instances]
}

/**
 * Reset the shared registry.
 *
 * Only for tests — clearing it in production hides a real duplication.
 * @internal
 */
export function resetInstanceRegistry(): void {
	const holder = globalThis as typeof globalThis & {
		[REGISTRY_KEY]?: InstanceRegistry
	}
	holder[REGISTRY_KEY] = undefined
	registered = false
}
