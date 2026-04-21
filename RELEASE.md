# Release Process

Vestig releases must be useful to both humans and automated agents. Do not rely on the generated conventional-commit changelog as the final release communication.

## Release Note Standard

Every public release note should answer these questions:

- What changed for users?
- Which bugs or issues were fixed?
- What behavior changed at runtime?
- Is any migration needed?
- How was the release verified?
- Are there known publication or rollout caveats?

For maintenance releases, prefer concrete bullets over generic summaries. A line such as `harden log delivery and next exports` is not enough because it does not explain failure modes, operational impact, or verification.

## Required Sections

Use the sections that apply:

- `Summary`: one short paragraph with the release purpose.
- `Fixed`: user-visible defects and linked issues.
- `Changed`: behavior, runtime compatibility, packaging, and API surface changes.
- `Added`: new APIs or options.
- `Security`: supply-chain, dependency, authentication, provenance, or vulnerability-handling changes.
- `Migration`: required user action, even if the answer is `None`.
- `Verification`: Bun test/build/typecheck commands and any manual smoke tests.
- `Known Issues`: publication, registry, platform, or rollout caveats.
- `Thanks`: reporters and contributors who materially shaped the release.

## GitHub Threads

After the release is published to npm:

- thank each reporter or contributor by handle;
- mention the exact package and version that contains the fix;
- include a minimal verification command or usage snippet;
- keep the issue closed only if the fix is actually available from npm.

If npm publication is blocked, say so explicitly and update the thread again after publication succeeds.

## Changelog Sync

`CHANGELOG.md`, the GitHub Release body, and `apps/web/app/changelog/page.tsx` must all describe the same release. The web changelog can be shorter than the GitHub Release body, but it must still include concrete user impact.

Before pushing release-related changes:

```sh
bun run format:check
bun run validate:changelog
```

Before considering a release complete:

```sh
bun run test
bun run typecheck
bun run build
bun pm view vestig version
bun pm view @vestig/next version
```

## LLM-Facing Documentation

Vestig documentation is expected to be consumed by coding agents as much as by people. Any user-facing API change should update:

- package README examples;
- website API/reference pages;
- `apps/web/public/llms-full.txt` through the normal website build;
- changelog entries with enough context for an agent to choose the correct API.

Good LLM-facing docs include:

- canonical imports;
- minimal complete examples;
- runtime constraints;
- explicit default values;
- failure behavior;
- migration notes;
- links between related APIs.

## Publish Security

Prefer npm Trusted Publishing over long-lived npm tokens. When token-based publishing is still needed, use the narrowest publish-capable token and rotate it after any accidental exposure.

The publish workflows should keep npm provenance enabled where supported so users can verify where packages were built.
