import { DEFAULT_ABOUT, DEFAULT_FOOTER } from '../data/siteContent';
import { Entry, SiteSettings, NavItemConfig, Tag } from '../types';
import { INITIAL_ENTRIES } from '../data/initialEntries';
import { INITIAL_CANONICAL_TAGS } from '../data/canonicalTags';
import {
  isFirebaseConfigured,
  loadEntriesFromFirestore,
  persistEntryToFirestore,
  removeEntryFromFirestore,
  loadSiteSettingsFromFirestore,
  persistSiteSettingsToFirestore,
  DESIGNATED_EDITOR_EMAIL,
} from './firebase';

export { DESIGNATED_EDITOR_EMAIL };

const STORAGE_KEY = 'hongshuying_archive_entries_v2';
const TAGS_KEY = 'hongshuying_archive_tags_v2';
const SETTINGS_KEY = 'hongshuying_archive_settings_v2';
const AUTH_KEY = 'hongshuying_archive_auth_v2';
const DELETED_ENTRIES_KEY = 'hongshuying_archive_deleted_ids_v2';

export function getDeletedEntryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_ENTRIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {
    console.warn('Error reading deleted entry IDs:', err);
  }
  return new Set<string>();
}

export function markEntryAsDeleted(id: string): void {
  if (!id) return;
  const current = getDeletedEntryIds();
  current.add(id);
  current.add(id.toLowerCase());
  current.add(id.trim());
  current.add(id.trim().toLowerCase());
  localStorage.setItem(DELETED_ENTRIES_KEY, JSON.stringify(Array.from(current)));
}

export function unmarkEntryAsDeleted(id: string): void {
  if (!id) return;
  const current = getDeletedEntryIds();
  current.delete(id);
  current.delete(id.toLowerCase());
  current.delete(id.trim());
  current.delete(id.trim().toLowerCase());
  localStorage.setItem(DELETED_ENTRIES_KEY, JSON.stringify(Array.from(current)));
}

export const DEFAULT_NAV_ORDER: NavItemConfig[] = [
  { id: 'index', label: 'Index', view: 'index', visible: true },
  { id: 'about', label: 'About', view: 'about', visible: true },
  { id: 'wander', label: 'Wander', view: 'wander', visible: true },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  about: DEFAULT_ABOUT,
  footer: DEFAULT_FOOTER,
  showWander: true,
  typography: 'a',
  navOrder: DEFAULT_NAV_ORDER,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

// ---------------- Site Settings ----------------
export function getLocalSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed: SiteSettings = JSON.parse(raw);
      // Ensure defaults for backwards compatibility
      if (!parsed.typography) {
        parsed.typography = 'a';
      }
      if (!parsed.navOrder || !Array.isArray(parsed.navOrder) || parsed.navOrder.length === 0) {
        parsed.navOrder = DEFAULT_NAV_ORDER;
      }
      // Ensure wander item visibility matches showWander
      const wanderItem = parsed.navOrder.find((n) => n.id === 'wander');
      if (wanderItem) {
        wanderItem.visible = parsed.showWander;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading local settings:', err);
  }
  return DEFAULT_SITE_SETTINGS;
}

export function saveLocalSettings(settings: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving local settings:', err);
    throw err;
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (isFirebaseConfigured) {
    const remote = await loadSiteSettingsFromFirestore();
    if (remote) {
      saveLocalSettings(remote);
      return remote;
    }
  }
  return getLocalSettings();
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  saveLocalSettings(settings);
  if (isFirebaseConfigured) {
    const saved = await persistSiteSettingsToFirestore(settings);
    if (!saved) throw new Error('Saved in this browser, but could not publish settings to Firebase.');
  }
}

// ---------------- Canonical Tags Storage ----------------
export function getLocalTags(): Tag[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) {
      saveLocalTags(INITIAL_CANONICAL_TAGS);
      return INITIAL_CANONICAL_TAGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveLocalTags(INITIAL_CANONICAL_TAGS);
      return INITIAL_CANONICAL_TAGS;
    }
    // Merge any newly introduced initial canonical tags
    const existingIds = new Set(parsed.map((t) => t.id));
    const missing = INITIAL_CANONICAL_TAGS.filter((t) => !existingIds.has(t.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      saveLocalTags(merged);
      return merged;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed reading tags from storage:', err);
    return INITIAL_CANONICAL_TAGS;
  }
}

export function saveLocalTags(tags: Tag[]): void {
  try {
    const serialized = JSON.stringify(tags);
    localStorage.setItem(TAGS_KEY, serialized);
    const verified = localStorage.getItem(TAGS_KEY);
    if (!verified) {
      throw new Error('Verification failed: Storage did not retain saved tags.');
    }
  } catch (err: any) {
    console.error('Failed saving tags to localStorage:', err);
    throw new Error('Storage write failed: ' + (err?.message || 'Unable to persist tags'));
  }
}

export async function fetchTags(): Promise<Tag[]> {
  return getLocalTags();
}

export async function saveTag(tag: Tag, currentTags?: Tag[]): Promise<Tag[]> {
  const current = currentTags && currentTags.length > 0 ? currentTags : getLocalTags();
  const existingIdx = current.findIndex((t) => t.id === tag.id);
  let updatedList: Tag[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...tag, updatedAt: new Date().toISOString() };
  } else {
    updatedList = [
      ...current,
      {
        ...tag,
        createdAt: tag.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  saveLocalTags(updatedList);
  return updatedList;
}

export async function deleteTagById(
  tagId: string,
  currentTags?: Tag[],
  currentEntries?: Entry[]
): Promise<{ tags: Tag[]; entries: Entry[] }> {
  const baseTags = currentTags && currentTags.length > 0 ? currentTags : getLocalTags();
  const updatedTags = baseTags.filter((t) => t.id !== tagId);
  saveLocalTags(updatedTags);

  const baseEntries = currentEntries && currentEntries.length > 0 ? currentEntries : getLocalEntries();
  const updatedEntries = baseEntries.map((entry) => {
    if (entry.tagIds?.includes(tagId)) {
      return {
        ...entry,
        tagIds: entry.tagIds.filter((id) => id !== tagId),
        updatedAt: new Date().toISOString(),
      };
    }
    return entry;
  });
  saveLocalEntries(updatedEntries);

  return { tags: updatedTags, entries: updatedEntries };
}

export async function mergeTags(
  sourceTagId: string,
  targetTagId: string,
  currentTags?: Tag[],
  currentEntries?: Entry[]
): Promise<{ tags: Tag[]; entries: Entry[] }> {
  if (sourceTagId === targetTagId) {
    return {
      tags: currentTags || getLocalTags(),
      entries: currentEntries || getLocalEntries(),
    };
  }

  const baseTags = currentTags && currentTags.length > 0 ? currentTags : getLocalTags();
  const updatedTags = baseTags.filter((t) => t.id !== sourceTagId);
  saveLocalTags(updatedTags);

  const baseEntries = currentEntries && currentEntries.length > 0 ? currentEntries : getLocalEntries();
  const updatedEntries = baseEntries.map((entry) => {
    if (entry.tagIds?.includes(sourceTagId)) {
      const filtered = entry.tagIds.filter((id) => id !== sourceTagId);
      if (!filtered.includes(targetTagId)) {
        filtered.push(targetTagId);
      }
      return {
        ...entry,
        tagIds: filtered,
        updatedAt: new Date().toISOString(),
      };
    }
    return entry;
  });
  saveLocalEntries(updatedEntries);

  return { tags: updatedTags, entries: updatedEntries };
}

// ---------------- Archive Entries ----------------
export function getLocalEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const deletedIds = getDeletedEntryIds();

    if (raw === null) {
      // First run: initialize with INITIAL_ENTRIES excluding any deleted IDs
      const initial = INITIAL_ENTRIES.filter(
        (e) =>
          !deletedIds.has(e.id) &&
          !deletedIds.has(e.slug) &&
          !deletedIds.has(e.id.toLowerCase()) &&
          !deletedIds.has(e.slug.toLowerCase())
      );
      saveLocalEntries(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveLocalEntries([]);
      return [];
    }

    // Automatically merge any newly introduced INITIAL_ENTRIES if never marked deleted
    const existingIds = new Set(parsed.map((e) => e.id));
    const missing = INITIAL_ENTRIES.filter(
      (e) =>
        !existingIds.has(e.id) &&
        !deletedIds.has(e.id) &&
        !deletedIds.has(e.slug) &&
        !deletedIds.has(e.id.toLowerCase()) &&
        !deletedIds.has(e.slug.toLowerCase())
    );
    let updatedList = missing.length > 0 ? [...parsed, ...missing] : parsed;

    // Automatic normalization & migration:
    // 1. Convert legacy entry types 'term' or 'subject' to 'note'
    // 2. Ensure tagIds array is populated
    // 3. Ensure associatedProjectIds array includes SS project if entry belongs to SS collection
    // 4. Normalize any legacy PDF links
    let didNormalize = missing.length > 0;
    updatedList = updatedList.map((entry) => {
      let entryChanged = false;
      let newEntry = { ...entry };

      // Migrate term/subject to note
      if ((newEntry.type as any) === 'term' || (newEntry.type as any) === 'subject') {
        newEntry.type = 'note';
        entryChanged = true;
      }

      // Ensure tagIds
      if (!newEntry.tagIds || !Array.isArray(newEntry.tagIds) || newEntry.tagIds.length === 0) {
        newEntry.tagIds = (newEntry.subjects || []).map((s: string) => {
          const norm = s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
          return 'tag-' + norm;
        });
        entryChanged = true;
      }

      // Ensure associatedProjectIds
      if (!newEntry.associatedProjectIds || !Array.isArray(newEntry.associatedProjectIds)) {
        newEntry.associatedProjectIds = [];
        if (newEntry.collections?.includes('ss') && newEntry.id !== 'ss-between-books-and-libraries') {
          newEntry.associatedProjectIds.push('ss-between-books-and-libraries');
        }
        entryChanged = true;
      } else if (
        newEntry.collections?.includes('ss') &&
        newEntry.id !== 'ss-between-books-and-libraries' &&
        !newEntry.associatedProjectIds.includes('ss-between-books-and-libraries')
      ) {
        newEntry.associatedProjectIds = [...newEntry.associatedProjectIds, 'ss-between-books-and-libraries'];
        entryChanged = true;
      }

      const newBlocks = (newEntry.blocks || []).map((b: any) => {
        if (b.type === 'document_reader' && b.pdfUrl?.includes('raw.githubusercontent.com')) {
          entryChanged = true;
          return {
            ...b,
            pdfUrl: '/instructional-scores-reading-rooms-no4.pdf',
            originalFileUrl: b.originalFileUrl?.includes('raw.githubusercontent.com')
              ? '/instructional-scores-reading-rooms-no4.pdf'
              : b.originalFileUrl,
          };
        }
        return b;
      });

      if (entryChanged) {
        didNormalize = true;
        return {
          ...newEntry,
          blocks: newBlocks,
        };
      }
      return entry;
    });

    if (didNormalize) {
      saveLocalEntries(updatedList);
    }
    return updatedList;
  } catch (err) {
    console.warn('Failed reading entries from localStorage:', err);
    return INITIAL_ENTRIES;
  }
}

export function saveLocalEntries(entries: Entry[]): void {
  try {
    const serialized = JSON.stringify(entries);
    localStorage.setItem(STORAGE_KEY, serialized);
    // Explicitly verify written record in storage
    const verified = localStorage.getItem(STORAGE_KEY);
    if (!verified) {
      throw new Error('Verification failed: Storage did not retain saved entries.');
    }
  } catch (err: any) {
    console.error('Failed saving entries to localStorage:', err);
    throw new Error('Storage write failed: ' + (err?.message || 'Unable to persist to storage'));
  }
}

export async function fetchEntries(): Promise<Entry[]> {
  if (isFirebaseConfigured) {
    const remote = await loadEntriesFromFirestore();
    if (remote && remote.length > 0) {
      saveLocalEntries(remote);
      return remote;
    }
  }
  return getLocalEntries();
}

export async function saveEntry(entry: Entry, currentAll?: Entry[]): Promise<Entry[]> {
  // Always query authoritative storage baseline
  const stored = getLocalEntries();
  const baseList = stored && stored.length > 0
    ? stored
    : (currentAll && currentAll.length > 0 ? currentAll : INITIAL_ENTRIES);

  // If this entry was previously marked as deleted, unmark it
  unmarkEntryAsDeleted(entry.id);
  if (entry.slug) {
    unmarkEntryAsDeleted(entry.slug);
  }

  // Target strictly by stable original entry ID
  const existingIdx = baseList.findIndex((e) => e.id === entry.id);
  let updatedList: Entry[];
  if (existingIdx >= 0) {
    updatedList = [...baseList];
    updatedList[existingIdx] = entry;
  } else {
    updatedList = [entry, ...baseList];
  }

  // Persist and verify in local storage
  saveLocalEntries(updatedList);

  if (isFirebaseConfigured) {
    await persistEntryToFirestore(entry);
  }
  return updatedList;
}

export async function deleteEntryById(
  entryId: string,
  currentAll?: Entry[],
  forceAuthCheck: boolean = true
): Promise<Entry[]> {
  const authState = getEditorAuthState();
  if (forceAuthCheck && !authState.isAuthenticated) {
    throw new Error('Unauthorized: Editor login is required to delete archive entries.');
  }

  const stored = getLocalEntries();
  const baseList = stored && stored.length > 0
    ? stored
    : (currentAll && currentAll.length > 0 ? currentAll : INITIAL_ENTRIES);

  const cleanTargetId = (entryId || '').trim().toLowerCase();
  if (!cleanTargetId) {
    throw new Error('Entry identifier cannot be empty.');
  }

  // Match target by ID or slug case-insensitively
  const target = baseList.find(
    (e) =>
      e.id.toLowerCase() === cleanTargetId ||
      e.slug.toLowerCase() === cleanTargetId
  );

  if (!target) {
    throw new Error(`Entry "${entryId}" not found in archive.`);
  }

  const stableId = target.id;
  const targetSlug = target.slug;

  // Mark ID and slug as explicitly deleted to prevent resurrection
  markEntryAsDeleted(stableId);
  if (targetSlug) {
    markEntryAsDeleted(targetSlug);
  }

  // Clean up references to deleted entry in all remaining entries
  const updatedList = baseList
    .filter((e) => e.id !== stableId && e.slug !== targetSlug)
    .map((e) => {
      let changed = false;
      let cleaned = { ...e };

      if (cleaned.relatedEntryIds) {
        const filtered = cleaned.relatedEntryIds.filter(
          (id) => id !== stableId && id !== targetSlug && id.toLowerCase() !== stableId.toLowerCase()
        );
        if (filtered.length !== cleaned.relatedEntryIds.length) {
          cleaned.relatedEntryIds = filtered;
          changed = true;
        }
      }

      if (cleaned.associatedProjectIds) {
        const filtered = cleaned.associatedProjectIds.filter(
          (id) => id !== stableId && id !== targetSlug && id.toLowerCase() !== stableId.toLowerCase()
        );
        if (filtered.length !== cleaned.associatedProjectIds.length) {
          cleaned.associatedProjectIds = filtered;
          changed = true;
        }
      }

      if (changed) {
        cleaned.updatedAt = new Date().toISOString();
      }
      return cleaned;
    });

  saveLocalEntries(updatedList);

  // Clean up any canonical tag linked to this note entry
  try {
    const allTags = getLocalTags();
    let tagsChanged = false;
    const cleanedTags = allTags.map((t) => {
      if (t.linkedNoteId === stableId || t.linkedNoteId === targetSlug) {
        tagsChanged = true;
        return { ...t, linkedNoteId: undefined, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    if (tagsChanged) {
      saveLocalTags(cleanedTags);
    }
  } catch (tagErr) {
    console.warn('Error updating linked note tag references:', tagErr);
  }

  if (isFirebaseConfigured) {
    await removeEntryFromFirestore(stableId);
  }

  return updatedList;
}

export async function saveEntriesBatch(updatedEntries: Entry[], currentAll?: Entry[]): Promise<Entry[]> {
  const stored = getLocalEntries();
  const baseList = stored && stored.length > 0
    ? stored
    : (currentAll && currentAll.length > 0 ? currentAll : INITIAL_ENTRIES);

  const map = new Map<string, Entry>(baseList.map((e) => [e.id, e]));
  for (const entry of updatedEntries) {
    unmarkEntryAsDeleted(entry.id);
    map.set(entry.id, entry);
  }
  const fullList = Array.from(map.values());
  saveLocalEntries(fullList);
  if (isFirebaseConfigured) {
    for (const entry of updatedEntries) {
      await persistEntryToFirestore(entry);
    }
  }
  return fullList;
}

export function resetToInitialSampleEntries(): Entry[] {
  try {
    localStorage.removeItem(DELETED_ENTRIES_KEY);
  } catch (err) {
    console.warn('Error clearing deleted entries key:', err);
  }
  saveLocalEntries(INITIAL_ENTRIES);
  return INITIAL_ENTRIES;
}

// ---------------- Editor Authentication ----------------
export function getEditorAuthState(): { isAuthenticated: boolean; email: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        isAuthenticated: !!data.isAuthenticated,
        email: data.email || null,
      };
    }
  } catch (err) {
    console.warn('Failed reading auth state:', err);
  }
  return { isAuthenticated: false, email: null };
}

export function setEditorAuthState(isAuthenticated: boolean, email: string = DESIGNATED_EDITOR_EMAIL): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated, email }));
  } catch (err) {
    console.error('Failed saving auth state:', err);
  }
}

// ---------------- Backup Export / Import ----------------
export function exportArchiveAsJSON(entries: Entry[], settings?: SiteSettings): void {
  const bundle = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    settings: settings || getLocalSettings(),
    entries,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `hongshuying-archive-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
