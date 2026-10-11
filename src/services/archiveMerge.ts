import type { ArchiveBundle } from './githubPublishing';

function equal(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, i) => equal(value, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every(key => equal(a[key], b[key]));
  }
  return false;
}
const object = (value: any) => value && typeof value === 'object' && !Array.isArray(value);

// Only reconcile independent edits. Arrays inside an entry remain atomic so
// competing gallery/text edits or reorderings cannot silently replace each other.
export function mergeArchive(base: ArchiveBundle, local: ArchiveBundle, remote: ArchiveBundle): ArchiveBundle {
  const conflicts: string[] = [];
  function merge(old: any, draft: any, latest: any, path: string): any {
    if (equal(draft, latest)) return draft;
    if (equal(draft, old)) return latest;
    if (equal(latest, old)) return draft;
    if (path.endsWith('.updatedAt')) return [draft, latest].filter(value => typeof value === 'string').sort().at(-1);
    if (object(old) && object(draft) && object(latest)) {
      const result: Record<string, any> = {};
      for (const key of new Set([...Object.keys(old), ...Object.keys(draft), ...Object.keys(latest)])) {
        const value = merge(old[key], draft[key], latest[key], `${path}.${key}`);
        if (value !== undefined) result[key] = value;
      }
      return result;
    }
    conflicts.push(path);
    return draft;
  }
  function records(key: 'entries' | 'tags') {
    const old = new Map(base[key].map(value => [value.id, value] as const));
    const draft = new Map(local[key].map(value => [value.id, value] as const));
    const latest = new Map(remote[key].map(value => [value.id, value] as const));
    const ids = (values: {id: string}[]) => values.map(value => value.id);
    const order = equal(ids(local[key]), ids(base[key])) ? remote[key] : local[key];
    const result: any[] = [];
    for (const id of new Set([...ids(order), ...ids(remote[key]), ...ids(local[key]), ...ids(base[key])])) {
      const label = (draft.get(id) as any)?.title || (latest.get(id) as any)?.title || id;
      const value = merge(old.get(id), draft.get(id), latest.get(id), `${key}[${label}]`);
      if (value !== undefined) result.push(value);
    }
    return result;
  }
  const result = { version: 3, entries: records('entries'), tags: records('tags'), settings: merge(base.settings, local.settings, remote.settings, 'settings') };
  if (conflicts.length) throw new Error(`Publishing stopped because both your draft and GitHub changed: ${conflicts.slice(0, 5).join(', ')}. Export your draft backup and share it for help merging these changes. Your draft is retained; nothing was overwritten.`);
  return result;
}
