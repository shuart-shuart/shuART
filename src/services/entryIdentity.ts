import type { Entry, SiteSettings, Tag } from '../types';

interface ArchiveIdentity { entries: Entry[]; tags: Tag[]; settings: SiteSettings }
export function entryMatches(entry: Entry, identifier: string): boolean {
  let value = identifier.trim().replace(/^#entry\//, '');
  try { value = decodeURIComponent(value); } catch { /* literal identifier */ }
  value = value.toLowerCase();
  return [entry.id, entry.slug, ...(entry.aliases || [])].some(alias => alias.toLowerCase() === value);
}

export function canonicalizeEntryIds<T extends ArchiveIdentity>(bundle: T): T {
  const mapping = new Map<string, string>();
  const slugs = new Set<string>();
  for (const entry of bundle.entries) {
    const slug = entry.slug.trim();
    if (!slug || slugs.has(slug.toLowerCase())) throw new Error('Every entry must have a unique URL slug.');
    slugs.add(slug.toLowerCase());
    mapping.set(slug.toLowerCase(), slug);
  }
  for (const entry of bundle.entries) {
    for (const alias of [entry.id, ...(entry.aliases || [])]) if (!mapping.has(alias.toLowerCase())) mapping.set(alias.toLowerCase(), entry.slug.trim());
  }
  const resolve = (value: string) => mapping.get(value.toLowerCase()) || value;
  const rewriteText = (value: string) => value
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (all, target: string, label = '') => mapping.has(target.trim().toLowerCase()) ? `[[${resolve(target.trim())}${label}]]` : all)
    .replace(/#entry\/([^\s)"'<>#]+)/g, (all, target: string) => {
      try { const decoded = decodeURIComponent(target); return mapping.has(decoded.toLowerCase()) ? `#entry/${resolve(decoded)}` : all; } catch { return all; }
    });
  const rewrite = (value: unknown): unknown => {
    if (typeof value === 'string') return rewriteText(value);
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
    return value;
  };
  const entries = bundle.entries.map(entry => {
    const slug = entry.slug.trim();
    const aliases = [...new Set([...(entry.aliases || []), entry.id].filter(alias => alias !== slug))];
    const updated = rewrite(entry) as Entry;
    return { ...updated, id: slug, slug, ...(aliases.length ? { aliases } : {}),
      ...(entry.relatedEntryIds ? { relatedEntryIds: entry.relatedEntryIds.map(resolve) } : {}),
      ...(entry.associatedProjectIds ? { associatedProjectIds: entry.associatedProjectIds.map(resolve) } : {}),
    };
  });
  return { ...bundle, entries, tags: bundle.tags.map(tag => ({ ...tag, ...(tag.linkedNoteId ? { linkedNoteId: resolve(tag.linkedNoteId) } : {}) })), settings: rewrite(bundle.settings) as SiteSettings };
}

export function upsertSlugEntry(entry: Entry, entries: Entry[], previousId = entry.id): Entry[] {
  const index = entries.findIndex(item => entryMatches(item, previousId));
  const previous = entries[index];
  if (entries.some((item, i) => i !== index && entryMatches(item, entry.slug))) throw new Error('This slug is already used by another entry or one of its previous links.');
  const aliases = [...new Set([...(entry.aliases || []), ...(previous?.aliases || []), ...(previous ? [previous.id, previous.slug] : [])].filter(alias => alias !== entry.slug))];
  const saved = { ...entry, id: entry.slug, ...(aliases.length ? { aliases } : {}) };
  if (index < 0) return [saved, ...entries];
  return entries.map((item, i) => i === index ? saved : item);
}
