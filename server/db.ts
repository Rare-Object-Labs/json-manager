export interface DatabaseFile {
  _default: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

export type StructureErrorCode =
  | 'invalid_json'
  | 'invalid_root'
  | 'invalid_default'
  | 'invalid_record_structure'

export type ParseResult =
  | { ok: true; struct: DatabaseFile }
  | { ok: false; code: StructureErrorCode }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonStructure(text: string): ParseResult {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, code: 'invalid_json' }
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, code: 'invalid_root' }
  }

  const root = parsed as Record<string, unknown>
  if (!isPlainObject(root['_default'])) {
    return { ok: false, code: 'invalid_default' }
  }

  for (const value of Object.values(root['_default'])) {
    if (!isPlainObject(value)) {
      return { ok: false, code: 'invalid_record_structure' }
    }
  }

  return { ok: true, struct: parsed as unknown as DatabaseFile }
}

export function serializeJson(struct: DatabaseFile): string {
  return `${JSON.stringify(struct, null, 2)}\n`
}