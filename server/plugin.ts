import type { Plugin } from 'vite'
import { createApiMiddleware, type ApiMiddleware } from './api'
import { resolveJsonManagerFile } from './env'

export function jsonManagerApi(): Plugin {
  let mode = 'development'
  let envDir = process.cwd()
  let api: ApiMiddleware = createApiMiddleware({ jsonFile: () => undefined })

  return {
    name: 'json-manager-api',
    configResolved(config) {
      mode = config.mode
      envDir = typeof config.envDir === 'string' ? config.envDir : config.root
      api = createApiMiddleware({
        jsonFile: () => resolveJsonManagerFile(mode, envDir, process.env),
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