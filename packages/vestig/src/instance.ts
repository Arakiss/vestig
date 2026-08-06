/**
 * Multiple Instance Guard
 * =======================
 *
 * vestig keeps its context in module-level state (AsyncLocalStorage in
 * `context/`, `tracing/context.ts` and `wide-events/context.ts`). Two copies of
 * the package loaded in the same process therefore hold two independent
 * context stores: a span created through one copy is invisible to the other,
 * traces stop correlating, and `instrumentFetch` can patch `globalThis.fetch`
 * twice.
 *
 * That failure is silent — the symptom is "spans have no shared trace id",
 * which reads exactly like "there is no traffic". This module makes it loud by
 * recording every loaded copy in a registry shared across copies (a
 * `Symbol.for` key on `globalThis`, which is the only thing duplicated modules
 * still have in common) and warning once when more than one shows up.
 */

import { internalConsole } from './internal-console'
import { VERSION } from './version'

/**
 * Registry key shared by every copy of the package.
 *
 * `Symbol.for` resolves through the global symbol registry, so two duplicated
 * modules reach the same entry even though nothing else is shared between them.
 * @internal
 */
const REGISTRY_KEY = Symbol.for('vestig.instances')

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
 * Registry shape stored on `globalThis`.
 * @internal
 */
interface InstanceRegistry {
	instances: VestigInstanceRecord[]
	warned: string[]
}

/**
 * Read an environment variable without assuming `process` exists.
 *
 * Edge runtimes and browsers may not expose it.
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
 * Whether the duplicate warning has been silenced by the consumer.
 *
 * Set `VESTIG_SILENCE_DUPLICATE_WARNING=1` when the duplication is known and
 * accepted (for example while migrating between major versions).
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
 * Build the warning message for a set of duplicated copies.
 * @internal
 */
function buildWarning(packageName: string, versions: string[]): string {
	const unique = [...new Set(versions)]
	const detail =
		unique.length > 1
			? `versions ${unique.join(', ')} are loaded at the same time`
			: `version ${unique[0]} is loaded ${versions.length} times from different paths`

	return [
		`[vestig] Multiple copies of "${packageName}" detected: ${detail}.`,
		'Context lives in module state, so each copy keeps its own AsyncLocalStorage:',
		'spans created through one copy will not share a trace id with the other, and',
		'fetch auto-instrumentation may be installed twice.',
		'Deduplicate the dependency (a single resolved version in your lockfile) —',
		'@vestig/next declares vestig as a peer dependency precisely so this cannot happen.',
		'Silence this warning with VESTIG_SILENCE_DUPLICATE_WARNING=1 once it is intentional.',
	].join(' ')
}

/**
 * Emit the duplicate warning at most once per package/version combination.
 * @internal
 */
function warnOnce(registry: InstanceRegistry, packageName: string): void {
	if (isWarningSilenced()) return

	const versions = registry.instances
		.filter((entry) => entry.package === packageName)
		.map((entry) => entry.version)

	if (versions.length < 2) return

	// One warning per distinct set of loaded versions: re-registering the same
	// combination (dev-server HMR, repeated imports) must stay quiet.
	const signature = `${packageName}@${[...versions].sort().join('+')}`
	if (registry.warned.includes(signature)) return
	registry.warned.push(signature)

	if (typeof console !== 'undefined' && typeof console.warn === 'function') {
		internalConsole.warn(buildWarning(packageName, versions))
	}
}

/**
 * Whether this copy of the module already registered itself.
 *
 * Module-level, so it is per-copy by construction: registration stays idempotent
 * however many call sites invoke it.
 */
let registered = false

/**
 * Register this copy of a vestig package and warn when it is not the only one.
 *
 * Called at module load from every place that creates context state. Safe to
 * call repeatedly — only the first call per loaded copy records anything.
 *
 * @param packageName - Package being registered (defaults to the core package)
 * @param version - Version of the copy being registered
 * @returns The registry entries for that package, this copy included
 */
export function registerVestigInstance(
	packageName = 'vestig',
	version = VERSION,
): VestigInstanceRecord[] {
	const registry = getRegistry()

	if (!registered) {
		registered = true
		registry.instances.push({ package: packageName, version })
	}

	warnOnce(registry, packageName)

	return registry.instances.filter((entry) => entry.package === packageName)
}

/**
 * List every vestig copy loaded in the current process.
 *
 * Useful as a diagnostic when traces do not correlate: more than one entry for
 * the same package is the cause.
 *
 * @example
 * ```typescript
 * import { getLoadedInstances } from 'vestig'
 *
 * console.log(getLoadedInstances())
 * // [{ package: 'vestig', version: '0.24.0' }]
 * ```
 */
export function getLoadedInstances(): VestigInstanceRecord[] {
	return [...getRegistry().instances]
}

/**
 * Whether more than one copy of a package is loaded.
 *
 * @param packageName - Package to check (defaults to the core package)
 */
export function hasMultipleInstances(packageName = 'vestig'): boolean {
	return getRegistry().instances.filter((entry) => entry.package === packageName).length > 1
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
