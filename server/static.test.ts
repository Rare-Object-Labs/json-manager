import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { serveStaticRequest } from './static'

const createdServers: Server[] = []
const createdDirs: string[] = []

interface TestServer {
  baseUrl: string
  close: () => Promise<void>
}

async function startServer(files: Array<[string, string]>): Promise<TestServer> {
  const distDir = await mkdtemp(join(tmpdir(), 'json-manager-static-'))
  createdDirs.push(distDir)
  for (const [name, content] of files) {
    const target = join(distDir, name)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, 'utf8')
  }
  const server = createServer((req, res) => {
    void serveStaticRequest(req, res, distDir)
  })
  createdServers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
      }),
  }
}

afterEach(async () => {
  for (const dir of createdDirs.splice(0, createdDirs.length)) {
    await rm(dir, { recursive: true, force: true })
  }
  for (const server of createdServers.splice(0, createdServers.length)) {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

describe('serveStaticRequest', () => {
  it('serves index.html for the root path with the HTML content type', async () => {
    const server = await startServer([['index.html', '<!doctype html><title>JSON Manager</title>']])
    const response = await fetch(new URL('/', server.baseUrl))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('JSON Manager')
  })

  it('serves files inside the dist directory', async () => {
    const server = await startServer([
      ['index.html', '<!doctype html>'],
      ['assets/app.js', 'console.log("hi")'],
    ])
    const response = await fetch(new URL('/assets/app.js', server.baseUrl))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/javascript')
    expect(await response.text()).toBe('console.log("hi")')
  })

  it('returns 404 for a missing file', async () => {
    const server = await startServer([['index.html', '<!doctype html>']])
    const response = await fetch(new URL('/missing.txt', server.baseUrl))
    expect(response.status).toBe(404)
  })

  it('keeps encoded path traversal contained inside the dist directory', async () => {
    const server = await startServer([['index.html', '<!doctype html>']])
    const response = await fetch(new URL('/%2e%2e/%2e%2e/package.json', server.baseUrl))
    expect(response.status).toBe(404)
    expect(await response.text()).not.toContain('"name"')
  })
})