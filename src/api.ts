import type { DatabaseFile } from './lib/db'

export interface ApiError {
  code: string
  message: string
}

export interface RecordsResponse {
  configured: boolean
  fileName?: string
  defaultName?: string
  struct?: DatabaseFile
  error?: ApiError
}

export interface SaveResponse {
  ok?: boolean
  error?: ApiError
}

type RequestResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

async function request<T>(path: string, init?: RequestInit): Promise<RequestResult<T>> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    return { ok: false, error: { code: 'network', message: 'Could not reach the local API.' } }
  }

  let body: T & { error?: ApiError }
  try {
    body = (await res.json()) as T & { error?: ApiError }
  } catch {
    return { ok: false, error: { code: 'http', message: `The local API returned an unexpected response (${res.status}).` } }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: body.error ?? { code: 'http', message: `The local API returned an error (${res.status}).` },
    }
  }

  return { ok: true, data: body }
}

export function fetchRecords(): Promise<RequestResult<RecordsResponse>> {
  return request<RecordsResponse>('/api/records')
}

export function saveChanges(content: string): Promise<RequestResult<SaveResponse>> {
  return request<SaveResponse>('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}