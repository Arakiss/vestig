'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface SidebarSection {
	title: string
	items: {
		title: string
		href: string
		icon?: React.ReactNode
		badge?: string
	}[]
}

interface SidebarProps {
	sections: SidebarSection[]
	className?: string
}

export function Sidebar({ sections, className }: SidebarProps) {
	const pathname = usePathname()

	return (
		<aside
			className={cn(
				'fixed top-14 left-0 bottom-0 w-64 border-r border-white/6 bg-background hidden lg:block',
				className,
			)}
		>
			<ScrollArea className="h-full py-6 px-4">
				<nav className="space-y-6">
					{sections.map((section) => (
						<div key={section.title}>
							<h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-3">
								{section.title}
							</h4>
							<ul className="space-y-0.5">
								{section.items.map((item) => {
									const isActive = pathname === item.href || pathname === item.href.split('#')[0]

									return (
										<li key={item.href}>
											<Link
												href={item.href}
												className={cn(
													'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
													isActive
														? 'bg-white/10 text-foreground'
														: 'text-muted-foreground hover:text-foreground hover:bg-white/5',
												)}
											>
												{item.icon && <span className="shrink-0">{item.icon}</span>}
												<span className="flex-1">{item.title}</span>
												{item.badge && (
													<span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-muted-foreground">
														{item.badge}
													</span>
												)}
											</Link>
										</li>
									)
								})}
							</ul>
						</div>
					))}
				</nav>
			</ScrollArea>
		</aside>
	)
}
