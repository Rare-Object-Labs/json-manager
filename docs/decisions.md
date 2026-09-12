# Architecture Decisions

Record durable technical choices here so future contributors understand their context and tradeoffs.

## ADR-001: React with TypeScript and Vite

**Status:** Accepted

**Context:** `JSON Manager` needs a lightweight, reusable frontend foundation.

**Decision:** Use React for the user interface, TypeScript for static checks, and Vite for development and production builds.

**Consequences:** The starter has a fast local workflow and a small configuration surface. Product-specific architecture remains intentionally undecided.

## ADR-002: Frontend-only starter

**Status:** Accepted

**Context:** The template must remain reusable across applications with different infrastructure needs.

**Decision:** Do not include a backend, authentication, payments, external APIs, or app-specific features.

**Consequences:** Applications add those capabilities only when their requirements and security model are known.

## ADR-003: Standard POC deployment foundation

**Status:** Accepted

**Context:** Applications created from the starter need a consistent proof-of-concept publishing convention without coupling application code to deployment providers.

**Decision:** Use GitHub for source control, Cloudflare Pages for POC hosting, Cloudflare for DNS, and Porkbun as the registrar for the `rareobjectlabs.app` umbrella domain. Each application uses a POC domain, which for this project is `json-manager.rareobjectlabs.app`.

**Consequences:** POC URLs are predictable across applications. DNS and hosting remain external configuration concerns; this decision adds no Cloudflare-specific application code and provisions no resources.

## ADR-004: Small local Node file API

**Status:** Accepted

**Context:** JSON Manager must read and write an existing local JSON file that acts like a database for the user. A browser-only frontend cannot do this safely; it needs a small Node-side layer.

**Decision:** Keep the React + TypeScript + Vite frontend, and add the smallest practical local Node API as Vite middleware using only Node built-ins (`node:fs`, `node:path`, the HTTP request/response objects Vite provides). No Express, database, authentication, or external service. The file path is never auto-loaded and is never sent to the browser.

**Consequences:** The app runs entirely locally. Saves go through a validated backup-then-atomic-write sequence so the original file stays intact on any failure. This is an explicit exception to the starter's frontend-only default, documented here and in the architecture notes.

## ADR-005: Native Windows file chooser with in-memory active file

**Status:** Accepted

**Context:** The user manages multiple JSON files in different folders and needs to switch between them from inside the app. A browser file input is unusable for this: it does not provide a filesystem path the local API can later save back to.

**Decision:** Add a `POST /api/select-file` endpoint that opens a native Windows `OpenFileDialog` through PowerShell (`System.Windows.Forms`), using Node's built-in `child_process`. The server keeps an in-memory active-file path, replaced only when a selected file passes the exact same validation used elsewhere, and used for all subsequent reads, saves, and backups.

**Consequences:** No new npm dependency and no HTML file input needed; no recent-file history or settings database is persisted. This is explicitly Windows-focused — the chooser requires Windows and there is no cross-platform abstraction yet.

## ADR-006: The active file is always chosen manually

**Status:** Accepted

**Context:** Before production hosting, automatic startup loading was possible: a `JSON_MANAGER_FILE` environment variable (and `.env.local`) could seed the active file at startup. For a tool that writes to local data, silently opening a file on boot is surprising and fragile.

**Decision:** Remove all automatic-loading behavior. The active-file state is created empty on every start, in both development and production. There is no environment variable, `.env` value, previously selected path, recent-file history, or remembered setting that can load a file. The only path to an active file is: user clicks **Choose File** → native Windows picker → user selects a file → the server reads and validates it → it becomes the active file.

**Consequences:** No migration path exists for the removed `JSON_MANAGER_FILE` variable — the app always requires manual selection. The server-side `.env` resolution module and its tests were deleted. Behavior is identical in development and production.

## ADR-007: Node production server entry point

**Status:** Accepted

**Context:** The POC is hosted by running JSON Manager locally behind a Cloudflare Tunnel. Production needs the built frontend and the local file API served from one local HTTP endpoint at `http://127.0.0.1:4173`.

**Decision:** Add `server/index.ts`, a plain Node built-in HTTP server (`node:http`) used by `npm run start`. It mounts the same API middleware used by the Vite plugin and serves `dist/` through a small static file handler (`server/static.ts`) with MIME types and traversal protection. `npm run start` refuses to start with a clear message when `dist` is missing. Server TypeScript runs directly under Node's native type stripping; relative imports on the Node-loaded path use explicit `.ts` extensions (allowed by `tsconfig.node.json`).

**Consequences:** No Express or additional runtime dependencies; one shared API implementation for development and production. The server listens on `127.0.0.1:4173` by default. Cloudflare Tunnel, DNS, and registration remain external deployment concerns and are not configured in the repository.

## New decision template

Copy this section for future decisions:

```text
## ADR-NNN: Decision title

Status:
Context:
Decision:
Consequences:
```
