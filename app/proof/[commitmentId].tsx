import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { FixedChecklist, PhotoPreview } from '@/components/proof';
import { PrimaryButton, ScreenHeader, StatePanel } from '@/components';
import { color, space, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { findTemplate } from '@/lib/catalog/templates';
import { enqueueProof, syncProofQueue } from '@/lib/proof/queue';
import { submitProof } from '@/lib/proof/service';
import { createProofDraft, type ProofDraft } from '@/lib/proof/types';

type ScreenState = 'capture' | 'uploading' | 'queued' | 'submitted' | 'error';

export default function ProofScreen() {
  const { commitmentId, templateId } = useLocalSearchParams<{ commitmentId: string; templateId: string }>();
  const template = findTemplate(templateId);
  const [photoUri, setPhotoUri] = useState<string>();
  const [state, setState] = useState<ScreenState>('capture');
  const [online, setOnline] = useState<boolean | null>(null);
  const [slaHours, setSlaHours] = useState(24);
  const draft = useMemo<ProofDraft | undefined>(() => {
    if (!photoUri || !template || !commitmentId) return undefined;
    return createProofDraft({
      capturedAt: new Date().toISOString(),
      commitmentId,
      criteria: template.criteria,
      photoUri,
      templateId: template.id,
    });
  }, [commitmentId, photoUri, template]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((network) => {
      const isOnline = network.isConnected === true && network.isInternetReachable !== false;
      setOnline(isOnline);
      if (isOnline) void syncProofQueue(submitProof);
    });
    return unsubscribe;
  }, []);

  if (!template || !commitmentId) {
    return <SafeAreaView style={styles.safe}><View style={styles.container}><StatePanel title="Proof window unavailable." body="We could not match this window to an active commitment. Nothing was submitted." actionLabel="Back" onAction={() => router.back()} /></View></SafeAreaView>;
  }

  const choosePhoto = async (camera: boolean) => {
    setState('capture');
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setState('error');
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const submit = async () => {
    if (!draft) return;
    if (!online) {
      try {
        await enqueueProof(draft);
        setState('queued');
      } catch {
        setState('error');
      }
      return;
    }
    setState('uploading');
    try {
      const result = await submitProof(draft);
      setSlaHours(result.slaHours);
      setState('submitted');
      track('proof_submitted');
    } catch {
      setState('error');
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="proof-screen">
      <View style={styles.container}>
        <Text allowFontScaling accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹ Back</Text>
        <ScreenHeader eyebrow={`${template.cadence} · proof`} title={template.title} body="Use one photo to show the fixed checklist below. The checklist cannot be edited." />
        <FixedChecklist criteria={template.criteria} />

        {state === 'capture' && !photoUri ? (
          <View style={styles.capture}>
            <View accessible accessibilityLabel="No proof photo selected" style={styles.cameraFrame}>
              <Text allowFontScaling style={styles.cameraMark}>＋</Text>
              <Text allowFontScaling style={styles.cameraCopy}>Camera first. Your photo is the only evidence submitted in this step.</Text>
            </View>
            <PrimaryButton onPress={() => choosePhoto(true)} testID="take-proof-photo">Take photo</PrimaryButton>
            <Text allowFontScaling accessibilityRole="button" onPress={() => choosePhoto(false)} style={styles.library}>Choose from photo library</Text>
          </View>
        ) : null}

        {state === 'capture' && photoUri ? (
          <PhotoPreview onRetake={() => setPhotoUri(undefined)} uri={photoUri} />
        ) : null}

        {state === 'uploading' ? (
          <StatePanel title="Submitting your photo…" body="Upload in progress. Keep On the Line open until this finishes." />
        ) : null}
        {state === 'queued' ? (
          <StatePanel title="Saved offline." body="Saved — will submit when you are back online. Verification cannot start until then." actionLabel="Done" onAction={() => router.replace('/catalog')} />
        ) : null}
        {state === 'submitted' ? (
          <StatePanel title="Submitted — under review." body={`SLA: within ${slaHours} hours. Your photo and fixed checklist are locked to this submission.`} actionLabel="Done" onAction={() => router.replace('/catalog')} />
        ) : null}
        {state === 'error' ? (
          <StatePanel title="Your proof was not submitted." body="Check photo access and your connection, then try again. No financial outcome changed." actionLabel="Try again" onAction={() => setState('capture')} />
        ) : null}

        {state === 'capture' && photoUri ? <PrimaryButton onPress={submit} testID="submit-proof">Submit proof</PrimaryButton> : null}
        {online === false && state === 'capture' ? <Text allowFontScaling style={styles.offline}>OFFLINE · Capture still works. Submission will stay safely on this device until you reconnect.</Text> : null}
        <Text allowFontScaling style={styles.missed}>A missed window is never an automatic charge. The template’s checklist rules apply, with review in a later step.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, minHeight: 44, paddingVertical: space.sm },
  cameraCopy: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, maxWidth: 240, textAlign: 'center' },
  cameraFrame: { alignItems: 'center', borderColor: color.textSecondary, borderRadius: space.md, borderStyle: 'dashed', borderWidth: 1, flex: 1, gap: space.sm, justifyContent: 'center', minHeight: 120 },
  cameraMark: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.xl },
  capture: { flex: 1, gap: space.sm },
  container: { flex: 1, gap: space.sm, justifyContent: 'space-between', paddingBottom: space.md, paddingHorizontal: space.lg },
  library: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.caption, minHeight: 44, paddingVertical: space.sm, textAlign: 'center', textDecorationLine: 'underline' },
  missed: { color: color.textSecondary, fontFamily: type.family.body, fontSize: 11, lineHeight: 15 },
  offline: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 10, lineHeight: 14 },
  safe: { backgroundColor: color.surface, flex: 1 },
});
