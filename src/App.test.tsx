import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { FileSystemFileHandleLike } from './lib/files'

const VALID_TEXT = JSON.stringify({
  _default: {
    '2': {
      uname: 'Sparks 89431',
      name: 'Tobi Returns',
      address: '50 Greg St',
      address2: '',
      city: 'Sparks',
      state: 'NV',
      zip: '08901',
      phone: '',
      zone: '',
      region: '',
    },
  },
})

function makeHandle(name: string, content: string): {
  handle: FileSystemFileHandleLike
  writes: string[]
} {
  const writes: string[] = []
  const handle: FileSystemFileHandleLike = {
    name,
    getFile: async () => new File([content], name, { type: 'application/json' }),
    createWritable: async () => ({
      write: async (data: string) => {
        writes.push(data)
      },
      close: async () => {},
    }),
  }
  return { handle, writes }
}

function chooseFromPicker(handle: FileSystemFileHandleLike): void {
  vi.stubGlobal('showOpenFilePicker', vi.fn(async () => [handle]))
}

async function loadViaFallback(container: HTMLElement, file: File): Promise<void> {
  fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file] })
  fireEvent.change(input)
}

async function editName(nextName: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: nextName } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Record' }))
  await screen.findByText(nextName)
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('starts with no file selected and never auto-loads a file', async () => {
    const pickerSpy = vi.fn(async () => [] as FileSystemFileHandleLike[])
    vi.stubGlobal('showOpenFilePicker', pickerSpy)

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'No file selected' }),
    ).toBeInTheDocument()
    const chooseButtons = screen.getAllByRole('button', { name: 'Choose File' })
    chooseButtons.forEach((button) => {
      expect(button).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(pickerSpy).not.toHaveBeenCalled()
  })

  it('loads records after a successful picker selection', async () => {
    const { handle } = makeHandle('db.json', VALID_TEXT)
    chooseFromPicker(handle)

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])

    expect(await screen.findByText('db.json')).toBeInTheDocument()
    expect(screen.getByText('1 record')).toBeInTheDocument()
    expect(screen.getByText('Tobi Returns')).toBeInTheDocument()
    expect(screen.getByText('Sparks 89431')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: 'No file selected' })).not.toBeInTheDocument()
  })

  it('keeps the empty state when the picker is cancelled', async () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn(async () => []))

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])

    expect(
      await screen.findByRole('heading', { name: 'No file selected' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('db.json')).not.toBeInTheDocument()
  })

  it('shows a clear error for an invalid JSON file', async () => {
    const { handle } = makeHandle('bad.json', '{ not valid json')
    chooseFromPicker(handle)

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid JSON')
    expect(screen.getByRole('heading', { name: 'No file selected' })).toBeInTheDocument()
  })

  it('shows a clear error when the file has no valid _default', async () => {
    const { handle } = makeHandle('records.json', JSON.stringify({ records: [] }))
    chooseFromPicker(handle)

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Missing or invalid "_default"')
  })

  it('saves edits back to the file via the writable handle', async () => {
    const { handle, writes } = makeHandle('db.json', VALID_TEXT)
    chooseFromPicker(handle)

    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose File' })[0])

    await screen.findByText('Tobi Returns')
    await editName('Renamed Person')

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0]).toContain('"name": "Renamed Person"')
    expect(writes[0]).toContain('  "2": {')
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
  })

  it('uses the file input fallback and explains that saves download the file', async () => {
    const { container } = render(<App />)
    const file = new File([VALID_TEXT], 'store.json', { type: 'application/json' })
    await loadViaFallback(container, file)

    expect(await screen.findByText('store.json')).toBeInTheDocument()
    expect(screen.getByText('Sparks 89431')).toBeInTheDocument()
    expect(screen.getByText(/cannot overwrite the original file/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeDisabled()
  })

  it('downloads the updated JSON in fallback browsers', async () => {
    const objectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const created: HTMLAnchorElement[] = []
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        created.push(el as HTMLAnchorElement)
      }
      return el
    })

    const { container } = render(<App />)
    const file = new File([VALID_TEXT], 'store.json', { type: 'application/json' })
    await loadViaFallback(container, file)

    await screen.findByText('store.json')
    await editName('Downloaded Person')

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(created.length).toBe(1))
    expect(created[0].download).toBe('store.json')
    expect(objectUrlSpy).toHaveBeenCalled()
    const blob = objectUrlSpy.mock.calls[0][0] as Blob
    expect(await blob.text()).toContain('"name": "Downloaded Person"')
    expect(await blob.text()).toContain('  "2": {')
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
  })
})