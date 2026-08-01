import { expect, test, type Page } from '@playwright/test';

const evidence = '/workspace/evidence/sandbox-walk';
const baseUrl = 'http://127.0.0.1:4174';
const shot = (page: Page, name: string) => page.screenshot({ path: `${evidence}/${name}.png`, fullPage: false });

async function beginCommit(page: Page, prefix: string) {
  await page.goto(`${baseUrl}/catalog`);
  await expect(page.getByTestId('catalog-screen')).toBeVisible();
  await shot(page, `${prefix}-01-catalog`);
  await page.getByTestId('template-daily-walk').click();
  await expect(page.getByTestId('template-detail-screen')).toBeVisible();
  await shot(page, `${prefix}-02-template-detail`);
  await page.getByRole('button', { name: /Commit to Daily outdoor walk/ }).click();
  await expect(page.getByText('Put a clear amount on it.')).toBeVisible();
  await page.getByTestId('stake-4000').click();
  await page.getByRole('button', { name: 'Choose charity' }).click();
  await page.getByTestId('charity-direct-relief').click();
  await shot(page, `${prefix}-03-commit-stake-charity`);
  await page.getByRole('button', { name: 'Review the mechanic' }).click();
  await page.getByRole('button', { name: 'Continue to card authorization' }).click();
  await expect(page.getByTestId('sandbox-badge')).toContainText('SANDBOX');
}

async function finishCommit(page: Page, prefix: string, forfeit = false) {
  if (forfeit) await page.getByText(/Success — release mock stake/).click();
  await shot(page, `${prefix}-04-authorize-sandbox`);
  await page.getByRole('button', { name: 'Run mock authorization' }).click();
  await expect(page.getByText('Mock stake authorized.')).toBeVisible();
  await shot(page, `${prefix}-05-authorized`);
  await page.getByRole('button', { name: 'Submit today’s proof' }).click();
  await expect(page.getByTestId('proof-screen')).toBeVisible();
  await page.getByText('Use mock sandbox proof').click();
  await shot(page, `${prefix}-06-proof`);
  await page.getByTestId('submit-proof').click();
  await expect(page.getByText('Submitted — under review.')).toBeVisible();
  await page.getByRole('button', { name: 'View status' }).click();
  await expect(page.getByTestId('verify-status-screen')).toBeVisible();
  await expect(page.getByText(forfeit ? 'Needs review' : 'Passed', { exact: true })).toBeVisible();
  await shot(page, `${prefix}-07-verify`);
  await page.getByRole('button', { name: 'Settle mock outcome' }).click();
  await expect(page.getByTestId('glass-receipt')).toBeVisible();
  await expect(page.getByTestId('sandbox-badge')).toContainText('NO REAL PAYMENT');
  await expect(page.getByTestId('glass-receipt').getByText(forfeit ? 'SETTLED · FORFEIT' : 'SETTLED · SUCCESS')).toBeVisible();
  await page.waitForTimeout(2300);
  await shot(page, `${prefix}-08-${forfeit ? 'forfeit' : 'success'}-receipt`);
}

test.use({ viewport: { width: 375, height: 667 } });

test('walks sandbox success, record, and forfeit receipts', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());

  await beginCommit(page, 'success');
  await finishCommit(page, 'success');
  await page.goto(`${baseUrl}/record`);
  await expect(page.getByTestId('commitment-record-screen')).toBeVisible();
  await expect(page.getByText('Daily outdoor walk')).toBeVisible();
  await shot(page, 'success-09-record-new-entry');

  await beginCommit(page, 'forfeit');
  await finishCommit(page, 'forfeit', true);
});
