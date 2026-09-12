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

The React frontend is served by Vite. A small local Node API is registered as Vite middleware, so it runs inside the same process as the dev server (`npm run dev`) and the preview server for built output (`npm run preview`). It only uses Node built-ins (`node:fs`, `node:path`, the HTTP request/response passed by Vite).

The API:

- reads `JSON_MANAGER_FILE` directly from disk and returns its records
- validates that the file is valid JSON with a `_default` object
- validates every saved document before writing
- creates a timestamped backup in a `db-backups` folder beside the file before each save
- writes the updated file back to the exact original path using a temporary file and rename, so a failed save never leaves a partially written file

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer

## Getting started

1. Install dependencies with `npm install`.
2. Point the app at your JSON file (see below).
3. Run `npm run dev` and open the URL Vite prints.

## Pointing it at your db.json

The app needs the `JSON_MANAGER_FILE` environment variable on the Node side. Set it to an absolute path to your JSON file.

PowerShell, for one session:

```powershell
$env:JSON_MANAGER_FILE = "C:\path\to\db.json"
npm run dev
```

Or create a `.env.local` file in this project (it is git-ignored) with:

```text
JSON_MANAGER_FILE=C:\path\to\db.json
```

If `JSON_MANAGER_FILE` is unset, the UI shows a configuration message instead of crashing.

## Available commands

- `npm run dev` starts the Vite development server with the local file API.
- `npm run build` type-checks and creates a production build in `dist`.
- `npm run preview` serves the built app with the local file API enabled.
- `npm run lint` checks the codebase with ESLint.
- `npm test` runs the Vitest test suite once.
- `npm run test:watch` runs Vitest in watch mode.

## Backups

Before every save the API copies the current on-disk file into a `db-backups` folder created beside the JSON file, using a timestamped name such as:

```text
db-20260912-134506-123.json
```

If multiple backups share a timestamp, a numeric suffix is appended. The original file is only replaced after the backup has been written.

## Unsaved changes

All edits happen in the in-memory working copy. Nothing is written until **Save Changes** is clicked. While there are unsaved changes the header shows an indicator, the browser warns before refresh/navigation, and **Reload from Disk** asks for confirmation before discarding your local changes.

## Environment variables

- `JSON_MANAGER_FILE` — Node-side path to the JSON file to manage. Not exposed to browser code; the UI only shows the filename.
- `POC_DOMAIN` — deployment metadata, not exposed to browser code.
- Browser-visible variables must use the `VITE_` prefix. Do not commit secrets.

## Standard deployment foundation

Proof-of-concept deployments follow this convention:

- Registrar: Porkbun
- DNS provider: Cloudflare
- POC hosting: Cloudflare Pages
- Source control: GitHub
- Umbrella domain: `rareobjectlabs.app`
- App POC domain: `json-manager.rareobjectlabs.app`
- Default POC domain: `json-manager.rareobjectlabs.app`

This template documents the convention only. Cloudflare configuration, DNS records, and deployment setup are performed separately.

## Project structure

```text
src/                  React application, components, and tests
server/               Local Node file API (validation, backups, atomic writes)
docs/                 Product, architecture, and decision records
index.html             Vite HTML entry point
vite.config.ts         Vite and Vitest configuration
eslint.config.js       ESLint flat configuration
```

## Testing

`npm test` runs Vitest. Coverage includes parsing and rejecting the `_default` structure, preserving ZIP strings, next-ID calculation, add/edit/delete operations, serialization, and backup/atomic-write behavior.

## Customizing the template

This project was created from the `app-starter` template with these values:

- Display name: `JSON Manager`
- Repository name: `json-manager`
- Folder name: `json-manager`
- Description: `A local web application for viewing, editing, adding, and deleting records in a structured JSON file.`
- POC domain: `json-manager.rareobjectlabs.app`

The neutral starter shell has been extended with the JSON Manager interface and a small local file API.