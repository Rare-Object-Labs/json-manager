import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApiMiddleware } from './api'
import type { ApiDeps, ApiMiddleware } from './api'
import type { FilePickResult } from './select-file'

const createdDirs: string[] = []

async function makeFile(name: string, content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'json-manager-api-'))
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

function validContent(records: unknown): string {
  return JSON.stringify({ _default: records })
}

function makeDeps(): { deps: ApiDeps; active: () => string | undefined } {
  let active: string | undefined
  const deps: ApiDeps = {
    jsonFile: () => active,
    setJsonFile: (filePath) => {
      active = filePath
    },
    pickJsonFile: async (): Promise<FilePickResult> => ({ ok: false, reason: 'cancelled' }),
  }
  return { deps, active: () => active }
}

function makeReq(method: string, url: string, body?: string): IncomingMessage {
  const req = {
    method,
    url,
    destroy: () => undefined,
    on: (event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'data' && body) {
        handler(Buffer.from(body, 'utf8'))
      }
      if (event === 'end') {
        handler()
      }
      return req
    },
  } as unknown as IncomingMessage
  return req
}

interface ResponseCapture {
  status: number
  body: string
}

interface ApiPayload {
  configured?: boolean
  cancelled?: boolean
  fileName?: string
  struct?: { _default: Record<string, { name?: string }> }
  error?: { code?: string }
}

async function request(
  middleware: ApiMiddleware,
  method: string,
  url: string,
  body?: string,
): Promise<ResponseCapture> {
  const req = makeReq(method, url, body)
  const capture: ResponseCapture = { status: 0, body: '' }
  let finished!: () => void
  const done = new Promise<void>((resolve) => {
    finished = resolve
  })
  const res = {
    writeHead: (status: number) => {
      capture.status = status
      return res
    },
    end: (chunk?: unknown) => {
      capture.body = typeof chunk === 'string' ? chunk : ''
      finished()
      return res
    },
  } as unknown as ServerResponse
  middleware(req, res, finished)
  await done
  return capture
}

function jsonBody(capture: ResponseCapture): ApiPayload {
  return JSON.parse(capture.body) as ApiPayload
}

describe('GET /api/records without an active file', () => {
  it('reports configured:false so the app can offer file selection', async () => {
    const { deps } = makeDeps()
    const result = await request(createApiMiddleware(deps), 'GET', '/api/records')
    expect(result.status).toBe(200)
    expect(jsonBody(result)).toEqual({ configured: false })
  })
})

describe('POST /api/select-file', () => {
  it('cancelling selection leaves the active file unchanged', async () => {
    const { deps, active } = makeDeps()
    const initial = await makeFile('a.json', validContent({ '1': { name: 'A' } }))
    deps.setJsonFile(initial)
    deps.pickJsonFile = async () => ({ ok: false, reason: 'cancelled' })

    const middleware = createApiMiddleware(deps)
    const result = await request(middleware, 'POST', '/api/select-file')

    expect(result.status).toBe(200)
    expect(jsonBody(result)).toEqual({ cancelled: true })
    expect(active()).toBe(initial)
  })

  it('a valid selected file becomes the active file', async () => {
    const { deps, active } = makeDeps()
    const picked = await makeFile('b.json', validContent({ '9': { name: 'Bee' } }))
    deps.pickJsonFile = async () => ({ ok: true, filePath: picked })

    const middleware = createApiMiddleware(deps)
    const result = await request(middleware, 'POST', '/api/select-file')

    expect(result.status).toBe(200)
    expect(active()).toBe(picked)
    const payload = jsonBody(result)
    expect(payload.configured).toBe(true)
    expect(payload.fileName).toBe('b.json')
    expect(payload.struct?._default['9'].name).toBe('Bee')

    const records = await request(middleware, 'GET', '/api/records')
    expect(jsonBody(records).fileName).toBe('b.json')
  })

  it('invalid JSON does not replace the active file', async () => {
    const { deps, active } = makeDeps()
    const initial = await makeFile('a.json', validContent({ '1': { name: 'A' } }))
    deps.setJsonFile(initial)
    const bad = await makeFile('bad.json', '{ this is not json')
    deps.pickJsonFile = async () => ({ ok: true, filePath: bad })

    const middleware = createApiMiddleware(deps)
    const result = await request(middleware, 'POST', '/api/select-file')

    expect(result.status).toBe(400)
    expect(jsonBody(result).error?.code).toBe('invalid_json')
    expect(active()).toBe(initial)
  })

  it('structurally invalid JSON does not replace the active file', async () => {
    const { deps, active } = makeDeps()
    const initial = await makeFile('a.json', validContent({ '1': { name: 'A' } }))
    deps.setJsonFile(initial)
    const bad = await makeFile('bad-structure.json', JSON.stringify({ records: [] }))
    deps.pickJsonFile = async () => ({ ok: true, filePath: bad })

    const middleware = createApiMiddleware(deps)
    const result = await request(middleware, 'POST', '/api/select-file')

    expect(result.status).toBe(400)
    expect(jsonBody(result).error?.code).toBe('invalid_default')
    expect(active()).toBe(initial)
  })

  it('does not modify the selected file merely by selecting it', async () => {
    const { deps } = makeDeps()
    const original = validContent({ '5': { name: 'Zed', zip: '08901' } })
    const picked = await makeFile('unchanged.json', original)
    deps.pickJsonFile = async () => ({ ok: true, filePath: picked })

    await request(createApiMiddleware(deps), 'POST', '/api/select-file')

    expect(await readFile(picked, 'utf8')).toBe(original)
  })

  it('save after switching files writes to the newly selected file only', async () => {
    const { deps } = makeDeps()
    const first = await makeFile('first.json', validContent({ '1': { name: 'First' } }))
    deps.setJsonFile(first)
    const second = await makeFile('second.json', validContent({ '2': { name: 'Two' } }))
    deps.pickJsonFile = async () => ({ ok: true, filePath: second })

    const middleware = createApiMiddleware(deps)
    await request(middleware, 'POST', '/api/select-file')
    const save = await request(
      middleware,
      'POST',
      '/api/save',
      JSON.stringify({
        content: validContent({ '2': { name: 'Two' }, '3': { name: 'Three' } }),
      }),
    )
    expect(save.status).toBe(200)

    expect(JSON.parse(await readFile(second, 'utf8'))).toEqual({
      _default: { '2': { name: 'Two' }, '3': { name: 'Three' } },
    })
    expect(JSON.parse(await readFile(first, 'utf8'))).toEqual({
      _default: { '1': { name: 'First' } },
    })
  })

  it('backup is created beside the newly selected file', async () => {
    const { deps } = makeDeps()
    const original = validContent({ '2': { name: 'Two' } })
    const second = await makeFile('second.json', original)
    deps.pickJsonFile = async () => ({ ok: true, filePath: second })

    const middleware = createApiMiddleware(deps)
    await request(middleware, 'POST', '/api/select-file')
    await request(
      middleware,
      'POST',
      '/api/save',
      JSON.stringify({ content: validContent({ '2': { name: 'Two updated' } }) }),
    )

    const backupDir = join(dirname(second), 'db-backups')
    const files = await readdir(backupDir)
    expect(files).toHaveLength(1)
    expect(JSON.parse(await readFile(join(backupDir, files[0]), 'utf8'))).toEqual({
      _default: { '2': { name: 'Two' } },
    })
  })
})