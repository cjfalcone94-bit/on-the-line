import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AppealAction, VerificationCard } from '@/components/verification';
import { PrimaryButton, ScreenHeader, StatePanel } from '@/components';
import { color, space, type } from '@/design/tokens';
import { appealVerification, getVerificationStatus } from '@/lib/verification/service';
import type { VerificationSubmission } from '@/lib/verification/types';

type ViewState = 'loading' | 'ready' | 'appealing' | 'error';

export default function VerifyStatusScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<VerificationSubmission>();
  const [viewState, setViewState] = useState<ViewState>('loading');

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!submissionId) {
      setViewState('error');
      return;
    }
    setViewState('loading');
    try {
      setSubmission(await getVerificationStatus(submissionId));
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    getVerificationStatus(submissionId)
      .then((result) => {
        setSubmission(result);
        setViewState('ready');
      })
      .catch(() => setViewState('error'));
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
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="verify-status-screen">
      <View style={styles.container}>
        <Text allowFontScaling accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹ Back</Text>
        <ScreenHeader eyebrow="verification · read only" title="Proof status" body="Only your submission status appears here. Evidence and reviewer records stay private." />
        {viewState === 'loading' ? <StatePanel title="Checking status…" body="Your proof and published review deadline are being loaded." /> : null}
        {viewState === 'error' ? <StatePanel title="Status is unavailable." body="Check your connection and try again. No verification outcome changed." actionLabel="Try again" onAction={load} /> : null}
        {submission && viewState !== 'loading' ? <VerificationCard submission={submission} /> : null}
        {submission?.appealAllowed && viewState === 'ready' ? <AppealAction onPress={appeal} /> : null}
        {viewState === 'appealing' ? <StatePanel title="Sending your appeal…" body="Your existing outcome remains protected while a new human review is opened." /> : null}
        <PrimaryButton onPress={() => router.replace('/catalog')}>Done</PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, minHeight: 44, paddingVertical: space.sm },
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingBottom: space.md, paddingHorizontal: space.lg },
  safe: { backgroundColor: color.surface, flex: 1 },
});
