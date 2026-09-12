import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createProductionServer, isDistReady } from './index'

const createdDirs: string[] = []

afterEach(async () => {
  for (const dir of createdDirs.splice(0, createdDirs.length)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('production server entry', () => {
  it('reports dist as not ready when index.html is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'json-manager-index-'))
    createdDirs.push(dir)
    expect(isDistReady(dir)).toBe(false)
  })

  it('reports dist as ready when index.html exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'json-manager-index-'))
    createdDirs.push(dir)
    await writeFile(join(dir, 'index.html'), '<!doctype html>', 'utf8')
    expect(isDistReady(dir)).toBe(true)
  })

  it('creates an HTTP server for a built dist directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'json-manager-index-'))
    createdDirs.push(dir)
    const server = createProductionServer(dir)
    expect(server).toBeDefined()
    server.close()
  })
})