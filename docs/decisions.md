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

**Decision:** Use GitHub for source control, Cloudflare Pages for POC hosting, Cloudflare for DNS, and Porkbun as the registrar for the `rareobjectlabs.app` umbrella domain. Each application uses a POC domain, which for this project is `jsonmanager.rareobjectlabs.app`.

**Consequences:** POC URLs are predictable across applications. DNS and hosting remain external configuration concerns; this decision adds no Cloudflare-specific application code and provisions no resources.

## ADR-004: Frontend-only file handling

**Status:** Accepted

**Context:** JSON Manager must read and write one existing local JSON file that acts like a database for the user. An earlier architecture reached for a small local Node file API as Vite middleware with a production Node server; that backend surface is gone.

**Decision:** Keep the React + TypeScript + Vite frontend and handle the file entirely in the browser. There is no backend, no `/api/*` endpoints, no server directory, no environment-based file loading, no backups, and no build-time file access. File contents are read, edited, validated, and written in the browser and never leave it.

**Consequences:** The app is a static frontend that can be hosted on Cloudflare Pages. Save behavior depends on browser support: Chromium browsers write back to the original file through the File System Access API, while other browsers cannot overwrite the original and download the updated JSON instead. The original file is only modified on an explicit **Save Changes**.

## ADR-005: File System Access API with file-input fallback

**Status:** Accepted

**Context:** The app must work for users in browsers that do or do not implement the File System Access API, without blocking anyone.

**Decision:** Feature-detect `'showOpenFilePicker' in window` at runtime (never by browser-name sniffing). Where present, use `window.showOpenFilePicker` for selection and a `FileSystemFileHandle` for reads and in-place writes. Where absent, fall back to `<input type="file" accept=".json,application/json">` and, since the original file cannot be overwritten, download the updated JSON with the original filename on save — with an unobtrusive explanation shown to the user.

**Consequences:** No new npm dependency and no backend. Chromium-based browsers get true in-place editing; other browsers still get full viewing, searching, sorting, and editing with a download-based save. The app stays fully functional in every browser.

## ADR-006: The active file is always chosen manually

**Status:** Accepted

**Context:** Automatic startup loading (an environment variable, a remembered path, or anything similar) is surprising and fragile for a tool that writes to local data.

**Decision:** Remove all automatic-loading behavior. Every page load begins with no file selected, and there is no environment variable, `.env` value, previously selected file, recent-file history, or remembered setting that can load a file. The only path to an active file is: user clicks **Choose File** → picker or file input → user selects a file → the browser reads and validates it → it becomes the active file for that page session.

**Consequences:** No migration path exists for the removed `JSON_MANAGER_FILE` variable — the app always requires manual selection. Behavior is identical in development and production, and every page load starts clean.

## New decision template

Copy this section for future decisions:

```text
## ADR-NNN: Decision title

Status:
Context:
Decision:
Consequences:
```