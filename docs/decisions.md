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

**Decision:** Keep the React + TypeScript + Vite frontend, and add the smallest practical local Node API as Vite middleware using only Node built-ins (`node:fs`, `node:path`, the HTTP request/response objects Vite provides). No Express, database, authentication, or external service. The file path is configured with the Node-side `JSON_MANAGER_FILE` environment variable and is never sent to the browser.

**Consequences:** The app runs entirely locally in the Vite dev/preview server process. Saves go through a validated backup-then-atomic-write sequence so the original file stays intact on any failure. This is an explicit exception to the starter's frontend-only default, documented here and in the architecture notes.

## ADR-005: Native Windows file chooser with in-memory active file

**Status:** Accepted

**Context:** The user manages multiple JSON files in different folders and needs to switch between them from inside the app. A browser file input is unusable for this: it does not provide a filesystem path the local API can later save back to.

**Decision:** Add a `POST /api/select-file` endpoint that opens a native Windows `OpenFileDialog` through PowerShell (`System.Windows.Forms`), using Node's built-in `child_process`. The server keeps an in-memory active-file path, seeded from `JSON_MANAGER_FILE` at startup, replaced only when a selected file passes the exact same validation used elsewhere, and used for all subsequent reads, saves, and backups. The app starts in a usable "no file selected" state when no environment variable is set.

**Consequences:** No new npm dependency and no HTML file input needed; no recent-file history or settings database is persisted. This is explicitly Windows-focused — the chooser requires Windows and there is no cross-platform abstraction yet.

## New decision template

Copy this section for future decisions:

```text
## ADR-NNN: Decision title

Status:
Context:
Decision:
Consequences:
```
