jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

import { enqueueProof, PROOF_QUEUE_KEY, readProofQueue, syncProofQueue } from '@/lib/proof/queue';
import { createProofDraft } from '@/lib/proof/types';

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: jest.fn(async () => value),
    setItem: jest.fn(async (_key: string, next: string) => { value = next; }),
  };
}

const draft = createProofDraft({
  capturedAt: '2026-07-30T12:00:00.000Z',
  commitmentId: 'commitment-1',
  criteria: ['Criterion one'],
  photoUri: 'file:///cache/photo.jpg',
  templateId: 'daily-walk',
});

describe('offline proof queue', () => {
  it('copies the photo to durable storage and persists the full immutable checklist', async () => {
    const storage = memoryStorage();
    const copy = jest.fn(async () => undefined);
    const queued = await enqueueProof(draft, storage, copy);
    expect(copy).toHaveBeenCalledWith(draft.photoUri, expect.stringContaining(draft.clientSubmissionId));
    expect(storage.setItem).toHaveBeenCalledWith(PROOF_QUEUE_KEY, expect.any(String));
    expect(queued.criteria).toEqual(['Criterion one']);
    expect(queued.photoUri).toContain('file:///documents/');
  });

  it('survives a reload and syncs once when connectivity returns', async () => {
    const storage = memoryStorage();
    await enqueueProof(draft, storage, async () => undefined);
    expect(await readProofQueue(storage)).toHaveLength(1);
    const submit = jest.fn(async () => ({ id: 'proof-1' }));
    await expect(syncProofQueue(submit, storage)).resolves.toEqual({ synced: 1, remaining: 0 });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(await readProofQueue(storage)).toHaveLength(0);
  });

  it('keeps a failed sync queued for a later reconnect', async () => {
    const storage = memoryStorage();
    await enqueueProof(draft, storage, async () => undefined);
    await expect(syncProofQueue(async () => { throw new Error('offline'); }, storage))
      .resolves.toEqual({ synced: 0, remaining: 1 });
    expect(await readProofQueue(storage)).toHaveLength(1);
  });
});
