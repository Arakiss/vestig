'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseScrollPositionOptions {
	/** Threshold in pixels before scroll state changes (default: 0) */
	threshold?: number
	/** Whether to use requestAnimationFrame throttling (default: true) */
	throttle?: boolean
}

interface UseScrollPositionReturn {
	/** Current scroll Y position in pixels */
	scrollY: number
	/** Whether scroll position is past the threshold */
	isScrolled: boolean
	/** Scroll direction: 'up', 'down', or null if not scrolled */
	direction: 'up' | 'down' | null
}

/**
 * Hook for tracking scroll position with RAF throttling
 *
 * Uses requestAnimationFrame to throttle scroll events for better performance.
 * Avoids the common pattern of duplicating scroll logic across components.
 *
 * @example
 * const { isScrolled } = useScrollPosition({ threshold: 20 })
 * // isScrolled is true when scrollY > 20
 *
 * @example
 * const { scrollY, direction } = useScrollPosition()
 * // Track exact position and scroll direction
 */
export function useScrollPosition(options: UseScrollPositionOptions = {}): UseScrollPositionReturn {
	const { threshold = 0, throttle = true } = options

	const [scrollY, setScrollY] = useState(0)
	const [direction, setDirection] = useState<'up' | 'down' | null>(null)

	// Refs for RAF throttling
	const ticking = useRef(false)
	const lastScrollY = useRef(0)

	const updateScrollState = useCallback(() => {
		const currentScrollY = window.scrollY

		// Update direction
		if (currentScrollY > lastScrollY.current) {
			setDirection('down')
		} else if (currentScrollY < lastScrollY.current) {
			setDirection('up')
		}

		lastScrollY.current = currentScrollY
		setScrollY(currentScrollY)
		ticking.current = false
	}, [])

	const handleScroll = useCallback(() => {
		if (throttle) {
			if (!ticking.current) {
				requestAnimationFrame(updateScrollState)
				ticking.current = true
			}
		} else {
			updateScrollState()
		}
	}, [throttle, updateScrollState])

	useEffect(() => {
		// Set initial value
		setScrollY(window.scrollY)
		lastScrollY.current = window.scrollY

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [handleScroll])

	return {
		scrollY,
		isScrolled: scrollY > threshold,
		direction,
	}
}
