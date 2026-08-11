import { expect, test, type Page } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4175';
const evidence = '/workspace/.apps/on-the-line/evidence/commit-flow';

async function screenshot(page: Page, step: number, name: string) {
  await page.screenshot({
    path: `${evidence}/step-${String(step).padStart(2, '0')}-${name}.png`,
    fullPage: false,
  });
}

test.use({ viewport: { width: 375, height: 667 } });

test('clicks the complete founder commit journey into the record', async ({ page }) => {
  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('trust-screen')).toBeVisible();
  await expect(page.getByText('Nothing hidden.')).toBeVisible();
  await screenshot(page, 1, 'launch');

  await page.getByRole('button', { name: 'Browse goal templates' }).click();
  await expect(page.getByTestId('catalog-screen')).toBeVisible();
  await screenshot(page, 2, 'browse');

  await page.getByTestId('template-daily-walk').click();
  await expect(page.getByTestId('template-detail-screen')).toBeVisible();
  await screenshot(page, 3, 'goal-card');

  await page.getByRole('button', { name: /Commit to Daily outdoor walk/ }).click();
  await expect(page.getByText('Put a clear amount on it.')).toBeVisible();
  const chooseCharity = page.getByRole('button', { name: 'Choose charity' });
  await expect(chooseCharity).toBeDisabled();
  await screenshot(page, 4, 'set-stake');

  const stake = page.getByTestId('stake-4000');
  await stake.click();
  await expect(stake).toHaveAttribute('aria-checked', 'true');
  await expect(chooseCharity).toBeEnabled();
  await screenshot(page, 5, 'stake-selected');

  await chooseCharity.click();
  await expect(page.getByText('Choose where failure goes.')).toBeVisible();
  await screenshot(page, 6, 'choose-charity');

  const charity = page.getByTestId('charity-direct-relief');
  const review = page.getByRole('button', { name: 'Review the terms' });
  await expect(review).toBeDisabled();
  await charity.click();
  await expect(charity).toHaveAttribute('aria-checked', 'true');
  await expect(review).toBeEnabled();
  await screenshot(page, 7, 'charity-selected');

  await review.click();
  await expect(page.getByText('No surprises.')).toBeVisible();
  await screenshot(page, 8, 'mechanic-review');

  await page.getByRole('button', { name: 'Continue to card authorization' }).click();
  await expect(page.getByText('Authorize a mock stake.')).toBeVisible();
  await screenshot(page, 9, 'card-authorization');

  await page.getByRole('button', { name: 'Run mock authorization' }).click();
  await expect(page.getByText('Mock stake authorized.')).toBeVisible();
  await screenshot(page, 10, 'authorized');

  await page.getByRole('button', { name: 'Submit today’s proof' }).click();
  await expect(page.getByTestId('proof-screen')).toBeVisible();
  await page.getByText('Use mock sandbox proof').click();
  await screenshot(page, 11, 'proof-ready');

  await page.getByTestId('submit-proof').click();
  await expect(page.getByText('Submitted — under review.')).toBeVisible();
  await screenshot(page, 12, 'proof-submitted');

  await page.getByRole('button', { name: 'View status' }).click();
  await expect(page.getByTestId('verify-status-screen')).toBeVisible();
  await expect(page.getByText('Passed', { exact: true })).toBeVisible();
  await screenshot(page, 13, 'verified');

  await page.getByRole('button', { name: 'Settle mock outcome' }).click();
  const receipt = page.getByTestId('glass-receipt');
  await expect(receipt).toBeVisible();
  await expect(receipt.getByText('SETTLED · SUCCESS')).toBeVisible();
  await page.waitForTimeout(2300);
  await screenshot(page, 14, 'glass-receipt');

  await page.getByRole('button', { name: 'View Commitment Record' }).click();
  const record = page.getByTestId('commitment-record-screen');
  await expect(record).toBeVisible();
  await expect(record.getByText('Daily outdoor walk')).toBeVisible();
  await expect(record.getByRole('button', { name: 'Glass Receipt' })).toBeVisible();
  await screenshot(page, 15, 'record-entry');
});
