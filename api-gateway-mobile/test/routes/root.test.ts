import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

test('health endpoint returns ok', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/health'
  })
  assert.deepStrictEqual(JSON.parse(res.payload), { status: 'ok' })
})
