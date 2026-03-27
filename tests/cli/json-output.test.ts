import { describe, expect, it } from 'vitest'

import { toJsonErrorOutput, toJsonOutput, toJsonSuccessOutput } from '@/cli/json-output.js'

describe('cli json output', () => {
  it('serializes runtime result for cli json mode', () => {
    expect(toJsonOutput({ ok: true })).toContain('"ok": true')
  })

  it('builds success envelopes for structured cli consumers', () => {
    const output = toJsonSuccessOutput('init.preview', { profile: 'default' }, '2026-03-27T10:00:00.000Z')

    expect(output).toContain('"command": "init.preview"')
    expect(output).toContain('"profile": "default"')
    expect(output).toContain('"timestamp": "2026-03-27T10:00:00.000Z"')
  })

  it('builds error envelopes for structured cli consumers', () => {
    const output = toJsonErrorOutput(
      'init.preview',
      {
        code: 'PROJECT_NOT_FOUND',
        message: '未找到目标项目。',
      },
      '2026-03-27T10:00:00.000Z',
    )

    expect(output).toContain('"ok": false')
    expect(output).toContain('"code": "PROJECT_NOT_FOUND"')
  })
})
