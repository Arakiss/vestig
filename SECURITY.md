# Security Policy

Vestig is a logging and observability library. Security reports are taken seriously because logger configuration can include transport credentials, request metadata, and sanitized application context.

## Supported Versions

Vestig is currently pre-1.0. Security fixes are shipped on the latest released minor line. Users should upgrade to the latest published `vestig` and `@vestig/next` versions before reporting behavior that may already be fixed.

## Reporting a Vulnerability

Do not open a public GitHub issue for a suspected vulnerability.

Use GitHub private vulnerability reporting from the repository Security tab when available:

https://github.com/Arakiss/vestig/security/advisories/new

If private vulnerability reporting is unavailable for your GitHub account, contact the maintainer privately through GitHub and avoid sharing exploit details publicly.

Please include:

- affected package and version;
- runtime and deployment environment;
- minimal reproduction or vulnerable configuration;
- whether credentials, PII, logs, or transport payloads can be exposed;
- any known workaround.

## Scope

Security-relevant areas include:

- PII sanitization and redaction behavior;
- transport credential handling;
- HTTP, OTLP, Datadog, Sentry, and custom transport payloads;
- browser/client logging behavior in `@vestig/next`;
- package publication, provenance, and dependency supply-chain controls.

## Disclosure Process

1. The maintainer acknowledges the report when it is received.
2. The issue is reproduced and scoped privately.
3. A fix is prepared with regression coverage where feasible.
4. A patched version is published.
5. A public advisory or changelog note is added when disclosure is safe.

## Hardening Baseline

The project should maintain:

- Bun-based tests for security-sensitive behavior;
- no Vitest dependency in the test workflow;
- npm provenance for CI-published packages where supported;
- preference for npm Trusted Publishing over long-lived publish tokens;
- clear changelog entries for security fixes and operationally relevant behavior changes.
