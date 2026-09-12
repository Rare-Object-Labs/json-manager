import type { Plugin } from 'vite'
import { createApiMiddleware, type ApiMiddleware } from './api'
import { resolveJsonManagerFile } from './env'
import { pickJsonFile } from './select-file'

interface FileState {
  jsonFile: () => string | undefined
  setJsonFile: (filePath: string) => void
}

function createFileState(initialPath: string | undefined): FileState {
  let filePath: string | undefined = initialPath
  return {
    jsonFile: () => filePath,
    setJsonFile: (next) => {
      filePath = next
    },
  }
}

export function jsonManagerApi(): Plugin {
  let mode = 'development'
  let envDir = process.cwd()
  let api: ApiMiddleware = createApiMiddleware({
    jsonFile: () => undefined,
    setJsonFile: () => undefined,
    pickJsonFile,
  })

  return {
    name: 'json-manager-api',
    configResolved(config) {
      mode = config.mode
      envDir = typeof config.envDir === 'string' ? config.envDir : config.root
      const state = createFileState(resolveJsonManagerFile(mode, envDir, process.env))
      api = createApiMiddleware({
        jsonFile: state.jsonFile,
        setJsonFile: state.setJsonFile,
        pickJsonFile,
      })
    },
    configureServer(server) {
      server.middlewares.use(api)
    },
    configurePreviewServer(server) {
      server.middlewares.use(api)
    },
  }
}