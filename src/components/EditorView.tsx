import React, { useState } from 'react';
import { Entry, EntryType, EntryStatus, SiteSettings, Tag } from '../types';
import { exportArchiveAsJSON, DESIGNATED_EDITOR_EMAIL } from '../services/storage';
import { isFirebaseConfigured } from '../services/firebase';
import { EditorTagsSection } from './editor/EditorTagsSection';
import { EditorSettingsSection } from './editor/EditorSettingsSection';

interface EditorViewProps {
  entries: Entry[];
  tags: Tag[];
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => Promise<void> | void;
  onAddNewEntry: () => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: string) => Promise<void> | void;
  onToggleStatus: (id: string) => Promise<void> | void;
  onSelectEntry: (slugOrId: string) => void;
  onImportEntries: (entries: Entry[]) => void;
  onResetToSampleEntries: () => void;
  onSaveEntry?: (entry: Entry) => Promise<void> | void;
  onBatchSaveEntries?: (entries: Entry[]) => Promise<void> | void;
  onSaveTag: (tag: Tag) => Promise<Tag[]> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onMergeTags: (sourceTagId: string, targetTagId: string) => Promise<void> | void;
  onSignOut?: () => void;
  onReturnToPublic?: () => void;
}

type EditorTab = 'entries' | 'tags' | 'settings';

export const EditorView: React.FC<EditorViewProps> = ({
  entries,
  tags,
  siteSettings,
  onUpdateSiteSettings,
  onAddNewEntry,
  onEditEntry,
  onDeleteEntry,
  onToggleStatus,
  onSelectEntry,
  onImportEntries,
  onResetToSampleEntries,
  onSaveEntry,
  onBatchSaveEntries,
  onSaveTag,
  onDeleteTag,
  onMergeTags,
  onSignOut,
  onReturnToPublic,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('entries');

  // Entries tab local states
  const [filterStatus, setFilterStatus] = useState<'all' | EntryStatus>('all');
  const [filterType, setFilterType] = useState<'all' | EntryType>('all');
  const [search, setSearch] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  const executeDelete = async (entry: Entry) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteEntry(entry.id);
      setDeleteSuccessMsg(`Entry "${entry.title}" (${entry.id}) has been permanently deleted.`);
      setEntryToDelete(null);
      setTimeout(() => {
        setDeleteSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setDeleteError(err?.message || 'Storage error while attempting to delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        (e.titleZh && e.titleZh.toLowerCase().includes(q)) ||
        e.type.toLowerCase().includes(q) ||
        e.shortDescription?.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const entriesArray = Array.isArray(parsed) ? parsed : parsed.entries;
        if (Array.isArray(entriesArray) && entriesArray.length > 0) {
          onImportEntries(entriesArray);
          alert(`Successfully imported ${entriesArray.length} entries into archive.`);
        } else {
          alert('Invalid archive file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const draftCount = entries.filter((e) => e.status === 'draft').length;
  const publishedCount = entries.filter((e) => e.status === 'published').length;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-fadeIn font-sans">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 pb-6 border-b border-black/10">
        <div className="space-y-1">
          <div className="text-xs font-mono-quiet text-black/40 uppercase tracking-wider">
            Editor Console · Logged in as {DESIGNATED_EDITOR_EMAIL}
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-black">
            Archive Content & System Management
          </h1>
          <p className="text-xs text-black/60 font-mono-quiet pt-0.5">
            {publishedCount} published · {draftCount} drafts · Restrictive editor access active
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onReturnToPublic && (
            <button
              onClick={onReturnToPublic}
              className="px-3 py-2 border border-black/20 hover:border-black text-xs font-mono-quiet text-black/70 hover:text-black transition-colors"
            >
              ← Public View
            </button>
          )}
          <button
            onClick={onAddNewEntry}
            className="px-4 py-2 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 transition-colors"
          >
            + New Entry
          </button>
          <button
            onClick={() => exportArchiveAsJSON(entries, siteSettings)}
            className="px-3 py-2 border border-black/30 hover:border-black text-xs font-mono-quiet text-black transition-colors"
            title="Download archive data backup (JSON)"
          >
            Export Backup (JSON)
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-3 py-2 text-xs font-mono-quiet text-black/50 hover:text-black hover:underline transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Editor Section Navigation Tabs: Entries, Tags, Settings */}
      <div className="border-b border-black/15 my-6 flex flex-wrap items-center justify-between gap-4 font-mono-quiet text-xs">
        <nav className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={() => setActiveTab('entries')}
            className={`py-3 relative transition-colors ${
              activeTab === 'entries'
                ? 'text-black font-medium border-b-2 border-black -mb-px'
                : 'text-black/50 hover:text-black'
            }`}
          >
            Entries ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`py-3 relative transition-colors ${
              activeTab === 'tags'
                ? 'text-black font-medium border-b-2 border-black -mb-px'
                : 'text-black/50 hover:text-black'
            }`}
          >
            Tags ({tags.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 relative transition-colors ${
              activeTab === 'settings'
                ? 'text-black font-medium border-b-2 border-black -mb-px'
                : 'text-black/50 hover:text-black'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Backend & Persistence Status Badge */}
        <div className="flex items-center gap-2 text-[11px] text-black/50 py-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isFirebaseConfigured ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          />
          <span>
            {isFirebaseConfigured
              ? 'Firestore Cloud Sync Active'
              : 'Local Storage Engine (Authoritative)'}
          </span>
        </div>
      </div>

      {/* Tab 1: Entries Management */}
      {activeTab === 'entries' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Success Banner */}
          {deleteSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono-quiet flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span className="font-medium">Success:</span>
                <span>{deleteSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSuccessMsg(null)}
                className="text-emerald-700 hover:underline text-[11px]"
              >
                [Dismiss]
              </button>
            </div>
          )}

          {/* Controls: Search, filters & import/export */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-black/[0.015] p-4 border border-black/10">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries by title, type, description, or ID…"
                className="w-full bg-white border border-black/20 px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono-quiet">
              {/* Type filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-black/40">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-white border border-black/20 px-2 py-1 text-xs text-black focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="work">Works</option>
                  <option value="project">Projects</option>
                  <option value="publication">Publications</option>
                  <option value="note">Notes</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-black/40">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-white border border-black/20 px-2 py-1 text-xs text-black focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>

              {/* Reset to sample entries */}
              <button
                onClick={() => {
                  if (confirm('Reset to initial sample entries? Any newly created entries will be replaced with clean defaults.')) {
                    onResetToSampleEntries();
                  }
                }}
                className="text-xs text-black/50 hover:text-black underline ml-2"
                title="Restore default sample data"
              >
                Reset Defaults
              </button>
            </div>
          </div>

          {/* Table of Entries */}
          <div className="overflow-x-auto border border-black/15 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/15 bg-black/[0.02] text-black/40 font-mono-quiet uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Title / Identifiers</th>
                  <th className="py-3 px-4 font-normal">Type</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Associated Projects</th>
                  <th className="py-3 px-4 font-normal">Tags</th>
                  <th className="py-3 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredEntries.map((entry) => {
                  return (
                    <tr key={entry.id} className="hover:bg-black/[0.015] transition-colors">
                      {/* Title & Slug */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => onSelectEntry(entry.slug)}
                            className="text-left font-editorial text-sm sm:text-base text-black hover:underline block leading-snug"
                          >
                            {entry.title}
                          </button>
                          {entry.titleZh && entry.titleZh !== entry.title && (
                            <div className="text-xs font-editorial text-black/50">
                              {entry.titleZh}
                            </div>
                          )}
                          <div className="text-[10px] font-mono-quiet text-black/40 pt-0.5">
                            ID: <span className="font-mono text-black/60">{entry.id}</span> · slug: <span className="text-black/60">#entry/{entry.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 align-top font-mono-quiet capitalize text-black/70">
                        {entry.type}
                        {entry.isDevelopingWork && (
                          <div className="text-[10px] text-amber-700 italic">
                            [study]
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top font-mono-quiet">
                        <button
                          onClick={() => onToggleStatus(entry.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[11px] transition-colors ${
                            entry.status === 'published'
                              ? 'border-emerald-500/40 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100'
                              : 'border-amber-500/40 text-amber-800 bg-amber-50/50 hover:bg-amber-100'
                          }`}
                          title="Click to toggle status between Published and Draft"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              entry.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          <span className="capitalize">{entry.status}</span>
                        </button>
                      </td>

                      {/* Associated Projects */}
                      <td className="py-3.5 px-4 align-top text-[11px] font-sans text-black/70">
                        {entry.type === 'project' ? (
                          <span className="text-black font-medium italic">Project Entry</span>
                        ) : entry.associatedProjectIds && entry.associatedProjectIds.length > 0 ? (
                          <div className="space-y-1">
                            {entry.associatedProjectIds.map((pid) => (
                              <div key={pid} className="truncate max-w-[180px]">
                                <span className="font-mono-quiet text-[10px] text-black/40">↳ </span>
                                <span className="font-medium text-black">
                                  {entries.find((e) => e.id === pid)?.title || pid}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-black/30 font-mono-quiet">—</span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="py-3.5 px-4 align-top text-[11px] font-mono-quiet text-black/60 max-w-xs">
                        {entry.tagIds && entry.tagIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.tagIds.slice(0, 3).map((tId) => (
                              <span key={tId} className="bg-black/5 px-1.5 py-0.2 rounded text-[10px]">
                                {tags.find((t) => t.id === tId)?.label || tId.replace(/^tag-/, '')}
                              </span>
                            ))}
                            {entry.tagIds.length > 3 && (
                              <span className="text-[10px] text-black/40">
                                +{entry.tagIds.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-black/30">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right space-x-2 font-mono-quiet whitespace-nowrap">
                        <button
                          onClick={() => onSelectEntry(entry.slug)}
                          className="text-black/60 hover:text-black underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="text-black font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setEntryToDelete(entry);
                          }}
                          className="text-red-700/70 hover:text-red-700 underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="p-12 text-center text-sm font-editorial text-black/40 italic">
                No entries match the current search or filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Canonical Tags Section */}
      {activeTab === 'tags' && (
        <EditorTagsSection
          entries={entries}
          tags={tags}
          onSaveTag={onSaveTag}
          onDeleteTag={onDeleteTag}
          onMergeTags={onMergeTags}
          onBatchSaveEntries={onBatchSaveEntries || ((entries) => {})}
          onSelectEntry={onSelectEntry}
          onEditEntry={onEditEntry}
        />
      )}

      {/* Tab 3: Settings Section */}
      {activeTab === 'settings' && (
        <EditorSettingsSection
          siteSettings={siteSettings}
          entries={entries}
          onUpdateSiteSettings={onUpdateSiteSettings}
        />
      )}

      {/* Entry Deletion Confirmation Modal */}
      {entryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white border border-black max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl font-sans">
            <div className="border-b border-black/10 pb-3 flex justify-between items-baseline">
              <div>
                <span className="text-[11px] font-mono-quiet uppercase tracking-wider text-red-700 font-medium">
                  Confirm Entry Deletion
                </span>
                <h3 className="font-editorial text-2xl text-black pt-0.5">
                  Delete “{entryToDelete.title}”?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) {
                    setEntryToDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeleting}
                className="text-xs font-mono-quiet text-black/50 hover:text-black disabled:opacity-40"
              >
                [× Close]
              </button>
            </div>

            {/* Entry Identifiers Card */}
            <div className="bg-black/[0.02] border border-black/15 p-3.5 space-y-1.5 text-xs font-mono-quiet">
              <div className="text-black font-sans font-medium text-sm">
                {entryToDelete.title}
                {entryToDelete.titleZh && (
                  <span className="text-black/50 font-editorial text-xs ml-2">
                    {entryToDelete.titleZh}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-black/60 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Stable ID: <strong className="text-black">{entryToDelete.id}</strong>
                </span>
                <span>
                  Slug: <strong className="text-black">#entry/{entryToDelete.slug}</strong>
                </span>
                <span>
                  Type: <strong className="capitalize text-black">{entryToDelete.type}</strong>
                </span>
                <span>
                  Status: <strong className="capitalize text-black">{entryToDelete.status}</strong>
                </span>
              </div>
            </div>

            <div className="text-xs text-black/75 space-y-2 leading-relaxed">
              <p>
                This action will permanently delete this entry from both public view and the editor archive.
              </p>
              <p className="text-[11px] font-mono-quiet text-black/55">
                • References in related entries, project associations, and tag-linked notes will be cleanly unlinked without breaking other content.
                <br />
                • Uploaded media files that may be referenced or shared will not be deleted.
                <br />
                • Sample content will not be recreated.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs font-mono-quiet flex items-start justify-between">
                <div>
                  <span className="font-bold">Error deleting entry:</span> {deleteError}
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteError(null)}
                  className="text-red-700 hover:underline ml-3 text-[11px]"
                >
                  [Dismiss]
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-black/10 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEntryToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-black/20 text-xs font-mono-quiet text-black/70 hover:border-black hover:text-black transition-colors disabled:opacity-40"
              >
                Cancel (Keep Entry)
              </button>
              <button
                type="button"
                onClick={() => executeDelete(entryToDelete)}
                disabled={isDeleting}
                className={`px-4 py-1.5 text-xs font-mono-quiet font-medium transition-colors ${
                  isDeleting
                    ? 'bg-red-900/60 text-white cursor-wait'
                    : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                {isDeleting ? 'Deleting Entry…' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
