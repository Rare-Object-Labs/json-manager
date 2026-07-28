import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the starter shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: '{{DISPLAY_NAME}}' }),
    ).toBeInTheDocument()
    expect(screen.getByText('{{DESCRIPTION}}')).toBeInTheDocument()
    expect(screen.getByText('{{POC_DOMAIN}}')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
