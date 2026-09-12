export const RECORD_FIELDS = [
  'uname',
  'name',
  'address',
  'address2',
  'city',
  'state',
  'zip',
  'phone',
  'zone',
  'region',
] as const

export type RecordField = (typeof RECORD_FIELDS)[number]

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

export function isPlainObject(value: unknown): value is Record<string, unknown> {
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

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function nextNumericId(records: Record<string, unknown>): string {
  let max = 0
  for (const key of Object.keys(records)) {
    if (/^\d+$/.test(key)) {
      const numeric = Number(key)
      if (numeric > max) {
        max = numeric
      }
    }
  }
  return String(max + 1)
}

export function emptyRecord(): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const field of RECORD_FIELDS) {
    record[field] = ''
  }
  return record
}

export function applyAdd(
  records: Record<string, Record<string, unknown>>,
  values: Record<string, unknown>,
): { id: string; records: Record<string, Record<string, unknown>> } {
  const id = nextNumericId(records)
  return { id, records: { ...records, [id]: { ...emptyRecord(), ...values } } }
}

export function applyEdit(
  records: Record<string, Record<string, unknown>>,
  id: string,
  values: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const existing = records[id] ?? {}
  return { ...records, [id]: { ...existing, ...values } }
}

export function applyDelete(
  records: Record<string, Record<string, unknown>>,
  id: string,
): Record<string, Record<string, unknown>> {
  const next = { ...records }
  delete next[id]
  return next
}

export function sortedEntries(
  records: Record<string, Record<string, unknown>>,
): Array<[string, Record<string, unknown>]> {
  return Object.entries(records).sort((a, b) => {
    const aNumeric = /^\d+$/.test(a[0]) ? Number(a[0]) : Number.MAX_SAFE_INTEGER
    const bNumeric = /^\d+$/.test(b[0]) ? Number(b[0]) : Number.MAX_SAFE_INTEGER
    return aNumeric - bNumeric || a[0].localeCompare(b[0])
  })
}

export function matchesSearch(
  id: string,
  record: Record<string, unknown>,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  const haystack = [id, ...Object.values(record)].join(' ').toLowerCase()
  return haystack.includes(normalized)
}

export type SortKey = 'id' | 'uname' | 'name' | 'address' | 'city' | 'state' | 'zip'
export type SortDirection = 'asc' | 'desc'

export interface SortableRow {
  id: string
  record: Record<string, unknown>
}

const NUMERIC_ID = /^\d+$/

function valueForSort(
  key: Exclude<SortKey, 'id'>,
  record: Record<string, unknown>,
): string {
  if (key === 'name') {
    return recordName(record)
  }
  if (key === 'address') {
    return displayAddress(record)
  }
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

export function compareRows(
  a: SortableRow,
  b: SortableRow,
  key: SortKey,
  direction: SortDirection,
): number {
  if (key === 'id') {
    const aNumeric = NUMERIC_ID.test(a.id) ? Number(a.id) : null
    const bNumeric = NUMERIC_ID.test(b.id) ? Number(b.id) : null
    const base =
      aNumeric !== null && bNumeric !== null
        ? aNumeric - bNumeric
        : aNumeric !== null
          ? -1
          : bNumeric !== null
            ? 1
            : a.id.localeCompare(b.id)
    return direction === 'asc' ? base : -base
  }

  const aValue = valueForSort(key, a.record)
  const bValue = valueForSort(key, b.record)
  const aEmpty = aValue === ''
  const bEmpty = bValue === ''
  if (aEmpty && bEmpty) {
    return 0
  }
  if (aEmpty) {
    return 1
  }
  if (bEmpty) {
    return -1
  }

  const aLower = aValue.toLowerCase()
  const bLower = bValue.toLowerCase()
  const base = aLower < bLower ? -1 : aLower > bLower ? 1 : 0
  return direction === 'asc' ? base : -base
}

export function sortRows(
  rows: SortableRow[],
  key: SortKey,
  direction: SortDirection,
): SortableRow[] {
  return [...rows].sort((a, b) => compareRows(a, b, key, direction))
}

export function displayAddress(record: Record<string, unknown>): string {
  return [record['address'], record['address2']]
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .join(', ')
}

export function recordName(record: Record<string, unknown>): string {
  return typeof record['name'] === 'string' ? record['name'] : ''
}

export function presentOrDash(value: unknown): string {
  return typeof value === 'string' && value !== '' ? value : '—'
}