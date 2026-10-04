import React, { useState, useMemo } from 'react';
import { Entry, Tag } from '../../types';
import { slugify } from '../../services/wiki';

interface EditorTagsSectionProps {
  entries: Entry[];
  tags: Tag[];
  onSaveTag: (tag: Tag) => Promise<Tag[]> | void;
  onDeleteTag: (tagId: string) => Promise<void> | void;
  onMergeTags: (sourceTagId: string, targetTagId: string) => Promise<void> | void;
  onBatchSaveEntries: (updatedEntries: Entry[]) => Promise<void> | void;
  onSelectEntry: (slugOrId: string) => void;
  onEditEntry: (entry: Entry) => void;
}

export const EditorTagsSection: React.FC<EditorTagsSectionProps> = ({
  entries,
  tags,
  onSaveTag,
  onDeleteTag,
  onMergeTags,
  onBatchSaveEntries,
  onSelectEntry,
  onEditEntry,
}) => {
  const [searchTag, setSearchTag] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // New Tag State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagId, setNewTagId] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagLinkedNoteId, setNewTagLinkedNoteId] = useState('');

  // Edit / Rename State
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagLabel, setEditTagLabel] = useState('');
  const [editTagDescription, setEditTagDescription] = useState('');
  const [editTagLinkedNoteId, setEditTagLinkedNoteId] = useState('');

  // Merge State
  const [isMerging, setIsMerging] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [showMergeConfirmation, setShowMergeConfirmation] = useState(false);

  // Quick associate state
  const [entryToAssociateId, setEntryToAssociateId] = useState('');

  // Status message & loading
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Note entries available for linking
  const noteEntries = useMemo(() => {
    return entries.filter((e) => e.type === 'note');
  }, [entries]);

  // Tag stats: compute entries count (total, published, draft) for each tag
  const tagStats = useMemo(() => {
    const map = new Map<string, { total: number; published: number; draft: number }>();

    entries.forEach((entry) => {
      (entry.tagIds || []).forEach((tId) => {
        const current = map.get(tId) || { total: 0, published: 0, draft: 0 };
        current.total += 1;
        if (entry.status === 'published') current.published += 1;
        else current.draft += 1;
        map.set(tId, current);
      });
    });

    return map;
  }, [entries]);

  // Filtered tags based on search
  const filteredTags = useMemo(() => {
    if (!searchTag.trim()) return tags;
    const q = searchTag.toLowerCase();
    return tags.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tags, searchTag]);

  // Active tag object
  const activeTag = useMemo(() => {
    if (selectedTagId) {
      return tags.find((t) => t.id === selectedTagId) || null;
    }
    return filteredTags.length > 0 ? filteredTags[0] : null;
  }, [tags, selectedTagId, filteredTags]);

  // Entries associated with active tag
  const activeTagEntries = useMemo(() => {
    if (!activeTag) return [];
    return entries.filter((e) => (e.tagIds || []).includes(activeTag.id));
  }, [entries, activeTag]);

  // Entries NOT associated with active tag
  const unassociatedEntries = useMemo(() => {
    if (!activeTag) return [];
    return entries.filter((e) => !(e.tagIds || []).includes(activeTag.id));
  }, [entries, activeTag]);

  // Entries affected by pending merge
  const mergeAffectedEntries = useMemo(() => {
    if (!mergeSourceId) return [];
    return entries.filter((e) => (e.tagIds || []).includes(mergeSourceId));
  }, [entries, mergeSourceId]);

  // Start creating new tag
  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setNewTagLabel('');
    setNewTagId('');
    setNewTagDescription('');
    setNewTagLinkedNoteId('');
  };

  const handleNewTagLabelChange = (val: string) => {
    setNewTagLabel(val);
    setNewTagId('tag-' + slugify(val));
  };

  const handleSaveNewTag = async () => {
    const trimmedLabel = newTagLabel.trim().toLowerCase();
    if (!trimmedLabel) return;
    const trimmedId = newTagId.trim() || ('tag-' + slugify(trimmedLabel));

    if (tags.some((t) => t.id === trimmedId)) {
      setStatusMessage(`A tag with ID "${trimmedId}" already exists.`);
      return;
    }

    setIsProcessing(true);
    const newTag: Tag = {
      id: trimmedId,
      label: trimmedLabel,
      description: newTagDescription.trim() || undefined,
      linkedNoteId: newTagLinkedNoteId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveTag(newTag);
      setSelectedTagId(newTag.id);
      setIsCreatingNew(false);
      setStatusMessage(`Created tag "${newTag.label}".`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error creating tag: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start editing active tag
  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditTagLabel(tag.label);
    setEditTagDescription(tag.description || '');
    setEditTagLinkedNoteId(tag.linkedNoteId || '');
  };

  const handleSaveEditTag = async () => {
    if (!editingTagId) return;
    const trimmedLabel = editTagLabel.trim().toLowerCase();
    if (!trimmedLabel) return;

    const existing = tags.find((t) => t.id === editingTagId);
    if (!existing) return;

    setIsProcessing(true);
    const updatedTag: Tag = {
      ...existing,
      label: trimmedLabel,
      description: editTagDescription.trim() || undefined,
      linkedNoteId: editTagLinkedNoteId || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveTag(updatedTag);
      setEditingTagId(null);
      setStatusMessage(`Renamed tag to "${updatedTag.label}". Associations preserved with ID "${updatedTag.id}".`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error saving tag: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start merge dialog
  const handleStartMerge = (sourceTag: Tag) => {
    setMergeSourceId(sourceTag.id);
    setMergeTargetId('');
    setShowMergeConfirmation(false);
    setIsMerging(true);
  };

  // Confirm and execute merge
  const handleExecuteMerge = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) return;

    setIsProcessing(true);
    try {
      await onMergeTags(mergeSourceId, mergeTargetId);
      setStatusMessage(`Successfully merged "${mergeSourceId}" into "${mergeTargetId}".`);
      setIsMerging(false);
      setShowMergeConfirmation(false);
      setSelectedTagId(mergeTargetId);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage(`Error merging tags: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove tag association from entry
  const handleRemoveTagFromEntry = async (entry: Entry) => {
    if (!activeTag) return;
    setIsProcessing(true);

    const updatedTagIds = (entry.tagIds || []).filter((id) => id !== activeTag.id);
    const updatedSubjects = (entry.subjects || []).filter(
      (s) => s.toLowerCase() !== activeTag.label.toLowerCase()
    );

    const updatedEntry: Entry = {
      ...entry,
      tagIds: updatedTagIds,
      subjects: updatedSubjects,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onBatchSaveEntries([updatedEntry]);
      setStatusMessage(`Removed tag "${activeTag.label}" from "${entry.title}".`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error removing tag: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add tag association to entry
  const handleAddTagToEntry = async () => {
    if (!activeTag || !entryToAssociateId) return;
    const entry = entries.find((e) => e.id === entryToAssociateId);
    if (!entry) return;

    setIsProcessing(true);
    const currentTagIds = entry.tagIds || [];
    const currentSubjects = entry.subjects || [];

    const updatedTagIds = currentTagIds.includes(activeTag.id)
      ? currentTagIds
      : [...currentTagIds, activeTag.id];
    const updatedSubjects = currentSubjects.some(
      (s) => s.toLowerCase() === activeTag.label.toLowerCase()
    )
      ? currentSubjects
      : [...currentSubjects, activeTag.label];

    const updatedEntry: Entry = {
      ...entry,
      tagIds: updatedTagIds,
      subjects: updatedSubjects,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onBatchSaveEntries([updatedEntry]);
      setStatusMessage(`Added tag "${activeTag.label}" to "${entry.title}".`);
      setEntryToAssociateId('');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error adding tag: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Status banner */}
      {statusMessage && (
        <div className="p-3 bg-black text-white text-xs font-mono-quiet flex justify-between items-center">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-white/60 hover:text-white ml-4 text-[11px]"
          >
            [Close ×]
          </button>
        </div>
      )}

      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/10">
        <div>
          <h2 className="font-editorial text-2xl text-black">
            Canonical Tags Management ({tags.length})
          </h2>
          <p className="text-xs text-black/60 font-mono-quiet">
            Unified tag and subject system. Entries reference stable tag IDs. Tags may link to concept notes.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="px-4 py-2 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 transition-colors shrink-0"
        >
          + Create New Tag
        </button>
      </div>

      {/* Create New Tag Modal / Section */}
      {isCreatingNew && (
        <div className="p-6 border border-black bg-black/[0.02] space-y-4">
          <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
            <h3 className="font-editorial text-lg text-black font-medium">
              Create New Canonical Tag
            </h3>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-xs font-mono-quiet text-black/50 hover:text-black"
            >
              [Cancel ×]
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Display Label *
              </label>
              <input
                type="text"
                value={newTagLabel}
                onChange={(e) => handleNewTagLabelChange(e.target.value)}
                placeholder="e.g. transcription"
                className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-sm text-black focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Stable Tag ID (used in entries) *
              </label>
              <input
                type="text"
                value={newTagId}
                onChange={(e) => setNewTagId(e.target.value)}
                placeholder="e.g. tag-transcription"
                className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-xs font-mono-quiet text-black focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono-quiet text-black/60">
              Description / Scope Definition (optional)
            </label>
            <input
              type="text"
              value={newTagDescription}
              onChange={(e) => setNewTagDescription(e.target.value)}
              placeholder="e.g. Transcription as embodied close looking and hand-copied texts."
              className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-sm text-black focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono-quiet text-black/60">
              Optional Linked Note Entry (Vocabulary / Concept Note)
            </label>
            <select
              value={newTagLinkedNoteId}
              onChange={(e) => setNewTagLinkedNoteId(e.target.value)}
              className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-xs font-mono-quiet text-black focus:outline-none bg-white"
            >
              <option value="">— No linked note (associated entries shown alone) —</option>
              {noteEntries.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} (ID: {n.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsCreatingNew(false)}
              className="px-3 py-1.5 border border-black/30 text-xs font-mono-quiet hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewTag}
              disabled={isProcessing || !newTagLabel.trim()}
              className="px-4 py-1.5 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 disabled:opacity-50"
            >
              Save Tag
            </button>
          </div>
        </div>
      )}

      {/* Merge Tags Dialog */}
      {isMerging && (
        <div className="p-6 border border-black bg-amber-50/50 space-y-4">
          <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
            <h3 className="font-editorial text-lg text-black font-medium">
              Merge Tags
            </h3>
            <button
              onClick={() => setIsMerging(false)}
              className="text-xs font-mono-quiet text-black/50 hover:text-black"
            >
              [Cancel ×]
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Source Tag (will be replaced and deleted)
              </label>
              <select
                value={mergeSourceId}
                onChange={(e) => {
                  setMergeSourceId(e.target.value);
                  setShowMergeConfirmation(false);
                }}
                className="w-full border border-black/20 px-3 py-1.5 text-xs font-mono-quiet bg-white text-black focus:outline-none"
              >
                <option value="">— Select source tag —</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Target Tag (will receive all associations)
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => {
                  setMergeTargetId(e.target.value);
                  setShowMergeConfirmation(false);
                }}
                className="w-full border border-black/20 px-3 py-1.5 text-xs font-mono-quiet bg-white text-black focus:outline-none"
              >
                <option value="">— Select destination tag —</option>
                {tags
                  .filter((t) => t.id !== mergeSourceId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.id})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Merge Preview */}
          {mergeSourceId && mergeTargetId && (
            <div className="p-4 bg-white border border-black/15 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono-quiet font-medium text-black">
                  Preview Affected Entries ({mergeAffectedEntries.length})
                </span>
                <span className="text-[11px] font-mono-quiet text-black/50">
                  Tag ID "{mergeSourceId}" will be replaced with "{mergeTargetId}"
                </span>
              </div>

              {mergeAffectedEntries.length > 0 ? (
                <ul className="divide-y divide-black/10 text-xs font-sans max-h-48 overflow-y-auto">
                  {mergeAffectedEntries.map((e) => (
                    <li key={e.id} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-editorial font-medium text-black">{e.title}</span>
                        <span className="text-[10px] font-mono-quiet text-black/40 ml-2 capitalize">
                          ({e.type})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-quiet text-black/60 uppercase">
                        {e.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs font-mono-quiet text-black/40 italic">
                  No entries currently reference source tag "{mergeSourceId}".
                </p>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setIsMerging(false)}
                  className="px-3 py-1.5 border border-black/30 text-xs font-mono-quiet"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteMerge}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-red-700 text-white text-xs font-mono-quiet hover:bg-red-800 disabled:opacity-50"
                >
                  Confirm & Execute Merge
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tag List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search box */}
          <input
            type="text"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            placeholder="Search tags by label or ID…"
            className="w-full border border-black/20 focus:border-black px-3.5 py-2 text-xs font-sans text-black focus:outline-none"
          />

          <div className="border border-black/15 divide-y divide-black/10 max-h-[600px] overflow-y-auto bg-white">
            {filteredTags.map((tag) => {
              const stats = tagStats.get(tag.id) || { total: 0, published: 0, draft: 0 };
              const isSelected = activeTag?.id === tag.id;
              const hasLinkedNote = Boolean(tag.linkedNoteId);

              return (
                <div
                  key={tag.id}
                  onClick={() => {
                    setSelectedTagId(tag.id);
                    setEditingTagId(null);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-black text-white' : 'hover:bg-black/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-editorial text-base capitalize font-medium">
                      {tag.label}
                    </span>
                    <span
                      className={`text-[11px] font-mono-quiet ${
                        isSelected ? 'text-white/70' : 'text-black/50'
                      }`}
                    >
                      {stats.total} {stats.total === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[10px] font-mono-quiet pt-1 ${
                      isSelected ? 'text-white/60' : 'text-black/40'
                    }`}
                  >
                    <span>ID: {tag.id}</span>
                    {hasLinkedNote && (
                      <>
                        <span>·</span>
                        <span className={isSelected ? 'text-amber-300' : 'text-amber-800'}>
                          Note linked
                        </span>
                      </>
                    )}
                  </div>

                  {tag.description && (
                    <p
                      className={`text-xs line-clamp-1 mt-1 font-serif italic ${
                        isSelected ? 'text-white/80' : 'text-black/60'
                      }`}
                    >
                      {tag.description}
                    </p>
                  )}
                </div>
              );
            })}

            {filteredTags.length === 0 && (
              <div className="p-8 text-center text-xs font-mono-quiet text-black/40 italic">
                No tags match search.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tag Details & Entry Associations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTag ? (
            <div className="p-6 border border-black/15 bg-white space-y-6">
              {/* Tag header & actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-3 pb-4 border-b border-black/10">
                <div>
                  <div className="text-[10px] font-mono-quiet text-black/40 uppercase tracking-wider">
                    Tag Details · ID: {activeTag.id}
                  </div>
                  <h3 className="font-editorial text-3xl text-black capitalize">
                    {activeTag.label}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(activeTag)}
                    className="px-3 py-1 border border-black/30 hover:border-black text-xs font-mono-quiet transition-colors"
                  >
                    Rename / Edit
                  </button>
                  <button
                    onClick={() => handleStartMerge(activeTag)}
                    className="px-3 py-1 border border-black/30 hover:border-black text-xs font-mono-quiet transition-colors"
                  >
                    Merge Tag…
                  </button>
                </div>
              </div>

              {/* Inline Edit Form */}
              {editingTagId === activeTag.id && (
                <div className="p-4 border border-black/20 bg-black/[0.02] space-y-4">
                  <div className="text-xs font-mono-quiet font-medium text-black">
                    Edit Tag Display Label & Linked Note
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono-quiet text-black/60">
                      Display Label (Changing preserves all associations & does not rename linked note)
                    </label>
                    <input
                      type="text"
                      value={editTagLabel}
                      onChange={(e) => setEditTagLabel(e.target.value)}
                      className="w-full border border-black/20 px-3 py-1.5 text-sm text-black focus:outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono-quiet text-black/60">
                      Description / Scope Definition
                    </label>
                    <input
                      type="text"
                      value={editTagDescription}
                      onChange={(e) => setEditTagDescription(e.target.value)}
                      className="w-full border border-black/20 px-3 py-1.5 text-sm text-black focus:outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono-quiet text-black/60">
                      Linked Note Entry
                    </label>
                    <select
                      value={editTagLinkedNoteId}
                      onChange={(e) => setEditTagLinkedNoteId(e.target.value)}
                      className="w-full border border-black/20 px-3 py-1.5 text-xs font-mono-quiet text-black bg-white focus:outline-none"
                    >
                      <option value="">— No linked note (associated entries shown alone) —</option>
                      {noteEntries.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title} (ID: {n.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingTagId(null)}
                      className="px-3 py-1 border border-black/30 text-xs font-mono-quiet"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEditTag}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-black text-white text-xs font-mono-quiet hover:bg-black/85"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Tag Metadata summary */}
              <div className="space-y-2 text-xs font-sans text-black/75">
                {activeTag.description && (
                  <p className="font-serif italic text-sm text-black/85">
                    "{activeTag.description}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono-quiet text-[11px] text-black/50">
                  <span>Stable ID: <strong>{activeTag.id}</strong></span>
                  <span>·</span>
                  <span>
                    Linked Note:{' '}
                    {activeTag.linkedNoteId ? (
                      <button
                        onClick={() => onSelectEntry(activeTag.linkedNoteId!)}
                        className="underline text-black font-medium hover:text-black/80"
                      >
                        {entries.find((e) => e.id === activeTag.linkedNoteId)?.title || activeTag.linkedNoteId}
                      </button>
                    ) : (
                      <em>None</em>
                    )}
                  </span>
                </div>
              </div>

              {/* Associated Entries list */}
              <div className="space-y-4 pt-4 border-t border-black/10">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                    Associated Entries ({activeTagEntries.length})
                  </h4>
                  <span className="text-[11px] font-mono-quiet text-black/40">
                    Entries containing {activeTag.id} in tagIds
                  </span>
                </div>

                {activeTagEntries.length > 0 ? (
                  <ul className="divide-y divide-black/10 border border-black/10 max-h-72 overflow-y-auto">
                    {activeTagEntries.map((e) => (
                      <li
                        key={e.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-black/[0.015]"
                      >
                        <div className="space-y-0.5 truncate">
                          <button
                            onClick={() => onSelectEntry(e.slug)}
                            className="text-left font-editorial text-sm sm:text-base text-black hover:underline block truncate"
                          >
                            {e.title}
                          </button>
                          <div className="text-[10px] font-mono-quiet text-black/45 flex items-center gap-2">
                            <span className="capitalize">{e.type}</span>
                            <span>·</span>
                            <span className={e.status === 'published' ? 'text-emerald-700' : 'text-amber-700'}>
                              {e.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onEditEntry(e)}
                            className="text-xs font-mono-quiet text-black/60 hover:text-black underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveTagFromEntry(e)}
                            disabled={isProcessing}
                            className="text-xs font-mono-quiet text-red-700 hover:underline"
                            title="Remove tag from this entry"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-mono-quiet text-black/40 italic p-4 border border-dashed border-black/15 text-center">
                    No entries currently associated with this tag.
                  </p>
                )}

                {/* Associate another entry */}
                {unassociatedEntries.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={entryToAssociateId}
                      onChange={(e) => setEntryToAssociateId(e.target.value)}
                      className="flex-1 border border-black/20 px-2.5 py-1.5 text-xs font-mono-quiet text-black bg-white focus:outline-none"
                    >
                      <option value="">— Associate an unassigned entry… —</option>
                      {unassociatedEntries.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title} ({e.type} · {e.status})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddTagToEntry}
                      disabled={isProcessing || !entryToAssociateId}
                      className="px-3 py-1.5 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 disabled:opacity-50 shrink-0"
                    >
                      + Associate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-mono-quiet text-black/40 italic border border-dashed border-black/15">
              Select a tag from the left column to view details, rename, or merge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
