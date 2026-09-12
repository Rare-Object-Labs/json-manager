import { displayAddress, presentOrDash, recordName } from '../lib/db'

export interface TableRow {
  id: string
  record: Record<string, unknown>
}

interface RecordTableProps {
  rows: TableRow[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function RecordTable({ rows, onEdit, onDelete }: RecordTableProps) {
  return (
    <div className="table-wrap">
      <table className="record-table">
        <thead>
          <tr>
            <th scope="col" className="id-col">ID</th>
            <th scope="col">Name</th>
            <th scope="col">Address</th>
            <th scope="col">City</th>
            <th scope="col">State</th>
            <th scope="col">ZIP</th>
            <th scope="col" className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, record }) => (
            <tr key={id}>
              <td className="id-cell">{id}</td>
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