import { test, expect } from '@playwright/test';

async function joinAs(browser, name) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel('Display name').fill(name);
  await page.getByRole('button', { name: /enter the room/i }).click();
  await expect(page.getByTestId('room-title')).toHaveText('General');
  return { context, page };
}

test('two users chat live in General', async ({ browser }) => {
  const a = await joinAs(browser, 'Alice');
  const b = await joinAs(browser, 'Bob');

  // online list shows both, on both sides
  for (const { page } of [a, b]) {
    const list = page.getByTestId('online-list');
    await expect(list.getByText('Alice')).toBeVisible();
    await expect(list.getByText('Bob')).toBeVisible();
  }

  // typing indicator appears for the other user
  await a.page.getByRole('textbox', { name: 'Message' }).pressSequentially('hel', { delay: 40 });
  await expect(b.page.getByTestId('typing')).toContainText('Alice is typing');

  // message arrives live, and is shown as plain text
  await a.page.getByRole('textbox', { name: 'Message' }).fill('hello <b>Bob</b>!');
  await a.page.getByRole('button', { name: 'Send message' }).click();
  const log = b.page.getByTestId('message-log');
  await expect(log.getByText('hello <b>Bob</b>!')).toBeVisible();
  await expect(log.locator('b')).toHaveCount(0);
  await expect(b.page.getByTestId('typing')).not.toContainText('Alice is typing');

  // reply the other way
  await b.page.getByRole('textbox', { name: 'Message' }).fill('hi Alice 👋');
  await b.page.getByRole('textbox', { name: 'Message' }).press('Enter');
  await expect(a.page.getByTestId('message-log').getByText('hi Alice 👋')).toBeVisible();

  // history persists for a late joiner
  const c = await joinAs(browser, 'Cara');
  await expect(c.page.getByTestId('message-log').getByText('hi Alice 👋')).toBeVisible();

  // duplicate name is rejected
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto('/');
  await p.getByLabel('Display name').fill('alice');
  await p.getByRole('button', { name: /enter the room/i }).click();
  await expect(p.getByRole('alert').first()).toContainText('taken');

  await Promise.all([a, b, c].map((u) => u.context.close()));
  await ctx.close();
});

test('avatar picker: each user sees the other\'s picture in the online list', async ({ browser }) => {
  const pick = async (name, seed) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('Display name').fill(name);
    const opt = page.getByTestId(`avatar-option-${seed}`);
    await opt.click();
    await expect(opt).toHaveAttribute('aria-checked', 'true');
    const src = await opt.locator('img').getAttribute('src');
    await page.getByRole('button', { name: /enter the room/i }).click();
    await expect(page.getByTestId('room-title')).toHaveText('General');
    return { context, page, src };
  };
  const a = await pick('Tess', 'sunny');
  const b = await pick('Ravi', 'mochi');
  expect(a.src).not.toEqual(b.src);
  for (const { page } of [a, b]) {
    const list = page.getByTestId('online-list');
    await expect(list.locator('li', { hasText: 'Tess' }).locator('img')).toHaveAttribute('src', a.src);
    await expect(list.locator('li', { hasText: 'Ravi' }).locator('img')).toHaveAttribute('src', b.src);
  }
  await a.page.getByRole('textbox', { name: 'Message' }).fill('hi');
  await a.page.getByRole('textbox', { name: 'Message' }).press('Enter');
  await expect(b.page.getByTestId('message-log').locator('img').last()).toHaveAttribute('src', a.src);
  await Promise.all([a, b].map((u) => u.context.close()));
});

test('avatar picker offers 24 stickers; a legacy notionists seed still renders', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('parley-avatar', 'mango'));
  await page.goto('/');
  await expect(page.locator('[data-testid^="avatar-option-"]')).toHaveCount(24);
  const img = page.getByLabel('Display name').locator('xpath=..').locator('img');
  await expect(img).toHaveAttribute('src', /^data:image\/svg\+xml/);
  expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
  await context.close();
});

test('rooms: create and switch', async ({ browser }) => {
  const a = await joinAs(browser, 'Dana');
  await a.page.getByLabel('Create room').click();
  await a.page.getByLabel('New room name').fill('Music');
  await a.page.getByLabel('New room name').press('Enter');
  await expect(a.page.getByTestId('room-title')).toHaveText('Music');
  await expect(a.page.getByText("It's quiet in #Music")).toBeVisible();
  await a.context.close();
});

test('character counter: warns near 1000 and blocks sending over it', async ({ browser }) => {
  const a = await joinAs(browser, 'Erin');
  const box = a.page.getByRole('textbox', { name: 'Message' });
  const send = a.page.getByRole('button', { name: 'Send message' });
  await box.fill('x'.repeat(980));
  await expect(a.page.getByTestId('char-count')).toHaveText('980/1000');
  await expect(send).toBeEnabled();
  await box.fill('y'.repeat(1012));
  await expect(a.page.getByTestId('char-count')).toHaveText('1012/1000');
  await expect(a.page.getByRole('alert').filter({ hasText: 'remove 12 characters' })).toBeVisible();
  await expect(send).toBeDisabled();
  await box.press('Enter');
  await expect(a.page.getByTestId('message-log').getByText('yyyy')).toHaveCount(0);
  await box.fill('z'.repeat(1000));
  await expect(send).toBeEnabled();
  await a.context.close();
});
