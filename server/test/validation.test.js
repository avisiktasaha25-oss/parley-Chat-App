import test from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validateColor, validateAvatar, validateRoomName, validateMessage, COLORS } from '../src/validation.js';

test('name: trims, collapses whitespace, enforces 2–24', () => {
  assert.deepEqual(validateName('  Ada   L  '), { ok: true, value: 'Ada L' });
  assert.equal(validateName('a').ok, false);
  assert.equal(validateName('x'.repeat(25)).ok, false);
  assert.equal(validateName('x'.repeat(24)).ok, true);
  assert.equal(validateName('  \t ').ok, false);
  assert.equal(validateName(42).ok, false);
});

test('colour must be from the palette', () => {
  assert.equal(validateColor(COLORS[0]).ok, true);
  assert.equal(validateColor('#000000').ok, false);
  assert.equal(validateColor('red').ok, false);
});

test('room name: charset and length', () => {
  assert.equal(validateRoomName('Dev Talk').ok, true);
  assert.equal(validateRoomName('<b>x</b>').ok, false);
  assert.equal(validateRoomName('a').ok, false);
  assert.equal(validateRoomName('y'.repeat(30)).ok, false);
});

test('message: trims, rejects empty/oversized, keeps markup as plain text', () => {
  assert.equal(validateMessage('   ').ok, false);
  assert.equal(validateMessage('x'.repeat(1001)).ok, false);
  assert.equal(validateMessage('x'.repeat(1000)).ok, true);
  assert.equal(validateMessage('  hi \u0007there ').value, 'hi there');
  assert.equal(validateMessage('<img src=x onerror=1>').value, '<img src=x onerror=1>');
  assert.equal(validateMessage('a\n\n\n\nb').value, 'a\n\nb');
  assert.equal(validateMessage({}).ok, false);
});

test('avatar seed: short, whitelisted chars; empty allowed', () => {
  assert.equal(validateAvatar('mango').ok, true);
  assert.equal(validateAvatar(undefined).value, '');
  assert.equal(validateAvatar('a b').ok, false);
  assert.equal(validateAvatar('<img>').ok, false);
  assert.equal(validateAvatar('x'.repeat(25)).ok, false);
  assert.equal(validateAvatar(7).ok, false);
});
