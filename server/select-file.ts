import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'

export type FilePickResult =
  | { ok: true; filePath: string }
  | { ok: false; reason: 'cancelled' }
  | { ok: false; reason: 'unavailable'; message: string }

const DIALOG_SCRIPT = [
  'Add-Type -AssemblyName System.Windows.Forms',
  '$dialog = New-Object System.Windows.Forms.OpenFileDialog',
  '$dialog.Title = "Choose a JSON file for JSON Manager"',
  '$dialog.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*"',
  '$dialog.Multiselect = $false',
  '$dialog.CheckFileExists = $true',
  '$dialog.RestoreDirectory = $true',
  'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
  '  [Console]::Out.Write($dialog.FileName)',
  '}',
].join('; ')

function startPowerShell(): ChildProcess | null {
  try {
    return spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      DIALOG_SCRIPT,
    ], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    return null
  }
}

export function pickJsonFile(): Promise<FilePickResult> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({
        ok: false,
        reason: 'unavailable',
        message: 'The native file chooser requires Windows.',
      })
      return
    }

    const child = startPowerShell()
    if (!child) {
      resolve({
        ok: false,
        reason: 'unavailable',
        message: 'Could not start the Windows file chooser.',
      })
      return
    }

    let output = ''
    child.stdout?.on('data', (chunk: Buffer) => {
      output += String(chunk)
    })
    child.stderr?.on('data', () => {
      // PowerShell writes non-errors to stderr; ignore it.
    })
    child.on('error', () => {
      resolve({
        ok: false,
        reason: 'unavailable',
        message: 'Could not start the Windows file chooser.',
      })
    })
    child.on('close', (code) => {
      const filePath = output.trim()
      if (filePath) {
        resolve({ ok: true, filePath })
      } else if (code !== 0) {
        resolve({
          ok: false,
          reason: 'unavailable',
          message: 'The Windows file chooser could not be opened.',
        })
      } else {
        resolve({ ok: false, reason: 'cancelled' })
      }
    })
  })
}