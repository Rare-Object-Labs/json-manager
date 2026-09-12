import { loadEnv } from 'vite'

export function resolveJsonManagerFile(
  mode: string,
  envDir: string,
  processEnv: NodeJS.ProcessEnv = {},
): string | undefined {
  const loaded = loadEnv(mode, envDir, '')
  const fromProcess = processEnv['JSON_MANAGER_FILE']
  return typeof fromProcess === 'string' ? fromProcess : loaded['JSON_MANAGER_FILE']
}