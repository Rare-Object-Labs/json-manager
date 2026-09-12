import { existsSync } from 'node:fs'
import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createApiMiddleware } from './api.ts'
import type { ApiDeps } from './api.ts'
import { createFileState } from './file-state.ts'
import { pickJsonFile } from './select-file.ts'
import { serveStaticRequest } from './static.ts'

const HOST = process.env['HOST'] ?? '127.0.0.1'
const PORT = Number(process.env['PORT'] ?? '4173')

export function resolveDistDir(): string {
  return resolve(process.cwd(), 'dist')
}

export function isDistReady(distDir: string): boolean {
  return existsSync(resolve(distDir, 'index.html'))
}

export function createProductionServer(distDir: string) {
  const state = createFileState()
  const deps: ApiDeps = {
    jsonFile: state.jsonFile,
    setJsonFile: state.setJsonFile,
    pickJsonFile,
  }
  const api = createApiMiddleware(deps)

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname.startsWith('/api/')) {
      api(req, res, () => {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: { code: 'not_found', message: 'No such API endpoint.' } }))
      })
      return
    }
    void serveStaticRequest(req, res, distDir)
  })
}

export function main(): void {
  const distDir = resolveDistDir()
  if (!isDistReady(distDir)) {
    console.error('[json-manager] Production start aborted: dist/ has not been built.')
    console.error('[json-manager] Run `npm run build` first, then `npm run start`.')
    process.exit(1)
  }

  const server = createProductionServer(distDir)
  server.listen(PORT, HOST, () => {
    console.log(`[json-manager] production server serving ${distDir}`)
    console.log(`[json-manager] listening on http://${HOST}:${PORT}`)
    console.log('[json-manager] no file selected; click Choose File in the UI to activate a file.')
  })
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main()
}