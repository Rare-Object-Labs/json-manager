import { displayAddress, presentOrDash, recordName } from '../lib/db'
import type { SortDirection, SortKey } from '../lib/db'

export interface TableRow {
  id: string
  record: Record<string, unknown>
}

const SORTABLE_COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'uname', label: 'Label' },
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
]

const SORT_INDICATORS: Record<SortDirection, string> = {
  asc: '▲',
  desc: '▼',
}

interface RecordTableProps {
  rows: TableRow[]
  sortKey: SortKey
  sortDir: SortDirection
  onSort: (key: SortKey) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function RecordTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
}: RecordTableProps) {
  return (
    <div className="table-wrap">
      <table className="record-table">
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                aria-sort={
                  sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                }
              >
                <button type="button" className="sort-button" onClick={() => onSort(key)}>
                  {label}
                  {sortKey === key && (
                    <span className="sort-indicator" aria-hidden="true">
                      {SORT_INDICATORS[sortDir]}
                    </span>
                  )}
                </button>
              </th>
            ))}
            <th scope="col" className="actions-col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, record }) => (
            <tr key={id}>
              <td className="id-cell">{id}</td>
              <td>{presentOrDash(record['uname'])}</td>
              <td>{presentOrDash(recordName(record))}</td>
              <td>{presentOrDash(displayAddress(record))}</td>
              <td>{presentOrDash(record['city'])}</td>
              <td>{presentOrDash(record['state'])}</td>
              <td>{presentOrDash(record['zip'])}</td>
              <td className="actions-cell">
                <button type="button" className="link-button" onClick={() => onEdit(id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="link-button danger"
                  onClick={() => onDelete(id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}