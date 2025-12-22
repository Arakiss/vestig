# Contributing to Vestig

First off, thank you for considering contributing to Vestig! It's people like you that make Vestig such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, configuration files)
- **Describe the behavior you observed and what you expected**
- **Include your environment** (OS, Node/Bun version, Vestig version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies** with `bun install`
3. **Make your changes** and ensure tests pass with `bun test`
4. **Format your code** with `bun run format`
5. **Run linting** with `bun run lint`
6. **Commit your changes** using [Conventional Commits](https://conventionalcommits.org)
7. **Push to your fork** and submit a pull request

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org). Your commit messages should follow this format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files

**Examples:**
```
feat(logger): add support for custom formatters
fix(sanitize): handle nested objects correctly
docs: update API reference
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vestig.git
cd vestig

# Install dependencies
bun install

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Build the package
bun run build

# Run linting
bun run lint

# Format code
bun run format
```

## Project Structure

```
vestig/
├── packages/
│   ├── vestig/             # Core logging library (zero dependencies)
│   │   ├── src/
│   │   │   ├── index.ts    # Public API exports
│   │   │   ├── logger.ts   # Core logger implementation
│   │   │   ├── context/    # Context propagation
│   │   │   ├── transports/ # Output transports (Console, HTTP, File, Datadog)
│   │   │   ├── tracing/    # Native tracing with spans
│   │   │   ├── sampling/   # Sampling strategies
│   │   │   └── utils/      # Utility functions (sanitization, etc.)
│   │   └── src/__tests__/  # Test files
│   ├── @vestig/next/       # Next.js integration (App Router, RSC, middleware)
│   └── @vestig/express/    # Express.js middleware
├── apps/
│   └── web/                # Documentation website (Next.js)
└── .github/
    └── workflows/          # CI/CD pipelines
```

## Testing

- Write tests for any new functionality
- Ensure all existing tests pass before submitting a PR
- Aim for high code coverage (currently >90%)

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

Thank you for contributing! 🎉
