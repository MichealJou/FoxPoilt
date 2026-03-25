import path from 'node:path'

export function resolveFoxpilotHome(homeDir: string): string {
  return path.join(homeDir, '.foxpilot')
}

export function resolveGlobalConfigPath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.config.json')
}

export function resolveGlobalDatabasePath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.db')
}

export function resolveProjectConfigPath(projectRoot: string): string {
  return path.join(projectRoot, '.foxpilot', 'project.json')
}
