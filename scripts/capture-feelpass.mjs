import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.FEELPASS_BASE_URL ?? 'http://127.0.0.1:4173';
const output = resolve('evidence/feelpass1');
const only = process.env.FEELPASS_ONLY?.split(',');
const scales = process.env.FEELPASS_SCALE === '1.3' ? [1.3] : process.env.FEELPASS_SCALE === '1' ? [1] : [1, 1.3];
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function pageFor(scale) {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  if (scale > 1) {
    await page.addInitScript((fontScale) => {
      window.__feelpassFontScale = fontScale;
    }, scale);
  }
  return page;
}

async function applyFontScale(page, scale) {
  if (scale === 1) return;
  await page.evaluate((fontScale) => {
    for (const element of document.querySelectorAll('*')) {
      if (!(element instanceof HTMLElement) || element.children.length > 0) continue;
      const computed = getComputedStyle(element);
      const size = Number.parseFloat(computed.fontSize);
      const lineHeight = Number.parseFloat(computed.lineHeight);
      if (size > 0 && element.textContent?.trim()) {
        element.style.fontSize = `${size * fontScale}px`;
        if (lineHeight > 0) element.style.lineHeight = `${lineHeight * fontScale}px`;
      }
    }
  }, scale);
}

async function capture(page, name, scale, primaryLabel) {
  await page.waitForTimeout(120);
  await applyFontScale(page, scale);
  if (primaryLabel) {
    const primary = page.getByText(primaryLabel, { exact: true }).last();
    await primary.waitFor({ state: 'visible' });
    const box = await primary.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > 667) {
      throw new Error(`${name}: primary action is outside the viewport: ${JSON.stringify(box)}`);
    }
  }
  const suffix = scale === 1 ? 'default' : 'font130';
  await page.screenshot({ path: `${output}/${name}-${suffix}.png` });
  process.stdout.write(`PASS ${name}-${suffix}.png\n`);
}

for (const scale of scales) {
  if (!only || only.some((name) => ['splash', 'trust', 'catalog', 'template-detail', 'commit'].some((prefix) => name.startsWith(prefix)))) {
  const page = await pageFor(scale);
  await page.goto(baseURL);
  await page.getByTestId('brand-splash').waitFor({ state: 'visible' });
  await capture(page, 'splash', scale);
  await page.getByTestId('trust-screen').waitFor({ state: 'visible' });
  await capture(page, 'trust', scale, 'Browse goal templates');

  await page.getByTestId('browse-templates-button').click();
  await page.getByTestId('catalog-screen').waitFor({ state: 'visible' });
  await capture(page, 'catalog', scale);

  await page.getByTestId('template-daily-walk').click();
  await page.getByTestId('template-detail-screen').waitFor({ state: 'visible' });
  await capture(page, 'template-detail', scale, 'Set stake');

  await page.getByText('Set stake', { exact: true }).click();
  await page.getByTestId('commit-screen').waitFor({ state: 'visible' });
  await capture(page, 'commit-01-stake', scale, 'Choose charity');
  await page.getByTestId('stake-4000').click();
  await page.getByText('Choose charity', { exact: true }).click();
  await capture(page, 'commit-02-charity', scale, 'Review the mechanic');
  await page.getByTestId('charity-direct-relief').click();
  await page.getByText('Review the mechanic', { exact: true }).click();
  await capture(page, 'commit-03-plain-terms', scale, 'Continue to card authorization');
  await page.getByText('Continue to card authorization', { exact: true }).click();
  await capture(page, 'commit-04-card', scale, 'Authorize stake and pay base fee');
  await page.close();
  }

  for (const [name, route, primary] of [
    ['proof', '/proof/demo-proof.html?templateId=daily-walk', 'Take photo'],
    ['verify', '/verify/demo-passed.html', null],
    ['settle-success', '/settle/demo-success.html', 'Share receipt'],
    ['settle-forfeit', '/settle/demo-fail.html', 'Share receipt'],
    ['record', '/', null],
    ['settings', '/', null],
  ]) {
    if (only && !only.includes(name)) continue;
    const direct = await pageFor(scale);
    await direct.goto(`${baseURL}${route}`);
    if (name === 'record' || name === 'settings') {
      await direct.getByTestId('trust-screen').waitFor({ state: 'visible' });
      await direct.getByText('View Commitment Record', { exact: true }).click();
      if (name === 'settings') await direct.getByText('Settings', { exact: true }).click();
      await direct.getByTestId(name === 'record' ? 'commitment-record-screen' : 'settings-screen').waitFor({ state: 'visible' });
    }
    await direct.waitForTimeout(name.startsWith('settle') ? 2350 : 850);
    await capture(direct, name, scale, primary);
    await direct.close();
  }
}

await browser.close();
