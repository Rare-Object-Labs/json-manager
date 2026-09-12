import { useEffect, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { RECORD_FIELDS, type RecordField } from '../lib/db'

const FORM_FIELDS: Array<{ key: RecordField; label: string }> = [
  { key: 'uname', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'address2', label: 'Address 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
  { key: 'phone', label: 'Phone' },
  { key: 'zone', label: 'Zone' },
  { key: 'region', label: 'Region' },
]

interface RecordFormProps {
  mode: 'add' | 'edit'
  idText: string
  initial: Record<string, unknown>
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => void
}

export function RecordForm({ mode, idText, initial, onCancel, onSubmit }: RecordFormProps) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {}
    for (const field of RECORD_FIELDS) {
      const value = initial[field]
      next[field] = typeof value === 'string' ? value : ''
    }
    return next
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  function update(field: RecordField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const values: Record<string, unknown> = {}
    for (const field of RECORD_FIELDS) {
      values[field] = draft[field] ?? ''
    }
    onSubmit(values)
  }

  function dismissIfBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={dismissIfBackdrop}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-form-title"
      >
        <h2 id="record-form-title">{mode === 'add' ? 'Add Entry' : 'Edit Entry'}</h2>
        <p className="modal-id">
          {mode === 'edit' ? 'Record ID' : 'New record ID'} <strong>{idText}</strong>
        </p>
        <form onSubmit={submit} className="record-form">
          <div className="form-grid">
            {FORM_FIELDS.map(({ key, label }, index) => (
              <div className="field" key={key}>
                <label htmlFor={`field-${key}`}>{label}</label>
                <input
                  id={`field-${key}`}
                  type="text"
                  value={draft[key] ?? ''}
                  autoFocus={index === 0}
                  onChange={(event) => update(key, event.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}