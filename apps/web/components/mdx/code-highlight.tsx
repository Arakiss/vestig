import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

async function getHighlighter() {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ['github-dark'],
			langs: [
				'typescript',
				'javascript',
				'tsx',
				'jsx',
				'json',
				'bash',
				'shell',
				'yaml',
				'markdown',
				'css',
				'html',
				'sql',
				'text',
			],
		})
	}
	return highlighter
}

interface CodeHighlightProps {
	code: string
	language?: string
}

export async function CodeHighlight({ code, language = 'typescript' }: CodeHighlightProps) {
	const hl = await getHighlighter()

	// Map common aliases
	const langMap: Record<string, string> = {
		ts: 'typescript',
		js: 'javascript',
		sh: 'bash',
		zsh: 'bash',
	}

	const lang = langMap[language] || language

	// Check if language is supported, fallback to text
	const supportedLang = hl.getLoadedLanguages().includes(lang as any) ? lang : 'text'

	const html = hl.codeToHtml(code.trim(), {
		lang: supportedLang,
		theme: 'github-dark',
	})

	return (
		<div
			className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_code]:!bg-transparent [&_.line]:leading-relaxed"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}
