const assertionUrl = SETTLEMENT_ASSERT_URL;
if (!assertionUrl) {
  throw new Error('SETTLEMENT_ASSERT_URL is required for deployed API/state settlement assertions');
}

const result = http.get(assertionUrl, {
  headers: { Authorization: `Bearer ${SETTLEMENT_FIXTURE_TOKEN}` },
});
if (result.status !== 200) {
  throw new Error(`Settlement fixture returned HTTP ${result.status}`);
}

const body = json(result.body);
if (body.state !== EXPECTED_STATE) {
  throw new Error(`Expected ${EXPECTED_STATE}, received ${body.state}`);
}
if (EXPECTED_STAKE_CAPTURED && String(body.stakeCaptured) !== EXPECTED_STAKE_CAPTURED) {
  throw new Error('Stake capture assertion failed');
}
if (EXPECTED_FULL_CHARITY_TRANSFER && String(body.fullCharityTransfer) !== EXPECTED_FULL_CHARITY_TRANSFER) {
  throw new Error('Full charity transfer assertion failed');
}
