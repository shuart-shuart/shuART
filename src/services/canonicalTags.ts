import type { Entry, Tag } from '../types';

export function entryTags(entry: Pick<Entry, 'tagIds'>, tags: Tag[]): Tag[] {
  const assigned = new Set(entry.tagIds || []);
  const seenLabels = new Set<string>();
  return tags.filter(tag => {
    const label = tag.label.trim().toLowerCase();
    if (!assigned.has(tag.id) || seenLabels.has(label)) return false;
    seenLabels.add(label);
    return true;
  });
}

export function tagCounts(entries: Entry[], tags: Tag[]) {
  const counts = new Map<string, {id: string; label: string; count: number}>();
  for (const entry of entries) {
    for (const tag of entryTags(entry, tags)) {
      const key = tag.label.trim().toLowerCase();
      const item = counts.get(key) || {id: tag.id, label: tag.label, count: 0};
      item.count++;
      counts.set(key, item);
    }
  }
  return [...counts.values()].sort((a,b) => b.count - a.count);
}
