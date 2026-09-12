# Agent Guidance

This repository is the `JSON Manager` application, created from the reusable `app-starter` frontend template and extended with a small local Node file API (see ADR-004).

## Working agreement

- Keep the application a local utility. The only backend surface is the small Node file API in `server/`; keep it minimal and restricted to reading and writing the currently active JSON file.
- The API keeps an in-memory active-file path for the current server session only. It is never seeded by an environment variable or a previous selection: every server start begins with no active file, and the user must explicitly choose one with the native file picker (`POST /api/select-file`, Windows-only, PowerShell/Windows Forms via `node:child_process`). Do not add automatic loading, recent-file history, favorites, or settings persistence, and do not add a cross-platform abstraction.
- Do not add a database, authentication, Supabase, cloud storage, or unnecessary frameworks/libraries.
- Do not add JSX runtime dependencies or a UI framework; prefer plain CSS.
- Use React, TypeScript, and Vite; preserve strict TypeScript checks.
- Preserve record IDs, ZIP strings, unknown properties, and existing values; never silently normalize or renumber data.
- Prefer small, accessible components and plain CSS over unnecessary dependencies.
- Keep product behavior out of the starter. Add features only when requirements call for them.
- Never expose secrets in client code, the filesystem path in browser code, or commit local environment files or local JSON data.
- Update documentation when architecture or project conventions change.
- Treat Porkbun registration, Cloudflare DNS, the Cloudflare Tunnel, and GitHub source control as external deployment concerns; do not configure or create those resources without explicit authorization.
- Use `jsonmanager.rareobjectlabs.app` as the app's hosted POC domain unless the project specifies a different one.

## Required validation

Before completing a code change, run:

```powershell
npm run lint
npm test
npm run build
```

Add or update Vitest tests for behavior changes. Keep generated files such as `dist` and `coverage` out of version control.

## Instantiated values

This project was created from the `app-starter` template with:

- Display name: `JSON Manager`
- Repository name: `json-manager`
- Folder name: `json-manager`
- Description: `A local web application for viewing, editing, adding, and deleting records in a structured JSON file.`
- Hosted POC domain: `jsonmanager.rareobjectlabs.app`

## Deployment convention

- Registrar: Porkbun
- DNS provider: Cloudflare
- POC hosting: local Node server accessed via a Cloudflare Tunnel
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- Hosted POC domain: `jsonmanager.rareobjectlabs.app` → Cloudflare Tunnel → `http://127.0.0.1:4173`

This is documentation metadata only. Do not add provider-specific application code to implement it.
