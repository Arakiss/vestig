import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	transpilePackages: ['vestig'],
}

const withMDX = createMDX({
	extension: /\.mdx?$/,
})

export default withMDX(nextConfig)
