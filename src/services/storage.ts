import { Entry, SiteSettings, NavItemConfig, Tag } from '../types';
import { DESIGNATED_EDITOR_EMAIL } from './mediaUploads';
import archiveData from '../data/archive.json';
import { ArchiveBundle, DRAFT_BASE_KEY, isGitHubConnected, disconnectGitHub } from './githubPublishing';
export const PUBLISHED_ARCHIVE = archiveData as unknown as ArchiveBundle;

export { DESIGNATED_EDITOR_EMAIL };

const DELETED_ENTRIES_KEY = 'hongshuying_archive_deleted_ids_v3';

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

export const DEFAULT_SITE_SETTINGS: SiteSettings = PUBLISHED_ARCHIVE.settings;

// ---------------- Site Settings ----------------
const DRAFT_KEY = 'shuart_archive_draft_v3';
function readDraft(): ArchiveBundle {
  const raw = localStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : PUBLISHED_ARCHIVE;
}
function writeDraft(patch: Partial<ArchiveBundle>) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readDraft(), ...patch, version: 3 })); }
  catch { throw new Error('Draft storage is full or unavailable. Export a backup and reduce embedded media before saving.'); }
}
export function getLocalSettings(): SiteSettings { return readDraft().settings; }
export function saveLocalSettings(settings: SiteSettings): void { writeDraft({ settings }); }

export async function fetchSiteSettings(): Promise<SiteSettings> {
  return isGitHubConnected() ? getLocalSettings() : PUBLISHED_ARCHIVE.settings;
}
export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  saveLocalSettings(settings);
}

export function getLocalTags(): Tag[] { return readDraft().tags; }
export function saveLocalTags(tags: Tag[]): void { writeDraft({ tags }); }

export async function fetchTags(): Promise<Tag[]> {
  return isGitHubConnected() ? getLocalTags() : PUBLISHED_ARCHIVE.tags;
}

export async function saveTag(tag: Tag, currentTags?: Tag[]): Promise<Tag[]> {
  const current = currentTags ?? getLocalTags();
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
  const baseTags = currentTags ?? getLocalTags();
  const updatedTags = baseTags.filter((t) => t.id !== tagId);
  saveLocalTags(updatedTags);

  const baseEntries = currentEntries ?? getLocalEntries();
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

  const baseTags = currentTags ?? getLocalTags();
  const updatedTags = baseTags.filter((t) => t.id !== sourceTagId);
  saveLocalTags(updatedTags);

  const baseEntries = currentEntries ?? getLocalEntries();
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
export function getLocalEntries(): Entry[] { return readDraft().entries; }
export function saveLocalEntries(entries: Entry[]): void { writeDraft({ entries }); }

export async function fetchEntries(): Promise<Entry[]> {
  return isGitHubConnected() ? getLocalEntries() : PUBLISHED_ARCHIVE.entries;
}

export async function saveEntry(entry: Entry, currentAll?: Entry[]): Promise<Entry[]> {
  // Always query authoritative storage baseline
  const stored = getLocalEntries();
  const baseList = currentAll ?? stored;

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
  const baseList = currentAll ?? stored;

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


  return updatedList;
}

export async function saveEntriesBatch(updatedEntries: Entry[], currentAll?: Entry[]): Promise<Entry[]> {
  const stored = getLocalEntries();
  const baseList = currentAll ?? stored;

  const map = new Map<string, Entry>(baseList.map((e) => [e.id, e]));
  for (const entry of updatedEntries) {
    unmarkEntryAsDeleted(entry.id);
    map.set(entry.id, entry);
  }
  const fullList = Array.from(map.values());
  saveLocalEntries(fullList);
  return fullList;
}

export function resetToInitialSampleEntries(): Entry[] {
  try {
    localStorage.removeItem(DELETED_ENTRIES_KEY);
  } catch (err) {
    console.warn('Error clearing deleted entries key:', err);
  }
  saveLocalEntries(PUBLISHED_ARCHIVE.entries);
  return PUBLISHED_ARCHIVE.entries;
}

// ---------------- Editor Authentication ----------------
export function getEditorAuthState(): { isAuthenticated: boolean; email: string | null } {
  return { isAuthenticated: isGitHubConnected(), email: isGitHubConnected() ? DESIGNATED_EDITOR_EMAIL : null };
}
export function setEditorAuthState(isAuthenticated: boolean, email?: string): void {
  if (!isAuthenticated) disconnectGitHub();
}
export function getLegacyBrowserArchive(): ArchiveBundle | null {
  const entries = localStorage.getItem('hongshuying_archive_entries_v2');
  const tags = localStorage.getItem('hongshuying_archive_tags_v2');
  const settings = localStorage.getItem('hongshuying_archive_settings_v2');
  if (!entries && !tags && !settings) return null;
  return { version: 3, entries: entries ? JSON.parse(entries) : PUBLISHED_ARCHIVE.entries,
    tags: tags ? JSON.parse(tags) : PUBLISHED_ARCHIVE.tags,
    settings: settings ? JSON.parse(settings) : PUBLISHED_ARCHIVE.settings };
}
export function getDraftArchive(): ArchiveBundle {
  return { version: 3, entries: getLocalEntries(), tags: getLocalTags(), settings: getLocalSettings() };
}
export function saveDraftArchive(bundle: ArchiveBundle) { writeDraft(bundle); }
export function beginGitHubEditorSession(bundle: ArchiveBundle, sha: string): ArchiveBundle {
  if (!localStorage.getItem(DRAFT_BASE_KEY)) {
    saveDraftArchive(bundle);
    localStorage.setItem(DRAFT_BASE_KEY, sha);
  }
  return getDraftArchive();
}
export function replaceGitHubDraft(bundle: ArchiveBundle, sha: string) {
  saveDraftArchive(bundle);
  localStorage.removeItem(DELETED_ENTRIES_KEY);
  localStorage.setItem(DRAFT_BASE_KEY, sha);
}

// ---------------- Backup Export / Import ----------------
export function exportArchiveAsJSON(entries: Entry[], settings?: SiteSettings): void {
  const bundle = {
    version: '3.0',
    tags: getLocalTags(),
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
