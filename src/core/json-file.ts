/**
 * @file src/core/json-file.ts
 * @author michaeljou
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Reads and parses a JSON file into the requested generic shape.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

/**
 * Writes formatted JSON and ensures the parent directory exists first.
 */
export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
