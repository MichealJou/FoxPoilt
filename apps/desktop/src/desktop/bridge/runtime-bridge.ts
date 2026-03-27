import { createRuntimeCommand } from '@contracts/runtime-contract.js'

export function buildRuntimeBridgeRequest(
  name: string,
  payload?: Record<string, unknown>,
) {
  return createRuntimeCommand(name, payload)
}
