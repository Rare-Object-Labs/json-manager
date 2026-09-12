import { createReadStream, promises as fs } from 'node:fs'
import type { Stats } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function contentTypeFor(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function send(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(message)
}

/**
 * Serves a built (or otherwise static) frontend from `distDir`.
 * `GET /` maps to `index.html`. Responses are streamed with a no-cache
 * header so the locally served production build can be refreshed easily.
 */
export async function serveStaticRequest(
  req: IncomingMessage,
  res: ServerResponse,
  distDir: string,
): Promise<void> {
  let url: URL
  try {
    url = new URL(req.url ?? '/', 'http://localhost')
  } catch {
    send(res, 400, 'Bad request')
    return
  }

  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    send(res, 400, 'Bad request')
    return
  }
  if (pathname === '/') {
    pathname = '/index.html'
  }

  const segments = pathname.split('/')
  if (segments.includes('..')) {
    send(res, 403, 'Forbidden')
    return
  }

  const filePath = resolve(distDir, '.' + pathname)
  if (filePath !== distDir && !filePath.startsWith(distDir + sep)) {
    send(res, 403, 'Forbidden')
    return
  }

  let stat: Stats
  try {
    stat = await fs.stat(filePath)
  } catch {
    send(res, 404, 'Not found')
    return
  }
  if (!stat.isFile()) {
    send(res, 404, 'Not found')
    return
  }

  res.writeHead(200, {
    'Content-Type': contentTypeFor(filePath),
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
  })
  const stream = createReadStream(filePath)
  stream.on('error', () => {
    if (!res.headersSent) {
      send(res, 500, 'Internal Server Error')
    } else {
      res.end()
    }
  })
  stream.pipe(res)
}