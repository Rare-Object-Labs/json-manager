# Architecture

## Overview

`json-manager` is a client-side React application written in TypeScript and built with Vite, paired with a small local Node file API that reads and writes one JSON file from disk.

## Current structure

```text
Browser
  └─ React component tree (src/)
      └─ Vite dev/preview server
          └─ JSON Manager API middleware (server/)
              ├─ resolves the active JSON file (env or chooser)
              ├─ returns records to the browser
              ├─ validates saved documents
              ├─ creates timestamped backups in db-backups/
              └─ writes back to the original file atomically
```

The API is registered as Vite middleware via a small plugin (`server/plugin.ts`), so it runs inside the dev server (`npm run dev`) and the preview server for built output (`npm run preview`) without a separate process or an HTTP framework. It uses only Node built-ins (`node:fs`, `node:path`, `node:child_process`).

## Active file state

The API keeps an in-memory active-file path. At startup the plugin initializes it from `JSON_MANAGER_FILE` when configured; otherwise it starts empty and the app shows a "no file selected" state. Choosing a file through the dialog replaces the active path only after the file has been read and validated. Saved documents and backups always target the currently active file. No recent-file history or settings persistence exists.

## File API surface

- `GET /api/records` — reads and validates the active file and returns `{ configured, fileName, struct }`. If no file is active it returns `{ configured: false }`.
- `POST /api/save` — receives `{ content }`, validates the JSON and the `_default` structure, copies the current file into `db-backups/`, then writes the re-serialized document to the active path through a temporary file plus rename.
- `POST /api/select-file` — opens a native Windows file dialog, verifies and validates the selected file, and only then makes it the active file, returning the same shape as `GET /api/records` (`{ cancelled: true }` when the user cancels).

Errors are returned as `{ error: { code, message } }` with readable messages. The full filesystem path is never sent to the browser; the UI only receives the filename.

## Windows file chooser

The app is Windows-focused. The chooser (`server/select-file.ts`) invokes `powershell.exe` with a small `System.Windows.Forms.OpenFileDialog` script, filtered to `JSON files (*.json)` and `All files (*.*)`. There is no npm dependency and no cross-platform abstraction; on non-Windows platforms the endpoint reports that the chooser requires Windows. The browser-side `<input type="file">` is deliberately not used because it does not expose a filesystem path the local API can later save back to.

## Data model rules

- Record IDs are string object keys under `_default`; existing IDs are never renumbered.
- New IDs are `max(existing numeric IDs) + 1`.
- ZIP codes remain strings so leading zeroes are preserved.
- Unknown root properties and unknown record properties are preserved.
- Saved output uses 2-space indentation.

## Tooling

- Vite provides local development, production bundling, and the preview server that hosts the API.
- React and TypeScript provide the UI and static type checking.
- ESLint enforces baseline code quality rules.
- Vitest and Testing Library provide unit and component tests for both `src/` and `server/`.

## Boundaries

JSON Manager has no server runtime beyond the local middleware, no database, no authentication layer, no payment integration, and no external API dependency. All durable state lives in the currently active local file; the active-file path itself is in-memory and reset on restart.

## Deployment foundation

The standard proof-of-concept delivery path is:

```text
GitHub source repository
  └─ Cloudflare Pages static deployment
      └─ Cloudflare-managed DNS
          └─ json-manager.rareobjectlabs.app
              └─ Registered under rareobjectlabs.app at Porkbun
```

- Porkbun is the domain registrar.
- Cloudflare is the DNS provider.
- Cloudflare Pages hosts the POC static build.
- GitHub provides source control.
- `rareobjectlabs.app` is the umbrella domain.
- Each app uses a POC domain, defaulting to `json-manager.rareobjectlabs.app`.

For example, repositories may be published at `stackmap.rareobjectlabs.app` or `parenting-time.rareobjectlabs.app`.

These services are deployment infrastructure, not application runtime dependencies. The starter contains no Cloudflare-specific application code and does not provision hosting or DNS.

## Configuration

`POC_DOMAIN` is deployment metadata and is populated with `json-manager.rareobjectlabs.app` for this project. `JSON_MANAGER_FILE` is Node-side configuration that seeds the active file at startup and is never exposed to browser code; the UI only displays the filename. Public runtime configuration may use Vite environment variables prefixed with `VITE_`. Secrets must not be placed in frontend environment variables.