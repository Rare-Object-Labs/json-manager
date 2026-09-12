import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const RECORDS_STRUCT = {
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
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders records once the local API loads them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          configured: true,
          fileName: 'db.json',
          defaultName: '_default',
          struct: RECORDS_STRUCT,
        }),
      ),
    )

    render(<App />)

    expect(await screen.findByText('db.json')).toBeInTheDocument()
    expect(screen.getByText('1 record')).toBeInTheDocument()
    expect(screen.getByText('Tobi Returns')).toBeInTheDocument()
    expect(screen.getByText('Sparks 89431')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeEnabled()
  })

  it('offers file selection whenever the app starts with no active file', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ configured: false })))

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'No file selected' })).toBeInTheDocument()
    const chooseButtons = screen.getAllByRole('button', { name: 'Choose File' })
    expect(chooseButtons.length).toBeGreaterThan(0)
    chooseButtons.forEach((button) => {
      expect(button).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeDisabled()
  })

  it('loads the chosen file after a successful selection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === '/api/records') {
          return jsonResponse({ configured: false })
        }
        if (url === '/api/select-file' && init?.method === 'POST') {
          return jsonResponse({
            configured: true,
            fileName: 'picked.json',
            defaultName: '_default',
            struct: { _default: { '3': { name: 'Picked Person', zip: '90210' } } },
          })
        }
        return jsonResponse({ error: { code: 'not_found', message: 'No such endpoint' } }, 404)
      }),
    )

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'No file selected' })).toBeInTheDocument()
    const chooseButtons = screen.getAllByRole('button', { name: 'Choose File' })
    fireEvent.click(chooseButtons[0])

    expect(await screen.findByText('picked.json')).toBeInTheDocument()
    expect(screen.getByText('Picked Person')).toBeInTheDocument()
    expect(screen.getByText('90210')).toBeInTheDocument()
  })

  it('keeps the empty state when file selection is cancelled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === '/api/records') {
          return jsonResponse({ configured: false })
        }
        if (url === '/api/select-file' && init?.method === 'POST') {
          return jsonResponse({ cancelled: true })
        }
        return jsonResponse({ error: { code: 'not_found', message: 'No such endpoint' } }, 404)
      }),
    )

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'No file selected' })).toBeInTheDocument()
    const chooseButtons = screen.getAllByRole('button', { name: 'Choose File' })
    fireEvent.click(chooseButtons[0])

    expect(screen.getByRole('heading', { name: 'No file selected' })).toBeInTheDocument()
    expect(screen.queryByText('picked.json')).not.toBeInTheDocument()
  })
})