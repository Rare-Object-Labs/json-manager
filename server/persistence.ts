import { readFile, writeFile, mkdir, rename, rm, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

export type PersistenceErrorCode = 'file_not_found' | 'permission_denied' | 'unexpected'

export interface PersistenceError {
  code: PersistenceErrorCode
  message: string
}

export type ReadResult =
  | { ok: true; content: string }
  | { ok: false; error: PersistenceError }

export function classifyFsError(err: unknown, context: string): PersistenceError {
  const code = (err as NodeJS.ErrnoException | null)?.code
  if (code === 'ENOENT') {
    return { code: 'file_not_found', message: 'The configured JSON file does not exist.' }
  }
  if (code === 'EACCES' || code === 'EPERM') {
    return {
      code: 'permission_denied',
      message: `Permission denied while ${context}.`,
    }
  }
  return { code: 'unexpected', message: `Unexpected error while ${context}.` }
}

export async function readTextFile(filePath: string): Promise<ReadResult> {
  try {
    const content = await readFile(filePath, 'utf8')
    return { ok: true, content }
  } catch (err) {
    return { ok: false, error: classifyFsError(err, 'reading') }
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

export function timestampSuffix(date: Date): string {
  const pad = (value: number, width: number) => String(value).padStart(width, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}` +
    `-${pad(date.getHours(), 2)}${pad(date.getMinutes(), 2)}${pad(date.getSeconds(), 2)}` +
    `-${pad(date.getMilliseconds(), 3)}`
  )
}

export async function createBackup(
  filePath: string,
  now: Date = new Date(),
): Promise<{ ok: true; backupPath: string } | { ok: false; error: PersistenceError }> {
  const backupDir = join(dirname(filePath), 'db-backups')
  try {
    await mkdir(backupDir, { recursive: true })
  } catch (err) {
    return { ok: false, error: classifyFsError(err, 'creating backups') }
  }

  let originalContent: string
  try {
    originalContent = await readFile(filePath, 'utf8')
  } catch (err) {
    return { ok: false, error: classifyFsError(err, 'reading') }
  }

  const baseName = basename(filePath).replace(/\.json$/i, '') || 'db'
  const stamp = timestampSuffix(now)
  let backupPath = join(backupDir, `${baseName}-${stamp}.json`)
  let attempt = 2
  while (await exists(backupPath)) {
    backupPath = join(backupDir, `${baseName}-${stamp}-${attempt}.json`)
    attempt += 1
  }

  try {
    await writeFile(backupPath, originalContent, 'utf8')
  } catch (err) {
    return { ok: false, error: classifyFsError(err, 'writing backups') }
  }

  return { ok: true, backupPath }
}

export async function atomicWrite(
  filePath: string,
  content: string,
): Promise<{ ok: true } | { ok: false; error: PersistenceError }> {
  const dir = dirname(filePath)
  const tmpPath = join(dir, `.${basename(filePath)}.tmp-${process.pid}-${Date.now()}`)
  try {
    await writeFile(tmpPath, content, 'utf8')
    await rename(tmpPath, filePath)
    return { ok: true }
  } catch (err) {
    try {
      await rm(tmpPath, { force: true })
    } catch {
      // Cleanup is best effort; the original file was not modified.
    }
    return { ok: false, error: classifyFsError(err, 'writing') }
  }
}