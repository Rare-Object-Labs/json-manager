export interface FileState {
  jsonFile: () => string | undefined
  setJsonFile: (filePath: string) => void
}

export function createFileState(): FileState {
  let filePath: string | undefined
  return {
    jsonFile: () => filePath,
    setJsonFile: (next) => {
      filePath = next
    },
  }
}