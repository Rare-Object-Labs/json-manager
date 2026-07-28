# Architecture

## Overview

`{{REPO_NAME}}` is a client-side React application written in TypeScript and built with Vite.

## Current structure

```text
Browser
  └─ Vite application
      └─ React component tree
          ├─ Responsive app shell
          └─ Product components added later
```

## Tooling

- Vite provides local development and production bundling.
- TypeScript provides static type checking.
- ESLint enforces baseline code quality rules.
- Vitest and Testing Library provide component tests.

## Boundaries

The starter has no server runtime, database, authentication layer, payment integration, or external API dependency. Add infrastructure only through an explicit architectural decision.

## Deployment foundation

The standard proof-of-concept delivery path is:

```text
GitHub source repository
  └─ Cloudflare Pages static deployment
      └─ Cloudflare-managed DNS
          └─ {{POC_DOMAIN}}
              └─ Registered under rareobjectlabs.app at Porkbun
```

- Porkbun is the domain registrar.
- Cloudflare is the DNS provider.
- Cloudflare Pages hosts the POC static build.
- GitHub provides source control.
- `rareobjectlabs.app` is the umbrella domain.
- Each app uses `{{POC_DOMAIN}}`, defaulting to `{{REPO_NAME}}.rareobjectlabs.app`.

For example, repositories may be published at `stackmap.rareobjectlabs.app` or `parenting-time.rareobjectlabs.app`.

These services are deployment infrastructure, not application runtime dependencies. The starter contains no Cloudflare-specific application code and does not provision hosting or DNS.

## Configuration

`POC_DOMAIN` is deployment metadata and should be populated with `{{POC_DOMAIN}}` when the template is instantiated. Public runtime configuration may use Vite environment variables prefixed with `VITE_`. Secrets must not be placed in frontend environment variables.
