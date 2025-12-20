# Changelog

All notable changes to Vestig will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.3.1](https://github.com/Arakiss/vestig/compare/v0.3.0...v0.3.1) (2025-12-20)

### 🐛 Bug Fixes

* **ci:** improve release workflow with robust npm publishing ([dfbed59](https://github.com/Arakiss/vestig/commit/dfbed594fce1bbce849291146d45b460b9da26eb))

## [0.3.0](https://github.com/Arakiss/vestig/compare/v0.2.1...v0.3.0) (2025-12-20)

### ✨ Features

* **demo:** add interactive playground with server, client, and API demos ([3a1e2b2](https://github.com/Arakiss/vestig/commit/3a1e2b27986ec720270c22b39cf5043bf57e1af7))
* **demo:** add logging infrastructure with SSE streaming ([568e76b](https://github.com/Arakiss/vestig/commit/568e76b1ffb5d21012bbb46c6709036d2386a75f))
* **demo:** add UI components for playground ([e90522e](https://github.com/Arakiss/vestig/commit/e90522e62aa4202f275e18311cfe760fc1cd38c8))
* **vestig-next:** add Next.js integration package ([dbe0b96](https://github.com/Arakiss/vestig/commit/dbe0b96fb2ab6fbee9c22ff97a4ab09cebe0595b))

### 🐛 Bug Fixes

* **ci:** reorder release workflow to build before typecheck ([10dc3b1](https://github.com/Arakiss/vestig/commit/10dc3b128e6215e28180c4560e381b59ffc905b8))
* **context:** prevent undefined values in correlation context ([2167332](https://github.com/Arakiss/vestig/commit/21673322dcb709785ee308634d4ea553359eb366))

### ♻️ Refactoring

* **demo:** migrate to @vestig/next integration ([3abf971](https://github.com/Arakiss/vestig/commit/3abf971c1bc58adc606fb6b5ed4c9e4fa97a7ef9))

### ✅ Tests

* **transports:** add comprehensive transport tests ([e9b71e1](https://github.com/Arakiss/vestig/commit/e9b71e1cef6866bb25a3364de4ef1d8824cb03e4))

### 🔧 CI/CD

* fix lint errors and update biome config ([5019f83](https://github.com/Arakiss/vestig/commit/5019f8385568b3e4a7bfa13aa1be33a07706367c))
* reorder workflow to build before typecheck ([fd565d4](https://github.com/Arakiss/vestig/commit/fd565d4baa265205bae2736ecf251575ed158110))

## [0.1.1](https://github.com/Arakiss/sigil/compare/v0.1.0...v0.1.1) (2025-12-18)

### 🐛 Bug Fixes

* **release:** disable autoGenerate and clean up changelog ([be36cbc](https://github.com/Arakiss/sigil/commit/be36cbca0eaf4907271504e35017a4c76d11d85e))

## [0.1.0](https://github.com/Arakiss/sigil/releases/tag/v0.1.0) (2025-12-18)

### ⚠ BREAKING CHANGES

* Package renamed from logpulse to vestig.
  - Renamed package directory from `packages/logpulse` to `packages/vestig`
  - Updated package name to "vestig" with new branding
  - Migration: Update imports from `'logpulse'` to `'vestig'`

### ✨ Features

* **Core Logger**: Full-featured structured logging with multiple log levels (trace, debug, info, warn, error, fatal)
* **Runtime Agnostic**: Works seamlessly across Node.js, Bun, Deno, browsers, and edge runtimes
* **PII Sanitization**: Automatic detection and masking of sensitive data (emails, IPs, credit cards, etc.)
* **Context Propagation**: AsyncLocalStorage-based context that flows through async operations
* **Correlation IDs**: Automatic request tracing with correlation ID support
* **Child Loggers**: Create scoped loggers with inherited context
* **Console Transport**: Beautiful, colorized console output with emoji support
* **Type Safety**: Full TypeScript support with comprehensive type definitions
* **Zero Dependencies**: Lightweight with no external runtime dependencies
* **Configurable**: Flexible configuration for log levels, formats, and sanitization rules
* **demo:** Add documentation site with Next.js 16 ([82f01b7](https://github.com/Arakiss/sigil/commit/82f01b7b903beaa647aca522c73c62ab131379b7))

### 📚 Documentation

* Added demo documentation site with Next.js 16
* Getting started guide
* API reference
* Feature documentation

### 🔧 CI/CD

* GitHub Actions workflow for CI (linting, testing, building)
* Automated release pipeline with conventional commits
* Security scanning
