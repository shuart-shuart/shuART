import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeEntryIds, entryMatches, upsertSlugEntry } from '../src/services/entryIdentity';
import { mergeArchive } from '../src/services/archiveMerge';
import type { ArchiveBundle } from '../src/services/githubPublishing';

const archive = (): ArchiveBundle => ({ version: 3, settings: { showWander: true, typography: 'a', updatedAt: '' }, tags: [{ id: 'tag', label: 'Study', linkedNoteId: 'old-note' }], entries: [
  { id: 'old-work', slug: 'work', title: 'Work', type: 'work', status: 'published', fullText: '[[old-note|Read]] [Project](#entry/old-project)', shortDescription: '', relatedEntryIds: ['old-note'], associatedProjectIds: ['old-project'], tagIds: [], subjects: [], createdAt: '', updatedAt: '', images: [{ id: 'image-id', url: 'https://example.org/image.jpg' }], blocks: [{ id: 'block-id', type: 'text', content: '[[old-project]]' }] },
  { id: 'old-project', slug: 'project', title: 'Project', type: 'project', status: 'published', fullText: '', shortDescription: '', relatedEntryIds: ['old-work'], tagIds: [], subjects: [], createdAt: '', updatedAt: '' },
  { id: 'old-note', slug: 'private-note', title: 'Private', type: 'note', status: 'draft', fullText: 'private content', shortDescription: '', relatedEntryIds: [], tagIds: [], subjects: [], createdAt: '', updatedAt: '' },
] });

test('ID migration preserves content/status and refreshes connections, subject notes and inline links', () => {
  const original = archive(), before = structuredClone(original);
  const migrated = canonicalizeEntryIds(original);
  assert.deepEqual(original, before);
  assert.ok(migrated.entries.every(entry => entry.id === entry.slug));
  assert.deepEqual(migrated.entries[0].relatedEntryIds, ['private-note']);
  assert.deepEqual(migrated.entries[0].associatedProjectIds, ['project']);
  assert.equal(migrated.tags[0].linkedNoteId, 'private-note');
  assert.equal(migrated.entries[0].fullText, '[[private-note|Read]] [Project](#entry/project)');
  assert.deepEqual(migrated.entries[0].images, original.entries[0].images);
  assert.equal(migrated.entries[0].blocks![0].id, 'block-id');
  assert.equal(migrated.entries[2].status, 'draft');
  assert.equal(migrated.entries[2].fullText, 'private content');
  assert.ok(entryMatches(migrated.entries[0], 'old-work'));
  assert.deepEqual(canonicalizeEntryIds(migrated), migrated);
});

test('editing a slug replaces the existing entry and refreshes references while keeping older URLs usable', () => {
  const original = canonicalizeEntryIds(archive());
  const changed = { ...original.entries[0], id: 'new-work', slug: 'new-work' };
  const updated = canonicalizeEntryIds({ ...original, entries: upsertSlugEntry(changed, original.entries, 'work') });
  assert.equal(updated.entries.length, 3);
  assert.equal(updated.entries[0].id, 'new-work');
  assert.deepEqual(updated.entries[1].relatedEntryIds, ['new-work']);
  assert.ok(entryMatches(updated.entries[0], '#entry/work'));
  assert.ok(entryMatches(updated.entries[0], 'old-work'));
  assert.throws(() => upsertSlugEntry({ ...changed, slug: 'project' }, original.entries, 'work'), /already used/);
  assert.throws(() => upsertSlugEntry({ ...changed, id: 'new', slug: 'old-work' }, updated.entries, 'new'), /already used/);
});

test('a stale browser draft merges through the ID migration without duplicates or loss of newer remote edits', () => {
  const base = archive(), local = archive();
  local.entries[0].shortDescription = 'Local edit';
  const remote = canonicalizeEntryIds(archive());
  remote.entries[0].date = '2026';
  const result = mergeArchive(base, local, remote);
  assert.equal(result.entries.length, 3);
  assert.equal(result.entries[0].id, 'work');
  assert.equal(result.entries[0].shortDescription, 'Local edit');
  assert.equal(result.entries[0].date, '2026');
  assert.equal(result.entries[2].status, 'draft');
});
