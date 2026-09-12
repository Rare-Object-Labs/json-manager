import { describe, expect, it } from 'vitest'
import {
  applyAdd,
  applyDelete,
  applyEdit,
  cloneJson,
  displayAddress,
  matchesSearch,
  nextNumericId,
  recordName,
  serializeJson,
} from './db'
import type { DatabaseFile } from './db'

function sampleRecords() {
  return {
    '2': { uname: 'Sparks 89431', name: 'Tobi Returns', zip: '08901' },
    '5': { uname: 'abc', name: 'Second Person', zip: '94105' },
  }
}

describe('nextNumericId', () => {
  it('returns max numeric id + 1 when gaps exist', () => {
    expect(nextNumericId(sampleRecords())).toBe('6')
  })

  it('ignores non-numeric keys', () => {
    expect(nextNumericId({ '7': {}, legacy: {}, '10': {} })).toBe('11')
  })

  it('returns 1 for an empty record set', () => {
    expect(nextNumericId({})).toBe('1')
  })
})

describe('applyAdd', () => {
  it('adds a record with the next id without renumbering existing ones', () => {
    const records = sampleRecords()
    const next = applyAdd(records, { name: 'New Person', zip: '08901' })
    expect(next.id).toBe('6')
    expect(Object.keys(next.records)).toEqual(['2', '5', '6'])
    expect(next.records['2'].name).toBe('Tobi Returns')
  })

  it('keeps the id as a string key', () => {
    const next = applyAdd({ '3': {} }, { name: 'A' })
    expect(next.records['4']).toMatchObject({ name: 'A' })
    expect(typeof next.id).toBe('string')
  })
})

describe('applyEdit', () => {
  it('updates fields while preserving the id and unknown properties', () => {
    const records = {
      '2': { name: 'Old Name', zip: '08901', favoriteColor: 'blue' },
    }
    const next = applyEdit(records, '2', { name: 'New Name', zip: '94105' })
    expect(Object.keys(next)).toEqual(['2'])
    expect(next['2']).toEqual({
      name: 'New Name',
      zip: '94105',
      favoriteColor: 'blue',
    })
  })

  it('accepts unknown ids by creating a record', () => {
    const next = applyEdit({}, '9', { name: 'A' })
    expect(next['9']).toEqual({ name: 'A' })
  })
})

describe('applyDelete', () => {
  it('removes only the selected id', () => {
    const records = sampleRecords()
    const next = applyDelete(records, '2')
    expect(Object.keys(next)).toEqual(['5'])
    expect(next['5'].name).toBe('Second Person')
  })

  it('is a no-op for an unknown id', () => {
    const records = sampleRecords()
    expect(applyDelete(records, '999')).toEqual(records)
  })
})

describe('serializeJson', () => {
  it('preserves the _default structure and ZIP strings', () => {
    const struct: DatabaseFile = { _default: sampleRecords() }
    const text = serializeJson(struct)
    expect(text).toContain('"_default": {')
    expect(text).toContain('"zip": "08901"')
    expect(text).not.toContain('"zip": 8901')
  })
})

describe('cloneJson', () => {
  it('returns an independent deep copy', () => {
    const original = { _default: { '2': { name: 'A' } } } as DatabaseFile
    const copy = cloneJson(original)
    copy._default['2'].name = 'B'
    expect(original._default['2'].name).toBe('A')
    expect(copy).not.toBe(original)
  })
})

describe('search and display helpers', () => {
  it('matches against id and fields case-insensitively', () => {
    const record = { name: 'Tobi Returns', city: 'Sparks' }
    expect(matchesSearch('2', record, 'TOBI')).toBe(true)
    expect(matchesSearch('2', record, 'sparks')).toBe(true)
    expect(matchesSearch('2', record, '2')).toBe(true)
    expect(matchesSearch('2', record, 'missing')).toBe(false)
  })

  it('returns true for an empty query', () => {
    expect(matchesSearch('2', { name: 'A' }, '')).toBe(true)
    expect(matchesSearch('2', { name: 'A' }, '   ')).toBe(true)
  })

  it('combines address and address2 cleanly', () => {
    expect(displayAddress({ address: '50 Greg St', address2: 'Suite 2' })).toBe(
      '50 Greg St, Suite 2',
    )
    expect(displayAddress({ address: '50 Greg St', address2: '' })).toBe('50 Greg St')
  })

  it('reads the record name from the name field', () => {
    expect(recordName({ name: 'Tobi' })).toBe('Tobi')
    expect(recordName({})).toBe('')
  })
})