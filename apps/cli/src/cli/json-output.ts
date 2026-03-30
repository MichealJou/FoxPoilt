export type CliJsonSuccessEnvelope<T> = {
  ok: true
  command: string
  timestamp: string
  data: T
}

export type CliJsonErrorEnvelope = {
  ok: false
  command: string
  timestamp: string
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export function toJsonOutput(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function toJsonSuccessOutput<T>(
  command: string,
  data: T,
  timestamp = new Date().toISOString(),
): string {
  return toJsonOutput({
    ok: true,
    command,
    timestamp,
    data,
  } satisfies CliJsonSuccessEnvelope<T>)
}

export function toJsonErrorOutput(
  command: string,
  error: CliJsonErrorEnvelope['error'],
  timestamp = new Date().toISOString(),
): string {
  return toJsonOutput({
    ok: false,
    command,
    timestamp,
    error,
  } satisfies CliJsonErrorEnvelope)
}
