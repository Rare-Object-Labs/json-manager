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