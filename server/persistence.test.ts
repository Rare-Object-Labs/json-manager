import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { atomicWrite, createBackup } from './persistence'

const createdDirs: string[] = []

async function makeTempFile(name: string, content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'json-manager-test-'))
  createdDirs.push(dir)
  const filePath = join(dir, name)
  await writeFile(filePath, content, 'utf8')
  return filePath
}

afterEach(async () => {
  for (const dir of createdDirs.splice(0, createdDirs.length)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('createBackup', () => {
  it('stores the original content in db-backups beside the file', async () => {
    const originalContent = JSON.stringify({ _default: { '2': { name: 'Tobi' } } })
    const filePath = await makeTempFile('db.json', originalContent)

    const result = await createBackup(filePath)

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    const backupDir = join(dirname(filePath), 'db-backups')
    const files = await readdir(backupDir)
    expect(files).toHaveLength(1)
    expect(await readFile(join(backupDir, files[0]), 'utf8')).toBe(originalContent)
    expect(await readFile(filePath, 'utf8')).toBe(originalContent)
  })

  it('names the backup with a timestamp', async () => {
    const filePath = await makeTempFile('db.json', '{"_default":{}}')
    const result = await createBackup(filePath, new Date(2026, 8, 12, 13, 45, 6, 123))

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.backupPath).toMatch(/db-20260912-134506-123\.json$/)
  })

  it('returns a backup error when the source file is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'json-manager-test-'))
    createdDirs.push(dir)
    const result = await createBackup(join(dir, 'missing.json'))
    expect(result).toMatchObject({ ok: false, error: { code: 'file_not_found' } })
  })
})

describe('atomicWrite', () => {
  it('replaces the file content and leaves no temp file behind', async () => {
    const filePath = await makeTempFile('db.json', '{"_default":{}}')
    const dir = dirname(filePath)

    const result = await atomicWrite(filePath, '{"_default":{"5":{"zip":"08901"}}}')

    expect(result.ok).toBe(true)
    expect(await readFile(filePath, 'utf8')).toBe('{"_default":{"5":{"zip":"08901"}}}')
    const leftover = (await readdir(dir)).filter((name) => name.includes('tmp'))
    expect(leftover).toEqual([])
  })
})