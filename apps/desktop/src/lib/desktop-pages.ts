export const desktopPages = [
  'dashboard',
  'workspace',
  'tasks',
  'runs',
  'events',
  'control-plane',
  'health',
] as const

export type DesktopPageId = (typeof desktopPages)[number]

export function isDesktopPageId(value: string): value is DesktopPageId {
  return desktopPages.includes(value as DesktopPageId)
}
