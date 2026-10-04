import { Entry, BacklinkInfo } from '../types';

/**
 * Computes backlinks to the target entry from all published (or visible) entries.
 * Checks:
 * 1. Explicit ID relationship: `entry.relatedEntryIds.includes(targetEntry.id)`
 * 2. Inline wikilink in `fullText`: `[[targetEntry.id]]` or `[[targetEntry.slug]]`
 */
export function findBacklinks(targetEntry: Entry, allEntries: Entry[]): BacklinkInfo[] {
  const backlinks: BacklinkInfo[] = [];
  const targetId = targetEntry.id.toLowerCase();
  const targetSlug = targetEntry.slug.toLowerCase();
  const targetTitle = targetEntry.title.toLowerCase();
  const targetZh = targetEntry.titleZh?.toLowerCase() || '';

  allEntries.forEach((entry) => {
    // Cannot link to self
    if (entry.id === targetEntry.id) return;

    let isLinked = false;
    let excerpt = '';

    // 1. Explicit relationship pointing to entry ID
    if (entry.relatedEntryIds && entry.relatedEntryIds.includes(targetEntry.id)) {
      isLinked = true;
    }

    // 2. Mention in fullText via [[wikilink]]
    const content = entry.fullText || '';
    const contentLower = content.toLowerCase();
    const hasWikiLink =
      contentLower.includes(`[[${targetId}]]`) ||
      contentLower.includes(`[[${targetSlug}]]`) ||
      contentLower.includes(`[[${targetTitle}]]`) ||
      (targetZh && contentLower.includes(`[[${targetZh}]]`));

    if (hasWikiLink) {
      isLinked = true;
      // Extract brief excerpt around mention
      const idx = contentLower.indexOf(`[[${targetId}`);
      const mentionIdx = idx !== -1 ? idx : contentLower.indexOf(`[[${targetSlug}`);
      const finalIdx = mentionIdx !== -1 ? mentionIdx : contentLower.indexOf('[[');
      if (finalIdx !== -1) {
        const start = Math.max(0, finalIdx - 40);
        const end = Math.min(content.length, finalIdx + 60);
        excerpt = content.slice(start, end).replace(/\[\[|\]\]/g, '').trim();
        if (start > 0) excerpt = '…' + excerpt;
        if (end < content.length) excerpt = excerpt + '…';
      }
    }

    if (isLinked) {
      backlinks.push({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        titleZh: entry.titleZh,
        type: entry.type,
        contextExcerpt: excerpt || entry.shortDescription || undefined,
      });
    }
  });

  return backlinks;
}

/**
 * Creates a clean, stable URL slug from a title string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entry-' + Date.now().toString(36);
}
