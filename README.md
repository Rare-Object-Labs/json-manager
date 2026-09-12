# JSON Manager

A small local web application for viewing, editing, adding, and deleting records in a structured JSON file. There is no database, authentication, or external service: the app reads and writes one local JSON file that you point it at.

## Data file format

Records live under a `_default` root object whose keys are numeric-string record IDs:

```json
{
  "_default": {
    "2": {
      "uname": "Sparks 89431",
      "name": "Tobi Returns",
      "address": "50 Greg St",
      "address2": "",
      "city": "Sparks",
      "state": "NV",
      "zip": "89431",
      "phone": "",
      "zone": "",
      "region": ""
    },
    "3": { ... }
  }
}
```

Data rules the app follows:

- IDs are string object keys, not array indexes. Existing records are never renumbered.
- New records use `max(existing numeric IDs) + 1`.
- ZIP codes stay strings so leading zeroes are preserved.
- The `_default` root structure is preserved on save.
- Unknown root properties and unknown record properties are preserved.
- Existing values are never silently trimmed, normalized, corrected, or reinterpreted.

## How it works

The React frontend is built with Vite. A small local Node API (`server/`) provides everything the frontend needs: loading the active JSON file, choosing a file with a native Windows dialog, validating, saving with backups, and atomic writes.

- In development (`npm run dev`) the API is registered as Vite middleware and runs inside the Vite process.
- In production (`npm run start`) the same API is served by a small Node built-in HTTP server (`server/index.ts`) that also serves the built frontend from `dist`.

The API:

- never loads a JSON file automatically; the active file is always chosen by the user with **Choose File**
- lets the user choose a different JSON file at any time through a native Windows file dialog (see below)
- validates that the file is valid JSON with a `_default` object
- validates every saved document before writing
- creates a timestamped backup in a `db-backups` folder beside the file before each save
- writes the updated file back to the exact original path using a temporary file and rename, so a failed save never leaves a partially written file

## Prerequisites

- Node.js 22.18 or newer (`npm run start` runs TypeScript directly and needs native type-stripping support)
- npm 10 or newer

## Getting started

1. Install dependencies with `npm install`.
2. Run `npm run dev` and open the URL Vite prints.
3. Click **Choose File** and select the JSON file you want to manage.

The app never opens a file on its own. Every server start begins with **No file selected**, and the selected file is kept in memory only for that server session.

## Choosing a file

The app manages one JSON file at a time, and **you always choose it from the UI — there is no automatic loading.** Click **Choose File** in the header. The app opens a native Windows file dialog (powered by PowerShell and Windows Forms) that filters for `*.json` files. The app reads and validates the chosen file before making it the active file, and still writes saves and backups to exactly that file. If you have unsaved edits, you are asked for confirmation before switching. Selecting a file never modifies it.

The selected file is the only thing the API reads and writes for the rest of that server session. Restarting the server clears the selection: on restart you must choose the file again. No recent-file history, favorites, or remembered paths exist.

> The chooser is currently Windows-only. It is the primary mechanism because a browser file input does not expose a filesystem path the local API can later save back to.

## Available commands

- `npm run dev` starts the Vite development server with the local file API.
- `npm run build` type-checks and creates a production build in `dist` (plus the API used by `npm run start`).
- `npm run start` starts the production server for the built app. It fails with a clear message if `dist` has not been built, so always run `npm run build` first.
- `npm run preview` serves a built `dist` through Vite's preview server with the local file API enabled (development convenience).
- `npm run lint` checks the codebase with ESLint.
- `npm test` runs the Vitest test suite once.
- `npm run test:watch` runs Vitest in watch mode.

## Running the production server

```text
npm run build
npm run start
```

`npm run start` runs `server/index.ts` with Node directly (no build step for the server) and:

- serves the built frontend from `dist`
- serves the same `/api/*` routes as development (records, save, select-file)
- listens on `127.0.0.1:4173` by default
- always starts with no file selected — tell the user to click **Choose File**

## Production hosting

The intended hosted setup runs the production server locally behind a Cloudflare Tunnel:

```text
https://jsonmanager.rareobjectlabs.app
  -> Cloudflare Tunnel
  -> http://127.0.0.1:4173
  -> local JSON Manager Node server
  -> explicitly selected local JSON file
```

The Cloudflare Tunnel, DNS records, and registration are external deployment concerns and are not configured in this repository.

## Backups

Before every save the API copies the current on-disk file into a `db-backups` folder created beside the JSON file, using a timestamped name such as:

```text
db-20260912-134506-123.json
```

If multiple backups share a timestamp, a numeric suffix is appended. The original file is only replaced after the backup has been written.

## Unsaved changes

All edits happen in the in-memory working copy. Nothing is written until **Save Changes** is clicked. While there are unsaved changes the header shows an indicator, the browser warns before refresh/navigation, and **Reload from Disk** and **Choose File** both ask for confirmation before discarding your local changes.

## Sorting

Every table column except **Actions** is sortable by clicking its header: click once for ascending, again for descending, and on a different column to start ascending there. Sorting is client-side only and never changes the underlying record order or the JSON file; it applies to whatever rows match the current search.

## Environment variables

There are no application environment variables. JSON Manager never loads a JSON file automatically, so there is nothing to configure for a startup file — the active file is always chosen with **Choose File**.

- `POC_DOMAIN` — deployment metadata, not exposed to browser code.
- Browser-visible variables must use the `VITE_` prefix. Do not commit secrets.

## Standard deployment foundation

Proof-of-concept deployments follow this convention:

```text
https://jsonmanager.rareobjectlabs.app
  -> Cloudflare Tunnel
  -> http://127.0.0.1:4173
```

- Registrar: Porkbun
- DNS provider: Cloudflare
- POC hosting: local Node server accessed via a Cloudflare Tunnel
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- App POC domain: `jsonmanager.rareobjectlabs.app`

This template documents the convention only. Cloudflare configuration, DNS records, and deployment setup are performed separately.

## Project structure

```text
src/                  React application, components, and tests
server/               Local Node file API and production server entry
docs/                 Product, architecture, and decision records
index.html             Vite HTML entry point
vite.config.ts         Vite and Vitest configuration
eslint.config.js       ESLint flat configuration
```

## Testing

`npm test` runs Vitest. Coverage includes parsing and rejecting the `_default` structure, preserving ZIP strings, next-ID calculation, add/edit/delete operations, serialization, backup/atomic-write behavior, client-side table sorting, the no-auto-load startup state, the choose-file API flow (cancel, switch, invalid files, save/backup of the new file), and the production server's static file serving.

## Customizing the template

This project was created from the `app-starter` template with these values:

- Display name: `JSON Manager`
- Repository name: `json-manager`
- Folder name: `json-manager`
- Description: `A local web application for viewing, editing, adding, and deleting records in a structured JSON file.`
- Hosted POC domain: `jsonmanager.rareobjectlabs.app`

The neutral starter shell has been extended with the JSON Manager interface and a small local file API.