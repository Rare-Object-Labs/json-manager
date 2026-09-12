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

- View records in a readable table and search across all fields.
- Add, edit, and delete records with auto-assigned IDs.
- Save back to the same file only when explicitly requested.
- Have the original file preserved by a timestamped backup before every save.
- Get clear messages instead of crashes when the file is missing, invalid, or unreadable.

### Initial scope

- A single local JSON file configured through `JSON_MANAGER_FILE`.
- The `_default` structure described in the README, with string object keys and ZIP codes kept as strings.
- Unsaved-change tracking and confirmation prompts to prevent accidental loss.
- Plain CSS admin-style interface; no UI framework.

### Explicit non-goals

- No database, authentication, Supabase, cloud storage, deployment, or hosting.
- No user accounts, sharing, or multi-user editing.
- No file-path display in the browser beyond the filename.

### Success measurement

- A user can point the app at an existing file, make changes, save, and recover from backups without ever losing data.
- All existing values and record IDs are preserved across edits.

## Starter scope

The reusable starter's frontend-only default was relaxed with an explicit architectural decision to add a small local Node file API (see `docs/decisions.md`, ADR-004). The application still has no external runtime services.