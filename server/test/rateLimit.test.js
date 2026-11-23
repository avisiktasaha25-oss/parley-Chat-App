import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/rateLimit.js';

test('blocks after max hits and recovers after the window', () => {
  let t = 0;
  const rl = createRateLimiter({ max: 3, windowMs: 1000, now: () => t });
  assert.ok(rl.allow()); assert.ok(rl.allow()); assert.ok(rl.allow());
  assert.equal(rl.allow(), false);
  t = 999; assert.equal(rl.allow(), false);
  t = 1001; assert.ok(rl.allow());
});
