import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	transpilePackages: ['vestig'],
	experimental: {
		mdxRs: true,
	},
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=31536000; includeSubDomains; preload',
					},
					{
						key: 'X-DNS-Prefetch-Control',
						value: 'on',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{
						// Content Security Policy
						// Note: 'unsafe-inline' for styles is required by Tailwind and Framer Motion
						// 'wasm-unsafe-eval' is required for Shiki syntax highlighting (uses WASM)
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'", // wasm-unsafe-eval for Shiki WASM
							"style-src 'self' 'unsafe-inline'", // Required for Tailwind/Framer Motion inline styles
							"img-src 'self' data: https:",
							"font-src 'self'",
							"connect-src 'self'",
							"frame-ancestors 'none'",
							"base-uri 'self'",
							"form-action 'self'",
							'upgrade-insecure-requests',
						].join('; '),
					},
				],
			},
		]
	},
}

const withMDX = createMDX({
	extension: /\.mdx?$/,
})

export default withMDX(nextConfig)
