import { describe, expect, it } from 'vitest'
import { parseJsonStructure, serializeJson } from './db'

describe('parseJsonStructure', () => {
  it('parses the expected _default structure', () => {
    const result = parseJsonStructure(
      JSON.stringify({
        _default: {
          '2': { name: 'Tobi Returns', zip: '89431' },
          '5': { name: 'Another Person', zip: '08901' },
        },
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(Object.keys(result.struct._default)).toEqual(['2', '5'])
    expect(result.struct._default['2'].name).toBe('Tobi Returns')
  })

  it('rejects invalid JSON text', () => {
    const result = parseJsonStructure('{ _default: [')
    expect(result).toEqual({ ok: false, code: 'invalid_json' })
  })

  it('rejects a non-object top level', () => {
    expect(parseJsonStructure('[]')).toMatchObject({ code: 'invalid_root' })
    expect(parseJsonStructure('null')).toMatchObject({ code: 'invalid_root' })
    expect(parseJsonStructure('42')).toMatchObject({ code: 'invalid_root' })
    expect(parseJsonStructure('"hello"')).toMatchObject({ code: 'invalid_root' })
  })

  it('rejects a missing _default root object', () => {
    expect(parseJsonStructure(JSON.stringify({ other: {} }))).toMatchObject({
      ok: false,
      code: 'invalid_default',
    })
  })

  it('rejects a non-object _default', () => {
    expect(parseJsonStructure(JSON.stringify({ _default: 42 }))).toMatchObject({
      ok: false,
      code: 'invalid_default',
    })
    expect(parseJsonStructure(JSON.stringify({ _default: ['a'] }))).toMatchObject({
      ok: false,
      code: 'invalid_default',
    })
  })

  it('rejects a non-object record inside _default', () => {
    expect(
      parseJsonStructure(JSON.stringify({ _default: { '2': 'not an object' } })),
    ).toMatchObject({
      ok: false,
      code: 'invalid_record_structure',
    })
  })

  it('accepts a file with a leading BOM', () => {
    const result = parseJsonStructure(
      `${String.fromCharCode(0xfeff)}${JSON.stringify({ _default: { '2': { name: 'A' } } })}`,
    )
    expect(result).toMatchObject({ ok: true })
  })

  it('accepts an empty _default', () => {
    expect(parseJsonStructure(JSON.stringify({ _default: {} }))).toMatchObject({
      ok: true,
    })
  })

  it('preserves unknown root and record properties', () => {
    const result = parseJsonStructure(
      JSON.stringify({
        meta: { legacy: true },
        _default: {
          '2': { name: 'Tobi', zip: '89431', favoriteColor: 'blue' },
        },
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const struct = result.struct as Record<string, unknown>
    expect(struct['meta']).toEqual({ legacy: true })
    expect(result.struct._default['2']['favoriteColor']).toBe('blue')
  })
})

describe('serializeJson', () => {
  it('preserves the _default structure and keeps ZIP codes as strings', () => {
    const result = parseJsonStructure(
      JSON.stringify({
        _default: {
          '2': { name: 'Tobi Returns', zip: '08901' },
        },
      }),
    )
    if (!result.ok) {
      throw new Error('expected fixture to parse')
    }
    const text = serializeJson(result.struct)
    expect(text).toContain('"_default": {')
    expect(text).toContain('"name": "Tobi Returns"')
    expect(text).toContain('"zip": "08901"')
    expect(text).not.toContain('"zip": 8901')
  })

  it('indents with two spaces and ends with a newline', () => {
    const text = serializeJson({ _default: { '2': { name: 'A' } } })
    expect(text).toContain('  "2": {')
    expect(text.endsWith('}\n')).toBe(true)
  })
})