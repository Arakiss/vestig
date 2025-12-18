import type { SanitizeConfig, SanitizePattern, SanitizePreset } from '../types'

/**
 * Common patterns for detecting sensitive data in strings
 */
export const COMMON_PATTERNS = {
	email: {
		name: 'email',
		pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
		replacement: (match: string) => {
			const [local, domain] = match.split('@')
			if (!local || !domain) return '[EMAIL]'
			const maskedLocal = `${local.slice(0, 2)}***`
			return `${maskedLocal}@${domain}`
		},
	},
	creditCard: {
		name: 'creditCard',
		pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
		replacement: (match: string) => {
			const digits = match.replace(/[- ]/g, '')
			return `****${digits.slice(-4)}`
		},
	},
	jwt: {
		name: 'jwt',
		pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
		replacement: '[JWT_REDACTED]',
	},
	ipv4: {
		name: 'ipv4',
		pattern:
			/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
		replacement: '[IP_REDACTED]',
	},
	ipv6: {
		name: 'ipv6',
		pattern: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
		replacement: '[IP_REDACTED]',
	},
	ssn: {
		name: 'ssn',
		pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
		replacement: '[SSN_REDACTED]',
	},
	phone: {
		name: 'phone',
		pattern: /\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b/g,
		replacement: '[PHONE_REDACTED]',
	},
} satisfies Record<string, SanitizePattern>

/**
 * Field sets for different compliance levels
 */
const FIELD_SETS = {
	minimal: ['password', 'secret', 'token', 'key', 'apikey', 'api_key', 'api-key'],
	default: [
		'password',
		'pass',
		'pwd',
		'secret',
		'token',
		'api_key',
		'apikey',
		'api-key',
		'access_token',
		'accesstoken',
		'refresh_token',
		'private_key',
		'privatekey',
		'credit_card',
		'creditcard',
		'card_number',
		'cvv',
		'ssn',
		'social_security',
		'authorization',
		'bearer',
		'session_id',
		'sessionid',
		'cookie',
		'auth',
	],
	gdpr: [
		// Personal identifiers
		'name',
		'first_name',
		'firstname',
		'last_name',
		'lastname',
		'full_name',
		'fullname',
		'email',
		'phone',
		'telephone',
		'mobile',
		'address',
		'street',
		'city',
		'zip',
		'postal_code',
		'country',
		'birthdate',
		'birth_date',
		'date_of_birth',
		'dob',
		'age',
		'gender',
		'nationality',
		// Online identifiers
		'ip',
		'ip_address',
		'user_agent',
		'useragent',
		'device_id',
		'deviceid',
		'mac_address',
		// Financial
		'iban',
		'bank_account',
		'account_number',
	],
	hipaa: [
		// PHI (Protected Health Information)
		'patient_id',
		'patientid',
		'medical_record',
		'mrn',
		'diagnosis',
		'condition',
		'treatment',
		'medication',
		'prescription',
		'insurance_id',
		'health_plan',
		'provider',
		'physician',
		'doctor',
		// Biometric
		'fingerprint',
		'retina',
		'voice_print',
		'dna',
		// Images
		'photo',
		'image',
		'xray',
		'mri',
		'scan',
	],
	pciDss: [
		// Primary Account Number (PAN)
		'pan',
		'card_number',
		'cardnumber',
		'credit_card',
		'creditcard',
		'debit_card',
		'card_num',
		// Cardholder data
		'cardholder',
		'card_holder',
		'expiry',
		'expiration',
		'exp_date',
		'cvv',
		'cvc',
		'cvv2',
		'cvc2',
		'security_code',
		'pin',
		'pin_block',
		// Track data
		'track1',
		'track2',
		'magnetic_stripe',
	],
}

/**
 * Preset configurations for different compliance requirements
 */
export const PRESETS: Record<SanitizePreset, SanitizeConfig> = {
	none: {
		enabled: false,
		fields: [],
		patterns: [],
	},
	minimal: {
		enabled: true,
		fields: FIELD_SETS.minimal,
		patterns: [],
	},
	default: {
		enabled: true,
		fields: FIELD_SETS.default,
		patterns: [COMMON_PATTERNS.email, COMMON_PATTERNS.creditCard, COMMON_PATTERNS.jwt],
	},
	gdpr: {
		enabled: true,
		fields: [...FIELD_SETS.default, ...FIELD_SETS.gdpr],
		patterns: [
			COMMON_PATTERNS.email,
			COMMON_PATTERNS.creditCard,
			COMMON_PATTERNS.jwt,
			COMMON_PATTERNS.ipv4,
			COMMON_PATTERNS.ipv6,
			COMMON_PATTERNS.phone,
		],
	},
	hipaa: {
		enabled: true,
		fields: [...FIELD_SETS.default, ...FIELD_SETS.gdpr, ...FIELD_SETS.hipaa],
		patterns: [
			COMMON_PATTERNS.email,
			COMMON_PATTERNS.creditCard,
			COMMON_PATTERNS.jwt,
			COMMON_PATTERNS.ipv4,
			COMMON_PATTERNS.ssn,
			COMMON_PATTERNS.phone,
		],
	},
	'pci-dss': {
		enabled: true,
		fields: [...FIELD_SETS.default, ...FIELD_SETS.pciDss],
		patterns: [COMMON_PATTERNS.creditCard, COMMON_PATTERNS.jwt],
	},
}

/**
 * Get a preset configuration by name
 */
export function getPreset(name: SanitizePreset): SanitizeConfig {
	const preset = PRESETS[name]
	return preset ?? PRESETS.default
}

/**
 * Merge two sanitization configs
 */
export function mergeConfigs(
	base: SanitizeConfig,
	override: Partial<SanitizeConfig>,
): SanitizeConfig {
	return {
		enabled: override.enabled ?? base.enabled,
		fields: override.fields ? [...(base.fields ?? []), ...override.fields] : base.fields,
		patterns: override.patterns ? [...(base.patterns ?? []), ...override.patterns] : base.patterns,
		replacement: override.replacement ?? base.replacement,
		depth: override.depth ?? base.depth,
	}
}
