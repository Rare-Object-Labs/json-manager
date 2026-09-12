import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
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
          struct: {
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
          },
        }),
      ),
    )

    render(<App />)

    expect(await screen.findByText('db.json')).toBeInTheDocument()
    expect(screen.getByText('1 record')).toBeInTheDocument()
    expect(screen.getByText('Tobi Returns')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reload from Disk' })).toBeEnabled()
  })

  it('explains how to configure the app when JSON_MANAGER_FILE is missing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ configured: false })))

    render(<App />)

    expect(
      await screen.findByText('JSON_MANAGER_FILE is not set'),
    ).toBeInTheDocument()
    expect(screen.getByText('Reload from Disk').closest('button')).toBeDisabled()
  })
})