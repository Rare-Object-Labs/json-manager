# Agent Guidance

This repository is the `JSON Manager` application, created from the reusable `app-starter` frontend template.

## Working agreement

- Keep the application frontend-only. All file access happens in the browser: the File System Access API (`window.showOpenFilePicker`) where supported, and a plain `<input type="file">` plus a download-based save otherwise. There is no backend, no server directory, and no `/api/*` endpoints.
- Files stay on the user's computer; file contents must never be uploaded, transmitted, or stored off-device. Do not send file data to any service.
- Do not add a database, authentication, Supabase, cloud storage, or unnecessary frameworks/libraries.
- Do not add JSX runtime dependencies or a UI framework; prefer plain CSS.
- Use React, TypeScript, and Vite; preserve strict TypeScript checks.
- Preserve record IDs, ZIP strings, unknown properties, and existing values; never silently normalize or renumber data.
- Never auto-load a JSON file: every page load begins with no file selected, and the user must choose one with **Choose File**. Do not add recent-file history, favorites, settings persistence, or environment-based file paths.
- No backups or automatic file writes: the original file changes only on an explicit **Save Changes**. In fallback browsers, saving downloads the updated file instead of overwriting the original.
- Prefer small, accessible components and plain CSS over unnecessary dependencies.
- Keep product behavior out of the starter. Add features only when requirements call for them.
- Never expose secrets in client code or commit local environment files or local JSON data.
- Update documentation when architecture or project conventions change.
- Treat Porkbun registration, Cloudflare DNS, Cloudflare Pages, and GitHub source control as external deployment concerns; do not configure or create those resources without explicit authorization.
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
- POC hosting: Cloudflare Pages (static frontend)
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- Hosted POC domain: `jsonmanager.rareobjectlabs.app` → Cloudflare Pages → static build of the frontend

This is documentation metadata only. Do not add provider-specific application code to implement it.