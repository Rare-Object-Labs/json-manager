# Architecture

## Overview

`json-manager` is a client-side React application written in TypeScript and built with Vite, paired with a small local Node file API (`server/`) that reads and writes one JSON file from disk.

## Current structure

```text
Browser
  └─ React component tree (src/)
      ├─ Vite dev server          (npm run dev)
      │     └─ JSON Manager API middleware (server/plugin.ts)
      └─ Production server        (npm run start)
            ├─ Node built-in HTTP server (server/index.ts)
            │     ├─ serves the built frontend from dist/  (server/static.ts)
            │     └─ JSON Manager API middleware (server/api.ts)
            └─ shared API support
                  ├─ validates saved documents
                  ├─ creates timestamped backups in db-backups/
                  └─ writes back to the original file atomically
```

The API middleware (`server/api.ts`) is shared: Vite registers it through the plugin for `npm run dev`, and the production server (`server/index.ts`) mounts the same middleware for `/api/*` while serving `dist/` with a small Node static file handler. Both paths use only Node built-ins (`node:fs`, `node:path`, `node:http`, `node:child_process`); there is no Express or other HTTP framework.

## Active file state

The API keeps an in-memory active-file path for the current server session only, initialized to **nothing** on every start. There is no environment variable, `.env` value, previous selection, history, or any other mechanism that can preload a file. The active path changes only when `POST /api/select-file` returns a validated file, and it is used for all subsequent reads, saves, and backups. Restarting the server clears it. No recent-file history or settings persistence exists.

## File API surface

- `GET /api/records` — reads and validates the active file and returns `{ configured, fileName, struct }`. Because no file is ever auto-loaded, a freshly started server returns `{ configured: false }`.
- `POST /api/save` — receives `{ content }`, validates the JSON and the `_default` structure, copies the current file into `db-backups/`, then writes the re-serialized document to the active path through a temporary file plus rename. Without an active file it returns `not_configured`.
- `POST /api/select-file` — opens a native Windows file dialog, verifies and validates the selected file, and only then makes it the active file, returning the same shape as `GET /api/records` (`{ cancelled: true }` when the user cancels).

Errors are returned as `{ error: { code, message } }` with readable messages. The full filesystem path is never sent to the browser; the UI only receives the filename.

## Windows file chooser

The app is Windows-focused. The chooser (`server/select-file.ts`) invokes `powershell.exe` with a small `System.Windows.Forms.OpenFileDialog` script, filtered to `JSON files (*.json)` and `All files (*.*)`. There is no npm dependency and no cross-platform abstraction; on non-Windows platforms the endpoint reports that the chooser requires Windows. The browser-side `<input type="file">` is deliberately not used because it does not expose a filesystem path the local API can later save back to.

## Production server

`npm run start` runs `server/index.ts` with Node directly (Node runs the TypeScript with native type stripping; see `tsconfig.node.json` `allowImportingTsExtensions` for the `.ts` import style). It:

- refuses to start with a clear message if `dist/index.html` is missing (`npm run build` first)
- serves the built frontend from `dist` with correct MIME types and traversal protection (`server/static.ts`)
- mounts the shared API middleware for `/api/*`
- listens on `http://127.0.0.1:4173` by default (`HOST`/`PORT` environment variables may override)
- always starts with no file selected

## Data model rules

- Record IDs are string object keys under `_default`; existing IDs are never renumbered.
- New IDs are `max(existing numeric IDs) + 1`.
- ZIP codes remain strings so leading zeroes are preserved.
- Unknown root properties and unknown record properties are preserved.
- Saved output uses 2-space indentation.

## Tooling

- Vite provides local development and production bundling of the frontend.
- The production server is a plain Node built-in HTTP server; the API middleware is shared with the Vite plugin.
- React and TypeScript provide the UI and static type checking.
- ESLint enforces baseline code quality rules.
- Vitest and Testing Library provide unit and component tests for both `src/` and `server/`.

## Boundaries

JSON Manager has no database, authentication layer, payment integration, cloud storage, or external API dependency. Its only backend surface is the local Node file API. All durable state lives in the currently active local file; the active-file path itself is in-memory and reset on restart.

## Deployment foundation

The intended proof-of-concept hosting runs the production server locally behind a Cloudflare Tunnel:

```text
https://jsonmanager.rareobjectlabs.app
  -> Cloudflare Tunnel
  -> http://127.0.0.1:4173
  -> local JSON Manager Node server
  -> explicitly selected local JSON file
```

- Porkbun is the domain registrar.
- Cloudflare is the DNS provider and hosts the tunnel.
- The Node production server (`npm run start`) listens on `127.0.0.1:4173`.
- GitHub provides source control.
- `rareobjectlabs.app` is the umbrella domain.
- The app's hosted POC domain is `jsonmanager.rareobjectlabs.app`.

The Cloudflare Tunnel, DNS records, and registration are deployment infrastructure, not application runtime dependencies. This repository contains no tunnel or DNS configuration and provisions nothing.

## Configuration

`POC_DOMAIN` is deployment metadata populated with `jsonmanager.rareobjectlabs.app` for this project. There is no application configuration that controls file selection: the active file is always chosen manually in the UI on every server start.