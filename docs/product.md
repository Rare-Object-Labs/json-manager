# Product

## Summary

`JSON Manager` is a small web application for viewing, editing, adding, and deleting records in a structured JSON file. It is frontend-only: the file the user works with stays on their computer and never leaves the browser.

> A local web application for viewing, editing, adding, and deleting records in a structured JSON file.

## Product definition

### Problem being solved

People working with JSON files that act like small databases need a safe way to inspect and update records without hand-editing JSON or risking malformed files. Mistyped JSON, renumbered IDs, or a corrupted file can be hard to recover from.

### Intended users

Individuals who maintain a local structured JSON file (for example, a record store database) and want a browser UI for it.

### Primary user outcomes

- View records in a readable table, search across all fields, and sort by any table column.
- Add, edit, and delete records with auto-assigned IDs.
- Switch between JSON files from inside the app.
- Save back to the same file only when explicitly requested — in Chromium browsers directly to the original file, in other browsers by downloading the updated JSON.
- Never have file contents uploaded or transmitted anywhere.
- Get clear messages instead of crashes when the file is missing, invalid, unreadable, or fails to validate.

### Initial scope

- Choose the current file from the UI. The app never loads a file automatically — every page load begins with no file selected and the user must click Choose File.
- Files are handled entirely in the browser: File System Access API when available, a standard file input (and a download-based save) otherwise.
- The `_default` structure described in the README, with string object keys and ZIP codes kept as strings.
- Client-side sorting and filtering of the visible table.
- Unsaved-change tracking and confirmation prompts to prevent accidental loss.
- Plain CSS admin-style interface; no UI framework.

### Explicit non-goals

- No database, authentication, Supabase, cloud storage, backend, or `/api/*` endpoints.
- No uploading of file contents to any server.
- No user accounts, sharing, or multi-user editing.
- No automatic file loading of any kind (no environment variable, `.env` value, previous selection, recent-file history, or remembered path).
- No file-path display in the browser beyond the filename.
- No backups, sibling files, or automatic file writing — the original file changes only on an explicit save.
- No cross-platform abstraction beyond the minimal feature-detected picker/download fallback.

### Success measurement

- A user can point the app at an existing file, make changes, and save — directly to the original file where the browser supports it, or as a download of the updated file elsewhere — without ever losing data or uploading it.
- All existing values and record IDs are preserved across edits.

## Starter scope

The starter's frontend-only default is preserved: the app uses browser file APIs, not a backend, to read and write the local file (see `docs/decisions.md`, ADR-004 and ADR-005). The application has no external runtime services.