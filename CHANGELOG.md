# Changelog

All notable changes to Vestig will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.14.3](https://github.com/Arakiss/vestig/compare/v0.14.2...v0.14.3) (2026-01-07)

### 🐛 Bug Fixes

* **ci:** create .npmrc in package dir for bun publish auth ([827e227](https://github.com/Arakiss/vestig/commit/827e2277e8c5c81e9419e8ced3a4c93a45afee29))

## [0.14.2](https://github.com/Arakiss/vestig/compare/v0.14.1...v0.14.2) (2026-01-07)

### 🐛 Bug Fixes

* **ci:** remove deprecated @vestig/express from workflows ([1f17ae7](https://github.com/Arakiss/vestig/commit/1f17ae7ca698e6d72254923334a113c03d8ff2a2))

## [0.14.1](https://github.com/Arakiss/vestig/compare/v0.14.0...v0.14.1) (2026-01-07)

### 🐛 Bug Fixes

* **ci:** configure npm auth for bun publish ([dcba17b](https://github.com/Arakiss/vestig/commit/dcba17bc01ee9f7ceeb666c52ea10837c591e20c))

## [0.14.0](https://github.com/Arakiss/vestig/compare/v0.13.0...v0.14.0) (2026-01-07)

### ✨ Features

* **web:** enhanced code blocks with line numbers and highlighting ([eea0ed1](https://github.com/Arakiss/vestig/commit/eea0ed13abe1db460e0653db3a043442591f187b))

### 🐛 Bug Fixes

* **ci:** use bun publish to resolve workspace:* dependencies ([820e334](https://github.com/Arakiss/vestig/commit/820e334736373067ecb3725bc0efcb482908bcd6))
* **release:** skip git hooks during release push ([0aa42a6](https://github.com/Arakiss/vestig/commit/0aa42a68556a4f286d1303d04824759061ddfa14))
* **release:** update README version in release hook ([3bd6907](https://github.com/Arakiss/vestig/commit/3bd69074cbd3f6cf4a1bb7b5b46e681ef320f61b))
* **web:** properly extract nested spans from Shiki HTML output ([f636b21](https://github.com/Arakiss/vestig/commit/f636b2110aa20fcf58bdcc5f3288b66bbcaa9615))
* **web:** reduce excessive line-height in code blocks ([fe528be](https://github.com/Arakiss/vestig/commit/fe528be49bf298c69fee0ee1cb959914dc98b390))

### ♻️ Refactoring

* convert scripts to TypeScript and add strict validation ([e612525](https://github.com/Arakiss/vestig/commit/e6125259cef3e21992838a29e71a0f3ed226e4f5))

### 📚 Documentation

* add attribution for wide events concept ([b54e9db](https://github.com/Arakiss/vestig/commit/b54e9dbb8741e0d33729c19c4ae5d4d66328479a))
* **changelog:** add Wide Events release notes for v0.13.0 ([2396333](https://github.com/Arakiss/vestig/commit/23963339e763709b41bfe04fc4685dda18ce2ad6))
* sync sidebar navigation with all documentation pages ([6ab09cc](https://github.com/Arakiss/vestig/commit/6ab09cc3edc17d5ab1a85baadedbc292d4ca8b63))

## [0.13.0](https://github.com/Arakiss/vestig/compare/v0.12.0...v0.13.0) (2026-01-06)

### ✨ Features

* **wide-events:** Add Wide Events (Canonical Log Lines) for comprehensive request tracking
* **wide-events:** Add Tail Sampling for outcome-based log sampling (100% errors, sample success)
* **vestig-next:** Add Wide Events integration for Next.js (middleware, server actions, helpers)
* **validation:** Add npm registry validation to prevent version conflicts

### 🐛 Bug Fixes

* **lint:** Fix all BiomeJS linting errors in wide-events modules
* **lint:** Fix import statement ordering and non-null assertions

### 📚 Documentation

* **web:** Add comprehensive Wide Events documentation page
* **web:** Add Tail Sampling documentation with configuration examples
* **web:** Add Next.js Wide Events integration guide
* **readme:** Update README with Wide Events examples and API reference

## [0.11.5](https://github.com/Arakiss/vestig/compare/v0.11.4...v0.11.5) (2026-01-04)

### 🐛 Bug Fixes

* **docs:** replace Unicode box-drawing chars with ASCII ([d0d5e8b](https://github.com/Arakiss/vestig/commit/d0d5e8b027ee03880036bbee62a823e8164d9c27))

## [0.11.4](https://github.com/Arakiss/vestig/compare/v0.11.3...v0.11.4) (2026-01-04)

### 🐛 Bug Fixes

* **mdx:** enable GFM support for markdown tables ([a0f6295](https://github.com/Arakiss/vestig/commit/a0f6295dc2350736221e3721bcf79318c680b3fe))

### ♻️ Refactoring

* **ui:** redesign error page with enhanced visuals ([bad55c5](https://github.com/Arakiss/vestig/commit/bad55c571f0486505a5f6755fc93bdb330fd025b))

### 📚 Documentation

* **readme:** update to reflect current v0.11.3 release ([5579d4c](https://github.com/Arakiss/vestig/commit/5579d4cce03110e9a9b75382e03ff3d538a58612))

## [0.11.3](https://github.com/Arakiss/vestig/compare/v0.11.2...v0.11.3) (2026-01-04)

### 🐛 Bug Fixes

* **ui:** correct error page button styling ([f2178b0](https://github.com/Arakiss/vestig/commit/f2178b07a2a7bf1b58b5cd8ba0aea86cba6f6532))

## [0.11.2](https://github.com/Arakiss/vestig/compare/v0.11.1...v0.11.2) (2026-01-04)

### 🐛 Bug Fixes

* **mdx:** remove double border from code blocks ([b0d4aa2](https://github.com/Arakiss/vestig/commit/b0d4aa2db93dc0b51b8381b79ba8542a93c19d09))

## [0.11.1](https://github.com/Arakiss/vestig/compare/v0.11.0...v0.11.1) (2026-01-04)

### 🐛 Bug Fixes

* **web:** resolve critical issues from analysis ([ebbfc5b](https://github.com/Arakiss/vestig/commit/ebbfc5b7d2366683773f07a4c2c3562bfe8dad7b))

## [0.11.0](https://github.com/Arakiss/vestig/compare/v0.10.2...v0.11.0) (2026-01-04)

### ✨ Features

* **blog:** add RSS feed and dynamic blog infrastructure ([d1c6a23](https://github.com/Arakiss/vestig/commit/d1c6a231c7d8dd3f495f262213da00c0161593cb))

### 🐛 Bug Fixes

* **web:** improve hooks with proper cleanup and memory management ([62a7d4d](https://github.com/Arakiss/vestig/commit/62a7d4d6d9b1709d198c1d357ff063f52068f416))
* **web:** resolve lint errors in error page component ([dbd5809](https://github.com/Arakiss/vestig/commit/dbd58093a7de0f2d3d73ec01d4823b93e200d49d))
* **web:** update hero badge version from 0.8.0 to 0.10.2 ([1037e17](https://github.com/Arakiss/vestig/commit/1037e174d757fbe7b2a106c4466d8924228b0923))
* **web:** update site metadata version from 0.8.0 to 0.10.2 ([994fd64](https://github.com/Arakiss/vestig/commit/994fd647a0ff21dec35d21d55b14cae6d4b800cf))

### ⚡ Performance

* **log-context:** split contexts and optimize re-renders ([e2631ab](https://github.com/Arakiss/vestig/commit/e2631ab35d0c196db29a0ed4fae77f51350c2fd3))
* **web:** add scroll throttling and improve semantic HTML ([31a5d0e](https://github.com/Arakiss/vestig/commit/31a5d0e975b2837dc874ed655d09cf76df4c0617))
* **web:** add useScrollPosition hook and optimize scroll handling ([a907865](https://github.com/Arakiss/vestig/commit/a90786592a5500bbbb8c01dd40bfb6f41a43ad7c))

### ♻️ Refactoring

* **blog:** update blog pages with improved structure ([9182c30](https://github.com/Arakiss/vestig/commit/9182c3081dc246e332fac881584b6cb2beb08b86))
* **playground:** improve dev-overlay with refs ([2748dfb](https://github.com/Arakiss/vestig/commit/2748dfb9ffb710ea344130d5a5583d4c6b13349e))
* **web:** extract useCopyToClipboard hook to eliminate code duplication ([71b7583](https://github.com/Arakiss/vestig/commit/71b758374c3c5f5f1d2c97ed560481b5d651aeec))
* **web:** improve landing page components ([3379f89](https://github.com/Arakiss/vestig/commit/3379f89095d76092684ff6e52e2f651c159fcb5e))
* **web:** improve MDX and UI components ([53fa5d5](https://github.com/Arakiss/vestig/commit/53fa5d56d45134b88d4f5aec9d347e46ef2e7b81))
* **web:** minor API and changelog improvements ([a20da0f](https://github.com/Arakiss/vestig/commit/a20da0fd3ce76dd16942142eaa137a5c80f72c56))
* **web:** use constants for URLs and add focus-visible to Footer ([79cfc17](https://github.com/Arakiss/vestig/commit/79cfc179af1cc186353e204aa03c71ee71f7723b))

## [0.10.2](https://github.com/Arakiss/vestig/compare/v0.10.1...v0.10.2) (2026-01-03)

### 🐛 Bug Fixes

* **web:** add error handling and focus styles to app components ([4465d35](https://github.com/Arakiss/vestig/commit/4465d358ad94534c915478d093203534676bff88))

## [0.10.1](https://github.com/Arakiss/vestig/compare/v0.10.0...v0.10.1) (2026-01-03)

### 🐛 Bug Fixes

* **web:** improve docs links and navigation accessibility ([dff436e](https://github.com/Arakiss/vestig/commit/dff436ec143c6493e2edec75cb6b1d3387191af0))

## [0.10.0](https://github.com/Arakiss/vestig/compare/v0.9.1...v0.10.0) (2026-01-03)

### ✨ Features

* **web:** add error boundary, loading states, and constants ([d301b86](https://github.com/Arakiss/vestig/commit/d301b861760c60d45978a4d4934f11b0fe681cfe))

## [0.9.1](https://github.com/Arakiss/vestig/compare/v0.9.0...v0.9.1) (2026-01-03)

### ⚡ Performance

* **web:** optimize font loading and improve accessibility ([08adaa7](https://github.com/Arakiss/vestig/commit/08adaa7234338243ae8bd2a17b50c1b4a1ce6625))

## [0.9.0](https://github.com/Arakiss/vestig/compare/v0.8.1...v0.9.0) (2026-01-03)

### ✨ Features

* automate version display in web app ([2ef6041](https://github.com/Arakiss/vestig/commit/2ef6041d3598037d4e81570dfe9d6a1c3bb97bc5))

### 🐛 Bug Fixes

* **ci:** remove duplicate tests from release-it hooks ([f85c70b](https://github.com/Arakiss/vestig/commit/f85c70b896863c683e8db4b05ad804009cd7b762))
* ensure sequential package builds for CI ([0f5eb49](https://github.com/Arakiss/vestig/commit/0f5eb4978d2ff7ba0fe97677f93c7f42dd0d9016))
* resolve all Biome lint errors for CI pass ([08f56a0](https://github.com/Arakiss/vestig/commit/08f56a0b14d1119f17bf65e1c4cbeb848238b817))
* **test:** make FileTransport batching test deterministic ([c68dc21](https://github.com/Arakiss/vestig/commit/c68dc210a38e5a3dc9d21f79cc75da306741118f))
* **web:** fix remaining lint issues for CI pass ([341c83e](https://github.com/Arakiss/vestig/commit/341c83e6851067ebde6fc2d78a3bc354b93752c8))
* **web:** resolve biome linting and accessibility issues ([2a6e935](https://github.com/Arakiss/vestig/commit/2a6e9358af83eb6ebb381a1f669b90d7189ffc56))

## [0.8.0](https://github.com/Arakiss/vestig/compare/v0.7.0...v0.8.0) (2025-12-23)

### ✨ Features

* **next:** add database logging for Prisma and Drizzle ([964ee51](https://github.com/Arakiss/vestig/commit/964ee51e61cd4c3cd94af9b139748c4c585c3774))
* **next:** add Dev Overlay for real-time log viewing ([cf309e1](https://github.com/Arakiss/vestig/commit/cf309e17843cf2f23a10ef89106b6f2321847699))
* **next:** add enhanced Error Boundary with breadcrumbs ([61d15cb](https://github.com/Arakiss/vestig/commit/61d15cb8cff7243b8ea1171ac385543e5d1a7cdb))
* **next:** add WebVitals and Route Metrics module ([b7c93fa](https://github.com/Arakiss/vestig/commit/b7c93fa5621a7806c9276f9248d0d1f9e13bd8ae))
* **web:** add comprehensive SEO infrastructure and blog section ([d9f035e](https://github.com/Arakiss/vestig/commit/d9f035edb3308958262505d38a772e373b42c576))

### 🐛 Bug Fixes

* **web:** remove broken links to non-existent pages ([56c7db2](https://github.com/Arakiss/vestig/commit/56c7db2b4d2eaac5f3bb15ff4b500b345536ed93))
* **web:** update landing page content for v0.7.0 ([ddd5ed2](https://github.com/Arakiss/vestig/commit/ddd5ed24c6dc9db5095df14f59f231ce90db2e40))

### 📚 Documentation

* update documentation for v0.7.0 release ([db7b9d7](https://github.com/Arakiss/vestig/commit/db7b9d725a84f9980f11a23266f3220051cd80a6))
* **web:** add new documentation pages ([a92ee86](https://github.com/Arakiss/vestig/commit/a92ee86758a361c1f6ab547a551cc5dd8ad1dbdd))

### ⚠️ BREAKING CHANGES

* **express:** Remove `@vestig/express` package - Vestig now focuses exclusively on Next.js ([53cab0a](https://github.com/Arakiss/vestig/commit/53cab0a))

## [0.7.0](https://github.com/Arakiss/vestig/compare/v0.6.0...v0.7.0) (2025-12-22)

### ✨ Features

* **runtime:** add full Deno support with runtime detection and AsyncLocalStorage
* **tracing:** add W3C Trace Context tracestate support (parseTracestate, createTracestate, get/set/delete utilities)
* **next:** export VestigErrorBoundary component with breadcrumb trail for error context
* **next:** add offline queue with localStorage persistence for client-side logs
* **sampling:** add probability, rate-limit, namespace-based, and composite samplers

### 📚 Documentation

* update README with Sampling documentation section
* clarify browser support requirements
* mark Deno as fully supported runtime

### ✅ Tests

* add 47 tests for W3C tracestate support
* add 38 tests for DatadogTransport
* add 41 tests for FileTransport
* add 29 tests for VestigErrorBoundary component
* add 15 tests for offline queue persistence
* add React hooks tests for @vestig/next/client
* **total:** 898 tests passing (1,706 assertions)

## [0.6.0](https://github.com/Arakiss/vestig/compare/v0.5.0...v0.6.0) (2025-12-21)

### ✨ Features

* **next:** add span support to route handler and action contexts ([09801ad](https://github.com/Arakiss/vestig/commit/09801ad1b58f589a872400d0bd32af3b4d0dbf9e))

## [0.5.0](https://github.com/Arakiss/vestig/compare/v0.4.0...v0.5.0) (2025-12-21)

### ✨ Features

* **demo:** add interactive playground pages for all features ([2c6dbfe](https://github.com/Arakiss/vestig/commit/2c6dbfe4ada72f7ab3b7ec969ba4b8d1a560482b))
* **tracing:** add native tracing API with span(), startSpan(), and context propagation ([f0917c7](https://github.com/Arakiss/vestig/commit/f0917c73fb6fb6526df18fd85fe9fdbe87cef0ea))

### 📚 Documentation

* add v1.0.0 roadmap ([e6739a5](https://github.com/Arakiss/vestig/commit/e6739a5115c8937aca0516c9bac6906f54240331))

### ✅ Tests

* **next:** add comprehensive test suite with 205 tests ([fd7f336](https://github.com/Arakiss/vestig/commit/fd7f33672e7c1e321e449deba401a50cafb27d67))

## [0.4.0](https://github.com/Arakiss/vestig/compare/v0.3.1...v0.4.0) (2025-12-20)

### ✨ Features

* **express:** add @vestig/express middleware package ([6d6d9fd](https://github.com/Arakiss/vestig/commit/6d6d9fda0ff0dc52b07d41e3b2af364b3f5e16a4))

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
