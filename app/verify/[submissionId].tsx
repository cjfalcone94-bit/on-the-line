import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, useWindowDimensions } from 'react-native';
import { AppealAction, VerificationCard } from '@/components/verification';
import { PrimaryButton, ScreenEntrance, ScreenHeader, StatePanel, TextAction } from '@/components';
import { color, space } from '@/design/tokens';
import { appealVerification, getVerificationStatus } from '@/lib/verification/service';
import type { VerificationSubmission } from '@/lib/verification/types';
import { fireHaptic } from '@/lib/feedback';

type ViewState = 'loading' | 'ready' | 'appealing' | 'error';

export function generateStaticParams() {
  return [{ submissionId: 'demo-passed' }];
}

export default function VerifyStatusScreen() {
  const compact = useWindowDimensions().height <= 700;
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<VerificationSubmission>();
  const [viewState, setViewState] = useState<ViewState>('loading');

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!submissionId) {
      setViewState('error');
      void fireHaptic('warning').catch(() => undefined);
      return;
    }
    setViewState('loading');
    try {
      setSubmission(await getVerificationStatus(submissionId));
      setViewState('ready');
    } catch {
      setViewState('error');
      void fireHaptic('warning').catch(() => undefined);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    getVerificationStatus(submissionId)
      .then((result) => {
        setSubmission(result);
        setViewState('ready');
      })
      .catch(() => { setViewState('error'); void fireHaptic('warning').catch(() => undefined); });
  }, [submissionId]);

  const appeal = async () => {
    if (!submission) return;
    setViewState('appealing');
    try {
      await appealVerification(submission.id, 'Please have a different human reviewer check this proof.');
      setSubmission({ ...submission, appealAllowed: false, status: 'appealed' });
      setViewState('ready');
    } catch {
      setViewState('error');
      void fireHaptic('warning').catch(() => undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="verify-status-screen">
      <ScreenEntrance direction="right" style={[styles.container, compact && styles.containerCompact]}>
        <TextAction onPress={() => router.back()}>‹ Back</TextAction>
        <ScreenHeader compact={compact} eyebrow="verification · read only" title="Proof status" body="Only your submission status appears here. Evidence and reviewer records stay private." />
        {viewState === 'loading' ? <StatePanel title="Checking status…" body="Your proof and published review deadline are being loaded." /> : null}
        {viewState === 'error' ? <StatePanel title="Status is unavailable." body="Check your connection and try again. No verification outcome changed." actionLabel="Try again" onAction={load} /> : null}
        {submission && viewState !== 'loading' ? <VerificationCard compact={compact} submission={submission} /> : null}
        {submission?.appealAllowed && viewState === 'ready' ? <AppealAction onPress={appeal} /> : null}
        {viewState === 'appealing' ? <StatePanel title="Sending your appeal…" body="Your existing outcome remains protected while a new human review is opened." /> : null}
        <PrimaryButton
          disabled={viewState !== 'ready' || !submission}
          onPress={() => submission?.status === 'passed'
            ? router.replace({ pathname: '/settle/[commitmentId]', params: { commitmentId: 'demo-success' } })
            : router.replace('/catalog')}
        >
          {viewState === 'loading' ? 'Checking status…' : viewState === 'appealing' ? 'Sending appeal…' : submission?.status === 'passed' ? 'View Glass Receipt' : 'Done'}
        </PrimaryButton>
      </ScreenEntrance>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingBottom: space.md, paddingHorizontal: space.lg },
  containerCompact: { gap: space.sm, paddingBottom: space.sm, paddingHorizontal: space.md },
  safe: { backgroundColor: color.surface, flex: 1 },
});
