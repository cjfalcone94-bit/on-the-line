import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseURL = process.env.VIEWPORT_BASE_URL ?? 'http://127.0.0.1:4173';
const output = resolve('evidence/viewport-fix');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

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

async function capture(page, name, suffix, scale, primaryLabel) {
  await page.waitForTimeout(100);
  await applyFontScale(page, scale);
  if (primaryLabel) {
    const action = page.getByText(primaryLabel, { exact: true }).last();
    await action.waitFor({ state: 'visible' });
    const button = action.locator('xpath=ancestor::*[@role="button"][1]');
    const box = await button.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > 667 || box.x < 0 || box.x + box.width > 375) {
      throw new Error(`${name}-${suffix}: CTA clipped: ${JSON.stringify(box)}`);
    }
    const contrast = await button.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      text: getComputedStyle(element.querySelector('[dir="auto"]') ?? element).color,
    }));
    if (contrast.background === 'rgba(0, 0, 0, 0)' || contrast.background === contrast.text) {
      throw new Error(`${name}-${suffix}: CTA has no visible contrast: ${JSON.stringify(contrast)}`);
    }
  }
  await page.screenshot({ path: `${output}/${name}-${suffix}.png` });
  process.stdout.write(`CTA_VISIBLE YES ${name}-${suffix}.png${primaryLabel ? ` [${primaryLabel}]` : ' [no primary CTA]'}\n`);
}

for (const [suffix, scale] of [['sm', 1], ['lg', 1.3]]) {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto(baseURL);
  await page.getByTestId('trust-screen').waitFor({ state: 'visible' });
  await capture(page, 'trust-onboarding', suffix, scale, 'Browse goal templates');
  await page.getByTestId('browse-templates-button').click();
  await page.getByTestId('catalog-screen').waitFor({ state: 'visible' });
  await capture(page, 'catalog', suffix, scale);
  await page.getByTestId('template-daily-walk').click();
  await capture(page, 'template-detail', suffix, scale, 'Set stake');
  await page.getByText('Set stake', { exact: true }).click();
  await capture(page, 'commit-stake', suffix, scale, 'Choose charity');
  await page.getByTestId('stake-4000').click();
  await page.getByText('Choose charity', { exact: true }).click();
  await capture(page, 'commit-charity', suffix, scale, 'Review the mechanic');
  await page.getByTestId('charity-direct-relief').click();
  await page.getByText('Review the mechanic', { exact: true }).click();
  await capture(page, 'commit-disclosure', suffix, scale, 'Continue to card authorization');
  await page.getByText('Continue to card authorization', { exact: true }).click();
  await capture(page, 'commit-card', suffix, scale, 'Run mock authorization');
  await page.getByText('Run mock authorization', { exact: true }).click();
  await page.getByTestId('authorization-loading').waitFor({ state: 'visible' });
  await capture(page, 'commit-authorize', suffix, scale, 'Authorizing…');
  await page.getByText('Mock stake authorized.', { exact: true }).waitFor({ state: 'visible' });
  await capture(page, 'commit-confirmed', suffix, scale, 'Submit today’s proof');
  await page.getByText('Submit today’s proof', { exact: true }).click();
  await capture(page, 'proof', suffix, scale, 'Take photo');
  await page.getByText('Use mock sandbox proof', { exact: true }).click();
  await capture(page, 'proof-ready', suffix, scale, 'Submit proof');
  await page.getByTestId('submit-proof').click();
  await page.getByText('Submitted — under review.', { exact: true }).waitFor({ state: 'visible' });
  await page.getByText('View status', { exact: true }).click();
  await page.getByTestId('verify-status-screen').waitFor({ state: 'visible' });
  await capture(page, 'verify', suffix, scale, 'Settle mock outcome');
  await page.getByText('Settle mock outcome', { exact: true }).click();
  await page.getByTestId('glass-receipt').waitFor({ state: 'visible' });
  await page.waitForTimeout(2200);
  await capture(page, 'settle-receipt', suffix, scale, 'Share receipt');
  await page.goto(baseURL);
  await page.getByTestId('trust-screen').waitFor({ state: 'visible' });
  await page.getByText('View Commitment Record', { exact: true }).click();
  await page.getByTestId('commitment-record-screen').waitFor({ state: 'visible' });
  await capture(page, 'record', suffix, scale);
  await page.getByText('Settings', { exact: true }).click();
  await page.getByTestId('settings-screen').waitFor({ state: 'visible' });
  await capture(page, 'settings', suffix, scale);
  await page.close();
}

await browser.close();
