import type { Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { basename } from 'node:path'
import {
  parseJsonStructure,
  serializeJson,
  type StructureErrorCode,
} from './db.ts'
import {
  atomicWrite,
  createBackup,
  readTextFile,
} from './persistence.ts'
import type { FilePickResult } from './select-file.ts'

export interface ApiDeps {
  jsonFile: () => string | undefined
  setJsonFile: (filePath: string) => void
  pickJsonFile: () => Promise<FilePickResult>
}

export interface ApiError {
  code: string
  message: string
}

const MAX_BODY_BYTES = 50 * 1024 * 1024

const STATUS_BY_CODE: Record<string, number> = {
  not_configured: 400,
  invalid_payload: 400,
  invalid_json: 400,
  invalid_root: 400,
  invalid_default: 400,
  invalid_record_structure: 400,
  file_not_found: 404,
  permission_denied: 403,
backup_failed: 500,
  save_failed: 500,
  picker_failed: 500,
  unexpected: 500,
}

const MESSAGE_BY_STRUCTURE_CODE: Record<StructureErrorCode, string> = {
  invalid_json: 'The file is not valid JSON.',
  invalid_root: 'The top level of the file is not an object.',
  invalid_default: 'The file must contain a "_default" root object.',
  invalid_record_structure: 'Every record inside "_default" must be an object.',
}

export type ApiMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) => void

export function createApiMiddleware(deps: ApiDeps): ApiMiddleware {
  return (req, res, next) => {
    void handleRequest(req, res, next, deps)
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
  deps: ApiDeps,
): Promise<void> {
  try {
    let url: URL
    try {
      url = new URL(req.url ?? '/', 'http://localhost')
    } catch {
      return sendError(res, 400, 'invalid_payload', 'Malformed request URL.')
    }

    if (!url.pathname.startsWith('/api/')) {
      return next()
    }

    if (url.pathname === '/api/records' && req.method === 'GET') {
      return void (await handleGetRecords(res, deps))
    }

if (url.pathname === '/api/save' && req.method === 'POST') {
      return void (await handleSave(req, res, deps))
    }

    if (url.pathname === '/api/select-file' && req.method === 'POST') {
      return void (await handleSelectFile(res, deps))
    }

    return sendError(res, 404, 'not_found', 'No such API endpoint.')
  } catch {
    return sendError(res, 500, 'unexpected', 'The local API encountered an unexpected error.')
  }
}

async function handleGetRecords(
  res: ServerResponse,
  deps: ApiDeps,
): Promise<void> {
  const filePath = deps.jsonFile()
  if (!filePath) {
    return sendJson(res, 200, { configured: false })
  }

  const read = await readTextFile(filePath)
  if (!read.ok) {
    return sendApiError(res, read.error.code, read.error.message)
  }

  const parsed = parseJsonStructure(read.content)
  if (!parsed.ok) {
    return sendApiError(res, parsed.code, MESSAGE_BY_STRUCTURE_CODE[parsed.code])
  }

  return sendJson(res, 200, {
    configured: true,
    fileName: basename(filePath),
    defaultName: '_default',
    struct: parsed.struct,
  })
}

async function handleSave(
  req: IncomingMessage,
  res: ServerResponse,
  deps: ApiDeps,
): Promise<void> {
const filePath = deps.jsonFile()
  if (!filePath) {
    return sendError(
      res,
      400,
      'not_configured',
      'No file is selected. Use Choose File in the app to select one.',
    )
  }

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    return sendError(res, 400, 'invalid_payload', 'The request body could not be read.')
  }

  const content = (body as { content?: unknown } | null | undefined)?.content
  if (typeof content !== 'string') {
    return sendError(res, 400, 'invalid_payload', 'A JSON "content" string is required.')
  }

  const parsed = parseJsonStructure(content)
  if (!parsed.ok) {
    return sendApiError(res, parsed.code, MESSAGE_BY_STRUCTURE_CODE[parsed.code])
  }

  const backup = await createBackup(filePath)
  if (!backup.ok) {
    return sendError(res, 500, 'backup_failed', `Backup failed. ${backup.error.message}`)
  }

  const written = await atomicWrite(filePath, serializeJson(parsed.struct))
  if (!written.ok) {
    return sendError(res, 500, 'save_failed', `Save failed. ${written.error.message}`)
  }

  return sendJson(res, 200, { ok: true })
}

async function handleSelectFile(
  res: ServerResponse,
  deps: ApiDeps,
): Promise<void> {
  const picked = await deps.pickJsonFile()
  if (!picked.ok) {
    if (picked.reason === 'cancelled') {
      return sendJson(res, 200, { cancelled: true })
    }
    return sendError(res, 500, 'picker_failed', picked.message)
  }

  const filePath = picked.filePath
  const read = await readTextFile(filePath)
  if (!read.ok) {
    return sendApiError(res, read.error.code, read.error.message)
  }

  const parsed = parseJsonStructure(read.content)
  if (!parsed.ok) {
    return sendApiError(res, parsed.code, MESSAGE_BY_STRUCTURE_CODE[parsed.code])
  }

  deps.setJsonFile(filePath)

  return sendJson(res, 200, {
    configured: true,
    fileName: basename(filePath),
    defaultName: '_default',
    struct: parsed.struct,
  })
}

function sendApiError(
  res: ServerResponse,
  code: string,
  message: string,
): void {
  sendError(res, STATUS_BY_CODE[code] ?? 500, code, message)
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(res, status, { error: { code, message } })
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(body)
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid_body'))
      }
    })
    req.on('error', reject)
  })
}
