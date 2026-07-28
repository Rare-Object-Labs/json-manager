# Agent Guidance

This repository is the reusable frontend starter for `{{DISPLAY_NAME}}`.

## Working agreement

- Keep the application frontend-only unless the product architecture explicitly changes.
- Use React, TypeScript, and Vite; preserve strict TypeScript checks.
- Prefer small, accessible components and plain CSS over unnecessary dependencies.
- Keep product behavior out of the starter. Add features only when requirements call for them.
- Never expose secrets in client code or commit local environment files.
- Update documentation when architecture or project conventions change.
- Treat Porkbun registration, Cloudflare DNS, Cloudflare Pages hosting, and GitHub source control as external deployment concerns; do not configure or create those resources without explicit authorization.
- Use `{{REPO_NAME}}.rareobjectlabs.app` as the default POC domain unless the instantiated project specifies a different `{{POC_DOMAIN}}`.

## Required validation

Before completing a code change, run:

```powershell
npm run lint
npm test
npm run build
```

Add or update Vitest tests for behavior changes. Keep generated files such as `dist` and `coverage` out of version control.

## Template placeholders

Until bootstrap substitution runs, app-specific values use:

- `{{DISPLAY_NAME}}`
- `{{REPO_NAME}}`
- `{{FOLDER_NAME}}`
- `{{DESCRIPTION}}`
- `{{POC_DOMAIN}}`

## Deployment convention

- Registrar: Porkbun
- DNS provider: Cloudflare
- POC hosting: Cloudflare Pages
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- Default POC domain: `{{REPO_NAME}}.rareobjectlabs.app`

This is documentation metadata only. Do not add provider-specific application code to implement it.
