import type { Plugin } from 'vite'
import { createApiMiddleware, type ApiMiddleware } from './api'
import { createFileState } from './file-state'
import { pickJsonFile } from './select-file'

export function jsonManagerApi(): Plugin {
  let api: ApiMiddleware = createApiMiddleware({
    jsonFile: () => undefined,
    setJsonFile: () => undefined,
    pickJsonFile,
  })

  return {
    name: 'json-manager-api',
    configResolved() {
      const state = createFileState()
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