import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchRecords, saveChanges } from './api'
import type { ApiError } from './api'
import {
  applyAdd,
  applyDelete,
  applyEdit,
  cloneJson,
  matchesSearch,
  nextNumericId,
  recordName,
  serializeJson,
  sortedEntries,
} from './lib/db'
import type { DatabaseFile } from './lib/db'
import { RecordForm } from './components/RecordForm'
import { RecordTable } from './components/RecordTable'
import type { TableRow } from './components/RecordTable'
import './App.css'

type LoadStatus = 'loading' | 'config-missing' | 'ready' | 'error'

type EditorState = null | { mode: 'add' } | { mode: 'edit'; id: string }

const ERROR_TITLES: Record<string, string> = {
  not_configured: 'Not configured',
  file_not_found: 'File not found',
  invalid_json: 'Invalid JSON',
  invalid_root: 'Invalid file structure',
  invalid_default: 'Missing or invalid "_default"',
  invalid_record_structure: 'Invalid record structure',
  permission_denied: 'Permission denied',
  backup_failed: 'Backup failed',
  save_failed: 'Save failed',
  network: 'Connection problem',
  unexpected: 'Unexpected error',
}

function errorTitle(code: string): string {
  return ERROR_TITLES[code] ?? 'Error'
}

export default function App() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [fileName, setFileName] = useState('')
  const [working, setWorking] = useState<DatabaseFile | null>(null)
  const [snapshotText, setSnapshotText] = useState('')
  const [loadError, setLoadError] = useState<ApiError | null>(null)
  const [saveError, setSaveError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<EditorState>(null)

  const workingText = useMemo(() => (working ? serializeJson(working) : ''), [working])
  const dirty = working !== null && workingText !== snapshotText
  const recordCount = working ? Object.keys(working._default).length : 0

  const loadResult = useCallback((result: Awaited<ReturnType<typeof fetchRecords>>) => {
    if (!result.ok) {
      setStatus('error')
      setLoadError(result.error)
      return
    }
    const data = result.data
    if (!data.configured) {
      setStatus('config-missing')
      setLoadError(null)
      return
    }
    if (!data.struct || typeof data.fileName !== 'string') {
      setStatus('error')
      setLoadError({ code: 'unexpected', message: 'The local API returned an unexpected response.' })
      return
    }
    const fresh = cloneJson(data.struct)
    setFileName(data.fileName)
    setWorking(fresh)
    setSnapshotText(serializeJson(fresh))
    setLoadError(null)
    setSaveError(null)
    setStatus('ready')
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchRecords().then((result) => {
      if (!cancelled) {
        loadResult(result)
      }
    })
    return () => {
      cancelled = true
    }
  }, [loadResult])

  useEffect(() => {
    if (!dirty) {
      return
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  async function reloadFromDisk() {
    if (dirty && !window.confirm('Discard unsaved changes and reload the file from disk?')) {
      return
    }
    setBusy(true)
    const result = await fetchRecords()
    loadResult(result)
    setBusy(false)
  }

  async function handleSave() {
    if (!working || !dirty) {
      return
    }
    setBusy(true)
    setSaveError(null)
    const result = await saveChanges(workingText)
    if (result.ok) {
      setSnapshotText(workingText)
    } else {
      setSaveError(result.error)
    }
    setBusy(false)
  }

  function handleSubmitDraft(values: Record<string, unknown>) {
    if (!working) {
      return
    }
    if (editor?.mode === 'edit') {
      setWorking({
        ...working,
        _default: applyEdit(working._default, editor.id, values),
      })
    } else {
      const next = applyAdd(working._default, values)
      setWorking({ ...working, _default: next.records })
    }
    setEditor(null)
  }

  function requestDelete(id: string) {
    if (!working) {
      return
    }
    const name = recordName(working._default[id] ?? {})
    const label = name ? `${name} (ID ${id})` : `ID ${id}`
    const confirmed = window.confirm(
      `Delete record ${label}? The change stays unsaved until you click Save Changes.`,
    )
    if (confirmed) {
      setWorking({ ...working, _default: applyDelete(working._default, id) })
    }
  }

  const rows: TableRow[] = useMemo(() => {
    if (!working) {
      return []
    }
    return sortedEntries(working._default)
      .filter(([id, record]) => matchesSearch(id, record, search))
      .map(([id, record]) => ({ id, record }))
  }, [working, search])

  const addRecordId = working ? nextNumericId(working._default) : ''

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>JSON Manager</h1>
          <span className={`unsaved-indicator${dirty ? ' dirty' : ''}`} role="status">
            {dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
        </div>
        <div className="file-meta">
          {fileName && <span className="file-chip">{fileName}</span>}
          <span>
            {recordCount} {recordCount === 1 ? 'record' : 'records'}
          </span>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="button"
            onClick={reloadFromDisk}
            disabled={status !== 'ready' || busy}
          >
            Reload from Disk
          </button>
          <button
            type="button"
            className="button primary"
            onClick={handleSave}
            disabled={!dirty || busy || status !== 'ready'}
          >
            Save Changes
          </button>
        </div>
      </header>

      <main className="app-main">
        {status === 'loading' && (
          <p className="notice" role="status">
            Loading records…
          </p>
        )}

        {status === 'config-missing' && (
          <section className="config-missing">
            <h2>JSON_MANAGER_FILE is not set</h2>
            <p>
              JSON Manager needs a local JSON file to open. Set the{' '}
              <code>JSON_MANAGER_FILE</code> environment variable before starting the app.
            </p>
            <ol>
              <li>
                Create <code>.env.local</code> in this project and add{' '}
                <code>JSON_MANAGER_FILE=C:\path\to\db.json</code>.
              </li>
              <li>Restart the app with <code>npm run dev</code> (or <code>npm run preview</code>).</li>
            </ol>
          </section>
        )}

        {status === 'error' && loadError && (
          <div className="error-banner" role="alert">
            <strong>{errorTitle(loadError.code)}</strong>
            <span>{loadError.message}</span>
          </div>
        )}

        {saveError && (
          <div className="error-banner" role="alert">
            <strong>{errorTitle(saveError.code)}</strong>
            <span>{saveError.message}</span>
          </div>
        )}

        {status === 'ready' && working && (
          <>
            <div className="main-toolbar">
              <div className="search">
                <label htmlFor="search">Search</label>
                <input
                  id="search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ID, name, city…"
                />
              </div>
              <button type="button" className="button primary" onClick={() => setEditor({ mode: 'add' })}>
                Add Entry
              </button>
            </div>
            {rows.length === 0 ? (
              <p className="notice">
                {recordCount === 0 ? 'No records in this file yet.' : 'No records match your search.'}
              </p>
            ) : (
              <RecordTable
                rows={rows}
                onEdit={(id) => setEditor({ mode: 'edit', id })}
                onDelete={requestDelete}
              />
            )}
          </>
        )}
      </main>

      {status === 'ready' && editor && working && (
        <RecordForm
          mode={editor.mode}
          idText={editor.mode === 'edit' ? editor.id : addRecordId}
          initial={
            editor.mode === 'edit' ? (working._default[editor.id] ?? {}) : {}
          }
          onCancel={() => setEditor(null)}
          onSubmit={handleSubmitDraft}
        />
      )}
    </div>
  )
}