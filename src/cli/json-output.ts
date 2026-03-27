export function toJsonOutput(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
