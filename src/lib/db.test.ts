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
  sortRows,
} from './db'
import type { DatabaseFile, SortableRow } from './db'

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

describe('uname field preservation', () => {
  it('keeps uname unchanged when other fields are edited', () => {
    const records = { '5': { uname: 'Storefront', name: 'Old Name', zip: '08901' } }
    const next = applyEdit(records, '5', { name: 'New Name', zip: '94105' })
    expect(next['5'].uname).toBe('Storefront')
    expect(next['5'].name).toBe('New Name')
  })

  it('keeps uname values through serialization', () => {
    const struct: DatabaseFile = {
      _default: {
        '2': { uname: 'Mobile', name: 'A' },
        '3': { uname: 'Pickup', name: 'B' },
      },
    }
    const text = serializeJson(struct)
    expect(text).toContain('"uname": "Mobile"')
    expect(text).toContain('"uname": "Pickup"')
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

function sortableRows(): SortableRow[] {
  return [
    {
      id: '10',
      record: {
        uname: 'Storefront Beta',
        name: 'Beta',
        address: '10 Beta Rd',
        address2: '',
        city: 'Reno',
        state: 'NV',
        zip: '89501',
      },
    },
    {
      id: '2',
      record: {
        uname: 'Storefront Alpha',
        name: 'Alpha',
        address: '2 Alpha Way',
        address2: 'Bldg 2',
        city: 'Athens',
        state: 'AL',
        zip: '35611',
      },
    },
    { id: '7', record: { uname: '', name: '', city: '', state: '', zip: '', address: '' } },
  ]
}

describe('sortRows', () => {
  it('sorts ID numerically ascending', () => {
    const rows = sortRows(sortableRows(), 'id', 'asc')
    expect(rows.map((r) => r.id)).toEqual(['2', '7', '10'])
  })

  it('sorts ID numerically descending', () => {
    const rows = sortRows(sortableRows(), 'id', 'desc')
    expect(rows.map((r) => r.id)).toEqual(['10', '7', '2'])
  })

  it('sorts Name case-insensitively ascending', () => {
    const rows = sortRows(sortableRows(), 'name', 'asc')
    expect(rows[0].record.name).toBe('Alpha')
    expect(rows[1].record.name).toBe('Beta')
  })

  it('sorts Name case-insensitively descending', () => {
    const rows = sortRows(sortableRows(), 'name', 'desc')
    expect(rows[0].record.name).toBe('Beta')
    expect(rows[1].record.name).toBe('Alpha')
  })

  it('sorts Label (uname) case-insensitively ascending', () => {
    const rows = sortRows(sortableRows(), 'uname', 'asc')
    expect(rows.map((r) => r.record.uname)).toEqual(['Storefront Alpha', 'Storefront Beta', ''])
  })

  it('sorts Label (uname) case-insensitively descending', () => {
    const rows = sortRows(sortableRows(), 'uname', 'desc')
    expect(rows.map((r) => r.record.uname)).toEqual(['Storefront Beta', 'Storefront Alpha', ''])
  })

  it('sorts City and State ascending', () => {
    const byCity = sortRows(sortableRows(), 'city', 'asc')
    expect(byCity.map((r) => r.record.city)).toEqual(['Athens', 'Reno', ''])
    const byState = sortRows(sortableRows(), 'state', 'asc')
    expect(byState.map((r) => r.record.state)).toEqual(['AL', 'NV', ''])
  })

  it('sorts ZIP as text ascending', () => {
    const rows = sortRows(sortableRows(), 'zip', 'asc')
    expect(rows.map((r) => r.record.zip)).toEqual(['35611', '89501', ''])
  })

  it('keeps empty values after populated values in both directions', () => {
    const ascending = sortRows(sortableRows(), 'state', 'asc')
    expect(ascending[ascending.length - 1].id).toBe('7')
    const descending = sortRows(sortableRows(), 'state', 'desc')
    expect(descending[descending.length - 1].id).toBe('7')
  })

  it('uses the combined address display value for sorting', () => {
    const rows = sortRows(sortableRows(), 'address', 'asc')
    expect(rows.map((r) => displayAddress(r.record))).toEqual([
      '10 Beta Rd',
      '2 Alpha Way, Bldg 2',
      '',
    ])
  })

  it('does not mutate the input rows or their records', () => {
    const rows = sortableRows()
    const original = JSON.stringify(rows)
    const result = sortRows(rows, 'name', 'asc')
    expect(result).not.toBe(rows)
    expect(rows.map((r) => r.id)).toEqual(['10', '2', '7'])
    expect(JSON.stringify(rows)).toBe(original)
    expect(result[0].record).toBe(rows[1].record)
  })
})