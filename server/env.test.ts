import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveJsonManagerFile } from './env'

const createdDirs: string[] = []

async function makeEnvDir(envLocal: string | null): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'json-manager-env-'))
  createdDirs.push(dir)
  if (envLocal !== null) {
    await writeFile(join(dir, '.env.local'), envLocal, 'utf8')
  }
  return dir
}

afterEach(async () => {
  for (const dir of createdDirs.splice(0, createdDirs.length)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('resolveJsonManagerFile', () => {
  it('reads JSON_MANAGER_FILE from .env.local', async () => {
    const dir = await makeEnvDir('JSON_MANAGER_FILE=C:/from-file.json')
    expect(resolveJsonManagerFile('development', dir, {})).toBe('C:/from-file.json')
  })

  it('picks up JSON_MANAGER_FILE even when it has no VITE_ prefix', async () => {
    const dir = await makeEnvDir('VITE_APP_DISPLAY_NAME=ignored\nJSON_MANAGER_FILE=C:/from-file.json')
    expect(resolveJsonManagerFile('development', dir, {})).toBe('C:/from-file.json')
  })

  it('lets an existing shell value take precedence over .env.local', async () => {
    const dir = await makeEnvDir('JSON_MANAGER_FILE=C:/from-file.json')
    expect(
      resolveJsonManagerFile('development', dir, { JSON_MANAGER_FILE: 'C:/from-shell.json' }),
    ).toBe('C:/from-shell.json')
  })

  it('uses the shell value when no .env.local exists', async () => {
    const dir = await makeEnvDir(null)
    expect(resolveJsonManagerFile('development', dir, { JSON_MANAGER_FILE: 'C:/shell.json' })).toBe(
      'C:/shell.json',
    )
  })

  it('returns undefined when not configured anywhere', async () => {
    const dir = await makeEnvDir(null)
    expect(resolveJsonManagerFile('development', dir, {})).toBeUndefined()
  })

  it('also loads .env.local for the production mode used by preview', async () => {
    const dir = await makeEnvDir('JSON_MANAGER_FILE=C:/from-file.json')
    expect(resolveJsonManagerFile('production', dir, {})).toBe('C:/from-file.json')
  })
})