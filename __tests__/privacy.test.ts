import { scrubDeep } from '@/lib/privacy';

describe('financial and PII scrub', () => {
  it('redacts sensitive fields recursively before telemetry leaves the app', () => {
    expect(
      scrubDeep({
        context: { stakeAmount: 50, proofUri: 'file:///proof.jpg' },
        message: 'contact person@example.com',
        safe: 'foundation',
      }),
    ).toEqual({
      context: { stakeAmount: '[Filtered]', proofUri: '[Filtered]' },
      message: 'contact [Filtered]',
      safe: 'foundation',
    });
  });
});
