export type RuntimeCommandName = string

export type RuntimeCommand<TPayload = Record<string, unknown> | undefined> = {
  name: RuntimeCommandName
  payload?: TPayload
}

export function createRuntimeCommand<TPayload = Record<string, unknown> | undefined>(
  name: RuntimeCommandName,
  payload?: TPayload,
): RuntimeCommand<TPayload> {
  return {
    name,
    payload,
  }
}
