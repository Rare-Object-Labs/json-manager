export interface FileSystemWritableFileStreamLike {
  write(data: string): Promise<void>
  close(): Promise<void>
}

export interface FileSystemFileHandleLike {
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStreamLike>
}

type ShowOpenFilePickerFn = (options: {
  types: Array<{ description: string; accept: Record<string, string[]> }>
  multiple?: boolean
}) => Promise<FileSystemFileHandleLike[]>

export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export async function pickJsonFile(): Promise<FileSystemFileHandleLike | null> {
  const picker = (window as Window & { showOpenFilePicker?: ShowOpenFilePickerFn })
    .showOpenFilePicker
  if (typeof picker !== 'function') {
    return null
  }
  const handles = await picker({
    types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }],
    multiple: false,
  })
  return handles[0] ?? null
}

export async function readFileText(file: File): Promise<string> {
  return file.text()
}

export async function readHandleText(handle: FileSystemFileHandleLike): Promise<string> {
  return readFileText(await handle.getFile())
}

export async function writeHandleText(
  handle: FileSystemFileHandleLike,
  text: string,
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(text)
  } finally {
    await writable.close()
  }
}

export function downloadJsonText(fileName: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}