'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import { Check, Copy, Download, OpenNewWindow, Sparks } from 'iconoir-react'
import { useCallback, useState } from 'react'

interface LLMsButtonProps {
	className?: string
}

type CopiedState = 'none' | 'overview' | 'full'

export function LLMsButton({ className }: LLMsButtonProps) {
	const [copiedState, setCopiedState] = useState<CopiedState>('none')
	const { copy } = useCopyToClipboard({
		timeout: 2000,
		onSuccess: () => {
			// Reset after timeout handled by hook
		},
	})

	const handleCopy = useCallback(
		async (type: 'overview' | 'full') => {
			const url = type === 'overview' ? '/llms.txt' : '/llms-full.txt'
			try {
				const response = await fetch(url)
				const text = await response.text()
				await copy(text)
				setCopiedState(type)
				setTimeout(() => setCopiedState('none'), 2000)
			} catch (error) {
				console.error('Failed to copy:', error)
			}
		},
		[copy],
	)

	const handleDownload = useCallback((type: 'overview' | 'full') => {
		const url = type === 'overview' ? '/llms.txt' : '/llms-full.txt'
		const filename = type === 'overview' ? 'vestig-llms.txt' : 'vestig-llms-full.txt'

		const link = document.createElement('a')
		link.href = url
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}, [])

	const handleOpenInNewTab = useCallback((type: 'overview' | 'full') => {
		const url = type === 'overview' ? '/llms.txt' : '/llms-full.txt'
		window.open(url, '_blank')
	}, [])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						'flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium',
						'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10',
						'border border-violet-500/20 rounded-lg',
						'text-violet-300 hover:text-violet-200',
						'hover:from-violet-500/15 hover:to-fuchsia-500/15',
						'hover:border-violet-500/30',
						'transition-all duration-200',
						'group',
						className,
					)}
				>
					<Sparks className="h-4 w-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
					<span className="flex-1 text-left">LLMs.txt</span>
					<span className="text-[10px] px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">
						AI
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
					Copy documentation for AI assistants
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{/* Overview Section */}
				<DropdownMenuLabel className="text-xs font-medium">Overview (~2KB)</DropdownMenuLabel>
				<DropdownMenuItem onClick={() => handleCopy('overview')} className="cursor-pointer">
					{copiedState === 'overview' ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
					<span>{copiedState === 'overview' ? 'Copied!' : 'Copy to clipboard'}</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleDownload('overview')} className="cursor-pointer">
					<Download className="h-4 w-4" />
					<span>Download</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleOpenInNewTab('overview')} className="cursor-pointer">
					<OpenNewWindow className="h-4 w-4" />
					<span>Open in new tab</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Full API Reference Section */}
				<DropdownMenuLabel className="text-xs font-medium">
					Full API Reference (~10KB)
				</DropdownMenuLabel>
				<DropdownMenuItem onClick={() => handleCopy('full')} className="cursor-pointer">
					{copiedState === 'full' ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
					<span>{copiedState === 'full' ? 'Copied!' : 'Copy to clipboard'}</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleDownload('full')} className="cursor-pointer">
					<Download className="h-4 w-4" />
					<span>Download</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleOpenInNewTab('full')} className="cursor-pointer">
					<OpenNewWindow className="h-4 w-4" />
					<span>Open in new tab</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
