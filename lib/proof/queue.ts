import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { ProofDraft, QueuedProof } from './types';

export const PROOF_QUEUE_KEY = 'on-the-line:proof-queue:v1';

export type QueueStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export async function readProofQueue(storage: QueueStorage = AsyncStorage): Promise<readonly QueuedProof[]> {
  const value = await storage.getItem(PROOF_QUEUE_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value) as QueuedProof[];
  } catch {
    return [];
  }
}

export async function persistProofQueue(items: readonly QueuedProof[], storage: QueueStorage = AsyncStorage) {
  await storage.setItem(PROOF_QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueProof(
  draft: ProofDraft,
  storage: QueueStorage = AsyncStorage,
  copyFile: (from: string, to: string) => Promise<void> = (from, to) => FileSystem.copyAsync({ from, to }),
): Promise<QueuedProof> {
  const base = FileSystem.documentDirectory ?? '';
  const durableUri = `${base}proof-${draft.clientSubmissionId}.jpg`;
  await copyFile(draft.photoUri, durableUri);
  const queued = Object.freeze({ ...draft, photoUri: durableUri, queuedAt: new Date().toISOString() });
  const current = await readProofQueue(storage);
  if (!current.some((item) => item.clientSubmissionId === queued.clientSubmissionId)) {
    await persistProofQueue([...current, queued], storage);
  }
  return queued;
}

export async function syncProofQueue(
  submit: (draft: ProofDraft) => Promise<unknown>,
  storage: QueueStorage = AsyncStorage,
): Promise<{ synced: number; remaining: number }> {
  const current = await readProofQueue(storage);
  const remaining: QueuedProof[] = [];
  let synced = 0;
  for (const item of current) {
    try {
      await submit(item);
      synced += 1;
      await FileSystem.deleteAsync(item.photoUri, { idempotent: true });
    } catch {
      remaining.push(item);
    }
  }
  await persistProofQueue(remaining, storage);
  return { synced, remaining: remaining.length };
}
