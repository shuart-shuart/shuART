import type { ArchiveBundle } from './githubPublishing';

export function restoreMissingDrafts(current: ArchiveBundle, backup: ArchiveBundle) {
  const ids = new Set(current.entries.map(entry => entry.id));
  const slugs = new Set(current.entries.map(entry => entry.slug));
  const restored = backup.entries.filter(entry => {
    if (entry.status !== 'draft' || ids.has(entry.id) || slugs.has(entry.slug)) return false;
    ids.add(entry.id); slugs.add(entry.slug);
    return true;
  });
  const tags = new Map(current.tags.map(tag => [tag.id, tag]));
  const neededTags = new Set(restored.flatMap(entry => entry.tagIds));
  for (const tag of backup.tags) {
    if (neededTags.has(tag.id) && !tags.has(tag.id)) tags.set(tag.id, tag);
  }
  return {
    bundle: { ...current, entries: [...current.entries, ...restored], tags: [...tags.values()] },
    restoredCount: restored.length,
  };
}
