import { createRuntimeCommand } from '@foxpilot/contracts/runtime-contract.js'

export function buildRuntimeBridgeRequest(
  name: string,
  payload?: Record<string, unknown>,
) {
  return createRuntimeCommand(name, payload)
}
