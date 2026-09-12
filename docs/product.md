# Product

## Summary

`JSON Manager` is a small local web application for viewing, editing, adding, and deleting records in a structured JSON file.

> A local web application for viewing, editing, adding, and deleting records in a structured JSON file.

## Product definition

### Problem being solved

People working with JSON files that act like small databases need a safe way to inspect and update records without hand-editing JSON or risking malformed files. Mistyped JSON, renumbered IDs, or a corrupted file can be hard to recover from.

### Intended users

Individuals who maintain a local structured JSON file (for example, a record store database) and want a browser UI for it.

### Primary user outcomes

- View records in a readable table, search across all fields, and sort by any table column.
- Add, edit, and delete records with auto-assigned IDs.
- Switch between JSON files from inside the app using a native Windows file dialog.
- Save back to the same file only when explicitly requested.
- Have the original file preserved by a timestamped backup before every save.
- Get clear messages instead of crashes when the file is missing, invalid, unreadable, or fails to validate.

### Initial scope

- Choose the current file from the UI (native Windows chooser). The app never loads a file automatically — every start begins with no file selected and the user must click Choose File.
- The `_default` structure described in the README, with string object keys and ZIP codes kept as strings.
- Client-side sorting and filtering of the visible table.
- Unsaved-change tracking and confirmation prompts to prevent accidental loss.
- Plain CSS admin-style interface; no UI framework.

### Explicit non-goals

- No database, authentication, Supabase, cloud storage, or hosting.
- No user accounts, sharing, or multi-user editing.
- No automatic file loading of any kind (no environment variable, `.env` value, previous selection, recent-file history, or remembered path).
- No file-path display in the browser beyond the filename.
- No recent-file history or settings persistence; the active file resets when the app restarts and must be chosen manually.
- No cross-platform file-chooser abstraction (the native chooser is Windows-only for now).

### Success measurement

- A user can point the app at an existing file, make changes, save, and recover from backups without ever losing data.
- All existing values and record IDs are preserved across edits.

## Starter scope

The reusable starter's frontend-only default was relaxed with an explicit architectural decision to add a small local Node file API (see `docs/decisions.md`, ADR-004). The application still has no external runtime services.