'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'iconoir-react'
import { useEffect, useState } from 'react'

/**
 * ScrollToTop - Elegant scroll-to-top button
 *
 * Features:
 * - Appears after scrolling down 400px
 * - Smooth scroll animation
 * - Pill-style matching site design
 * - Glow effect on hover
 * - Progress ring showing scroll position
 */

interface ScrollToTopProps {
	/** Show scroll progress ring */
	showProgress?: boolean
	/** Scroll threshold to show button (in pixels) */
	threshold?: number
	className?: string
}

export function ScrollToTop({ showProgress = true, threshold = 400, className }: ScrollToTopProps) {
	const [isVisible, setIsVisible] = useState(false)
	const [scrollProgress, setScrollProgress] = useState(0)

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY
			const docHeight = document.documentElement.scrollHeight - window.innerHeight
			const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

			setIsVisible(scrollTop > threshold)
			setScrollProgress(progress)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll() // Check initial position

		return () => window.removeEventListener('scroll', handleScroll)
	}, [threshold])

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		})
	}

	// SVG circle properties for progress ring
	const size = 48
	const strokeWidth = 2
	const radius = (size - strokeWidth) / 2
	const circumference = radius * 2 * Math.PI
	const strokeDashoffset = circumference - (scrollProgress / 100) * circumference

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.button
					initial={{ opacity: 0, scale: 0.8, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: 20 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
					onClick={scrollToTop}
					className={cn(
						'fixed bottom-8 right-8 z-50',
						'w-12 h-12 rounded-full',
						'bg-surface-elevated border border-white/10',
						'flex items-center justify-center',
						'hover:border-white/30 hover:bg-surface-overlay',
						'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
						'transition-all duration-300',
						'group cursor-pointer',
						className,
					)}
					aria-label="Scroll to top"
				>
					{/* Progress ring */}
					{showProgress && (
						<svg className="absolute inset-0 -rotate-90" width={size} height={size}>
							{/* Background circle */}
							<circle
								cx={size / 2}
								cy={size / 2}
								r={radius}
								fill="none"
								stroke="currentColor"
								strokeWidth={strokeWidth}
								className="text-white/5"
							/>
							{/* Progress circle */}
							<circle
								cx={size / 2}
								cy={size / 2}
								r={radius}
								fill="none"
								stroke="currentColor"
								strokeWidth={strokeWidth}
								strokeLinecap="round"
								strokeDasharray={circumference}
								strokeDashoffset={strokeDashoffset}
								className="text-white/40 transition-all duration-150"
							/>
						</svg>
					)}

					{/* Arrow icon */}
					<ArrowUp
						className={cn(
							'w-5 h-5 text-white/60',
							'group-hover:text-white',
							'transition-all duration-300',
							'group-hover:-translate-y-0.5',
						)}
					/>
				</motion.button>
			)}
		</AnimatePresence>
	)
}

export default ScrollToTop
