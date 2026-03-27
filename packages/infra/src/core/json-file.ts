/**
 * @file src/core/json-file.ts
 * @author michaeljou
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * 读取并解析 JSON 文件，返回指定泛型结构。
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

/**
 * 写入格式化后的 JSON，并确保父目录已存在。
 */
export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
