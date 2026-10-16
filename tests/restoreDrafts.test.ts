import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreMissingDrafts } from '../src/services/restoreDrafts';
import type { ArchiveBundle } from '../src/services/githubPublishing';

test('draft restoration adds missing drafts without replacing current entries, tags or settings', () => {
  const current = { version: 3, entries: [{ id: 'current', slug: 'current', status: 'published', title: 'New text' }], tags: [{ id: 'existing', label: 'New label' }], settings: { showWander: true } } as ArchiveBundle;
  const backup = { version: 3, entries: [
    { id: 'current', slug: 'current', status: 'draft', title: 'Old text' },
    { id: 'collision', slug: 'current', status: 'draft' },
    { id: 'missing-public', slug: 'missing-public', status: 'published' },
    { id: 'draft', slug: 'draft', status: 'draft', tagIds: ['existing', 'needed'] },
  ], tags: [{ id: 'existing', label: 'Old label' }, { id: 'needed', label: 'Restored tag' }, { id: 'unused', label: 'Unused' }], settings: { showWander: false } } as ArchiveBundle;
  const result = restoreMissingDrafts(current, backup);
  assert.equal(result.restoredCount, 1);
  assert.deepEqual(result.bundle.entries.map(entry => entry.id), ['current', 'draft']);
  assert.equal(result.bundle.entries[0].title, 'New text');
  assert.equal(result.bundle.settings, current.settings);
  assert.deepEqual(result.bundle.tags.map(tag => tag.label), ['New label', 'Restored tag']);
  assert.equal(restoreMissingDrafts(result.bundle, backup).restoredCount, 0);
  assert.equal(current.entries.length, 1);
});
