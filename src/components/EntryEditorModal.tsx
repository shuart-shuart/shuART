import React, { useState, useEffect, useMemo } from 'react';
import {
  Entry,
  EntryType,
  EntryStatus,
  ContentBlock,
  Tag,
  EntryCredit,
  PresentationRecord,
  CreditRole,
} from '../types';
import { slugify } from '../services/wiki';
import { getEntryBlocks, syncEntryFromBlocks } from '../services/blockUtils';
import { getLocalTags, saveTag } from '../services/storage';
import { BlockEditorItem } from './editor/BlockEditorItem';
import { FormattedField } from './editor/FormattedField';

interface EntryEditorModalProps {
  isOpen: boolean;
  entryToEdit: Entry | null;
  allEntries: Entry[];
  tags?: Tag[];
  onClose: () => void;
  onSave: (entry: Entry) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const EntryEditorModal: React.FC<EntryEditorModalProps> = ({
  isOpen,
  entryToEdit,
  allEntries,
  tags: propTags,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !entryToEdit;

  // Stable ID: strictly uses entryToEdit.id for existing entries, or generated ID for new entries
  const [newEntryId] = useState(
    () => 'entry-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)
  );
  const targetId = entryToEdit ? entryToEdit.id : newEntryId;

  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [titleZh, setTitleZh] = useState(entryToEdit?.titleZh || '');
  // Slug is stable; editing title does NOT change slug for existing entries
  const [slug, setSlug] = useState(entryToEdit?.slug || '');
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(Boolean(entryToEdit?.slug));

  const [type, setType] = useState<EntryType>(() => {
    if (!entryToEdit) return 'work';
    const t = entryToEdit.type as any;
    if (t === 'term' || t === 'subject') return 'note';
    if (['work', 'project', 'publication', 'note'].includes(t)) return t;
    return 'note';
  });
  const [status, setStatus] = useState<EntryStatus>(entryToEdit?.status || 'published');
  const [date, setDate] = useState(entryToEdit?.date || '');
  const [datePlaceholder, setDatePlaceholder] = useState(entryToEdit?.datePlaceholder || false);
  const [medium, setMedium] = useState(entryToEdit?.medium || '');
  const [dimensions, setDimensions] = useState(entryToEdit?.dimensions || '');
  const [shortDescription, setShortDescription] = useState(entryToEdit?.shortDescription || '');

  // Repeatable credits: role, name, optional link
  const [credits, setCredits] = useState<EntryCredit[]>(() =>
    entryToEdit?.credits ? [...entryToEdit.credits] : []
  );

  // Provenance / Presentation history records
  const [presentationHistory, setPresentationHistory] = useState<PresentationRecord[]>(() =>
    entryToEdit?.presentationHistory ? [...entryToEdit.presentationHistory] : []
  );

  // Modal deletion confirmation state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [modalDeleteError, setModalDeleteError] = useState<string | null>(null);

  // Ordered content blocks sequence
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    if (entryToEdit) {
      return getEntryBlocks(entryToEdit);
    }
    return [
      {
        id: `text-${Date.now()}-1`,
        type: 'text',
        content: '',
      },
    ];
  });

  // Canonical tags
  const [canonicalTags, setCanonicalTags] = useState<Tag[]>(() => propTags && propTags.length > 0 ? propTags : getLocalTags());
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    if (entryToEdit?.tagIds && entryToEdit.tagIds.length > 0) {
      return entryToEdit.tagIds;
    }
    if (entryToEdit?.subjects) {
      return entryToEdit.subjects.map((s) => 'tag-' + s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'));
    }
    return [];
  });
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Associated Projects
  const [associatedProjectIds, setAssociatedProjectIds] = useState<string[]>(() => {
    const list = entryToEdit?.associatedProjectIds ? [...entryToEdit.associatedProjectIds] : [];
    if (entryToEdit?.collections?.includes('ss') && !list.includes('ss-between-books-and-libraries') && entryToEdit.id !== 'ss-between-books-and-libraries') {
      list.push('ss-between-books-and-libraries');
    }
    return list;
  });

  // Explicit relationships pointing to entry IDs
  const [relatedEntryIds, setRelatedEntryIds] = useState<string[]>(entryToEdit?.relatedEntryIds || []);
  const [isDevelopingWork, setIsDevelopingWork] = useState(entryToEdit?.isDevelopingWork || false);
  const [notesForArtist, setNotesForArtist] = useState(entryToEdit?.notesForArtist || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [filterPickerQuery, setFilterPickerQuery] = useState('');

  // Refresh canonical tags on open
  useEffect(() => {
    if (isOpen) {
      setCanonicalTags(propTags && propTags.length > 0 ? propTags : getLocalTags());
    }
  }, [isOpen, propTags]);

  // Keep all form state synchronized when entryToEdit or isOpen changes
  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title || '');
      setTitleZh(entryToEdit.titleZh || '');
      setSlug(entryToEdit.slug || '');
      setHasManuallyEditedSlug(Boolean(entryToEdit.slug));

      const rawType = entryToEdit.type as any;
      if (rawType === 'term' || rawType === 'subject') {
        setType('note');
      } else if (['work', 'project', 'publication', 'note'].includes(rawType)) {
        setType(rawType);
      } else {
        setType('note');
      }

      setStatus(entryToEdit.status || 'published');
      setDate(entryToEdit.date || '');
      setDatePlaceholder(entryToEdit.datePlaceholder || false);
      setMedium(entryToEdit.medium || '');
      setDimensions(entryToEdit.dimensions || '');
      setShortDescription(entryToEdit.shortDescription || '');
      setCredits(entryToEdit.credits ? [...entryToEdit.credits] : []);
      setPresentationHistory(entryToEdit.presentationHistory ? [...entryToEdit.presentationHistory] : []);
      setIsConfirmingDelete(false);
      setModalDeleteError(null);
      setBlocks(getEntryBlocks(entryToEdit));

      // Resolve tagIds
      if (entryToEdit.tagIds && entryToEdit.tagIds.length > 0) {
        setSelectedTagIds(entryToEdit.tagIds);
      } else if (entryToEdit.subjects && entryToEdit.subjects.length > 0) {
        setSelectedTagIds(entryToEdit.subjects.map((s) => 'tag-' + s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')));
      } else {
        setSelectedTagIds([]);
      }

      // Resolve associatedProjectIds
      const projIds = entryToEdit.associatedProjectIds ? [...entryToEdit.associatedProjectIds] : [];
      if (entryToEdit.collections?.includes('ss') && !projIds.includes('ss-between-books-and-libraries') && entryToEdit.id !== 'ss-between-books-and-libraries') {
        projIds.push('ss-between-books-and-libraries');
      }
      setAssociatedProjectIds(projIds);

      setRelatedEntryIds(entryToEdit.relatedEntryIds || []);
      setIsDevelopingWork(entryToEdit.isDevelopingWork || false);
      setNotesForArtist(entryToEdit.notesForArtist || '');
      setValidationError('');
      setSaveSuccessMsg(null);
    } else {
      setTitle('');
      setTitleZh('');
      setSlug('');
      setHasManuallyEditedSlug(false);
      setType('work');
      setStatus('published');
      setDate('');
      setDatePlaceholder(false);
      setMedium('');
      setDimensions('');
      setShortDescription('');
      setCredits([]);
      setPresentationHistory([]);
      setIsConfirmingDelete(false);
      setModalDeleteError(null);
      setBlocks([
        {
          id: `text-${Date.now()}-1`,
          type: 'text',
          content: '',
        },
      ]);
      setSelectedTagIds([]);
      setAssociatedProjectIds([]);
      setRelatedEntryIds([]);
      setIsDevelopingWork(false);
      setNotesForArtist('');
      setValidationError('');
      setSaveSuccessMsg(null);
    }
  }, [entryToEdit, isOpen]);

  // Additional Credits handlers
  const handleAddCredit = () => {
    const newCredit: EntryCredit = {
      id: `credit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'publisher',
      name: '',
      link: '',
    };
    setCredits((prev) => [...prev, newCredit]);
  };

  const handleUpdateCredit = (index: number, updated: Partial<EntryCredit>) => {
    setCredits((prev) => prev.map((c, i) => (i === index ? { ...c, ...updated } : c)));
  };

  const handleRemoveCredit = (index: number) => {
    setCredits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveCredit = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= credits.length) return;
    const copy = [...credits];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setCredits(copy);
  };

  // Presentation History handlers
  const handleAddPresentation = () => {
    const newRecord: PresentationRecord = {
      id: `pres-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'shown',
      attribution: 'curated',
      title: '',
      venue: '',
      location: '',
      date: '',
      curator: '',
      link: '',
      note: '',
    };
    setPresentationHistory((prev) => [...prev, newRecord]);
  };

  const handleUpdatePresentation = (index: number, updated: Partial<PresentationRecord>) => {
    setPresentationHistory((prev) => prev.map((p, i) => (i === index ? { ...p, ...updated } : p)));
  };

  const handleRemovePresentation = (index: number) => {
    setPresentationHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMovePresentation = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= presentationHistory.length) return;
    const copy = [...presentationHistory];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setPresentationHistory(copy);
  };

  const handleModalDelete = async () => {
    if (!entryToEdit || !onDelete) return;
    setIsDeletingModal(true);
    setModalDeleteError(null);
    try {
      await onDelete(entryToEdit.id);
      setIsConfirmingDelete(false);
      onClose();
    } catch (err: any) {
      console.error('Delete in modal failed:', err);
      setModalDeleteError(err?.message || 'Failed to delete entry from storage.');
    } finally {
      setIsDeletingModal(false);
    }
  };

  if (!isOpen) return null;

  // Title change: only update slug automatically if this is a brand new entry and user hasn't typed a custom slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew && !hasManuallyEditedSlug) {
      setSlug(slugify(val));
    }
  };

  // Block management handlers
  const handleAddBlock = (blockType: ContentBlock['type']) => {
    const newId = `block-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let newBlock: ContentBlock;

    switch (blockType) {
      case 'text':
        newBlock = {
          id: newId,
          type: 'text',
          content: '',
        };
        break;
      case 'image_gallery':
        newBlock = {
          id: newId,
          type: 'image_gallery',
          title: '',
          images: [],
          layout: 'stacked',
        };
        break;
      case 'document_reader':
        newBlock = {
          id: newId,
          type: 'document_reader',
          title: 'New Document Reader',
          sourceType: 'pdf',
          pageType: 'individual_pages',
          pages: [],
        };
        break;
      case 'video':
        newBlock = {
          id: newId,
          type: 'video',
          provider: 'youtube',
          originalUrl: '',
          embedUrl: '',
          title: '',
        };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleUpdateBlock = (updatedBlock: ContentBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // SS Collection toggle
  const toggleSSCollection = (checked: boolean) => {
    const ssId = 'ss-between-books-and-libraries';
    if (checked) {
      if (!associatedProjectIds.includes(ssId)) {
        setAssociatedProjectIds([...associatedProjectIds, ssId]);
      }
    } else {
      setAssociatedProjectIds(associatedProjectIds.filter((pid) => pid !== ssId));
    }
  };

  // Toggle canonical tag ID
  const toggleTagId = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Quick add new canonical tag
  const handleAddNewTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const cleanId = 'tag-' + slugify(trimmed);
    const existing = canonicalTags.find((t) => t.id === cleanId || t.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        setSelectedTagIds((prev) => [...prev, existing.id]);
      }
      setNewTagInput('');
      return;
    }

    const newTagObj: Tag = {
      id: cleanId,
      label: trimmed.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTags = await saveTag(newTagObj, canonicalTags);
    setCanonicalTags(updatedTags);
    setSelectedTagIds((prev) => [...prev, cleanId]);
    setNewTagInput('');
  };

  // Toggle associated project ID
  const toggleAssociatedProjectId = (projId: string) => {
    setAssociatedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  // Available project entries for association
  const availableProjects = useMemo(() => {
    return allEntries.filter((e) => e.type === 'project' && e.id !== targetId);
  }, [allEntries, targetId]);

  // Toggle related entry ID
  const toggleRelatedEntry = (relId: string) => {
    if (relatedEntryIds.includes(relId)) {
      setRelatedEntryIds(relatedEntryIds.filter((rid) => rid !== relId));
    } else {
      setRelatedEntryIds([...relatedEntryIds, relId]);
    }
  };

  // Filter available entries for related picker
  const availableEntriesForPicker = allEntries
    .filter((e) => e.id !== targetId)
    .filter((e) => {
      if (!filterPickerQuery.trim()) return true;
      const q = filterPickerQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || (e.titleZh && e.titleZh.toLowerCase().includes(q));
    });

  // Filter canonical tags for tag picker
  const filteredCanonicalTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return canonicalTags;
    const q = tagSearchQuery.toLowerCase();
    return canonicalTags.filter((t) => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }, [canonicalTags, tagSearchQuery]);

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSaveSuccessMsg(null);

    if (!title.trim()) {
      setValidationError('Title is required.');
      return;
    }

    const finalSlug = slug.trim() || slugify(title);
    if (!finalSlug) {
      setValidationError('URL slug is required.');
      return;
    }

    // Check slug uniqueness strictly against OTHER entries
    const slugCollision = allEntries.find(
      (e) => e.slug.toLowerCase() === finalSlug.toLowerCase() && e.id !== targetId
    );
    if (slugCollision) {
      setValidationError(
        `The URL slug "${finalSlug}" is already taken by entry "${slugCollision.title}". Slugs must be unique.`
      );
      return;
    }

    // Derive readable subjects from selectedTagIds
    const tagLookup = new Map<string, string>();
    canonicalTags.forEach((t) => tagLookup.set(t.id, t.label));
    const subjects = selectedTagIds.map((tId) => tagLookup.get(tId) || tId.replace(/^tag-/, '').replace(/-/g, ' '));

    setIsSaving(true);

    try {
      const baseEntry: Entry = {
        id: targetId,
        slug: finalSlug,
        title: title.trim(),
        titleZh: titleZh.trim() || undefined,
        type,
        date: date.trim() || undefined,
        datePlaceholder,
        medium: medium.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        shortDescription: shortDescription.trim(),
        credits: credits.filter((c) => c.name.trim() || c.link?.trim()),
        presentationHistory: presentationHistory.filter(
          (p) => [p.title, p.venue, p.location, p.date, p.curator, p.link, p.note].some(value => value?.trim())
        ),
        fullText: '',
        images: [],
        blocks,
        tagIds: selectedTagIds,
        subjects,
        associatedProjectIds,
        relatedEntryIds,
        status,
        isDevelopingWork,
        notesForArtist: notesForArtist.trim() || undefined,
        createdAt: entryToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Synchronize legacy fullText & images from blocks for search consistency
      const synced = syncEntryFromBlocks(baseEntry, blocks);

      // Perform write to storage
      await onSave(synced);

      // Show "Saved" confirmation only after a successful write
      setSaveSuccessMsg('Saved');
      setIsSaving(false);

      // Gracefully close after confirmation
      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err: any) {
      // Retain unsaved edits and display clear errors when saving fails
      setIsSaving(false);
      setSaveSuccessMsg(null);
      setValidationError('Failed to save entry: ' + (err?.message || 'Storage error'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-black/30 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-black/10 flex justify-between items-baseline shrink-0">
          <div>
            <div className="text-[11px] font-mono-quiet uppercase tracking-wider text-black/40">
              {isNew ? `Create New Archive Entry · ID: ${targetId}` : `Editing Archive Entry · Stable ID: ${targetId}`}
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl text-black">
              {title || 'Untitled Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-sm font-mono-quiet text-black/50 hover:text-black hover:underline disabled:opacity-50"
          >
            [Close ×]
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-mono-quiet flex items-start justify-between">
              <div>
                <span className="font-bold">Error:</span> {validationError}
              </div>
              <button
                type="button"
                onClick={() => setValidationError('')}
                className="text-red-700 hover:underline ml-4 text-[11px]"
              >
                [Dismiss]
              </button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono-quiet flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="font-medium">Saved ✓</span>
                <span className="text-emerald-800">
                  Edits successfully written to storage for entry <span className="font-mono font-medium">{targetId}</span>
                </span>
              </div>
            </div>
          )}

          {/* Section 1: Identity & Metadata */}
          <div className="space-y-4">
            <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black border-b border-black/10 pb-1">
              1. Identity & Core Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Title (English / Primary) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. thank you for your time"
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Chinese Title (optional)
                </label>
                <input
                  type="text"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder="e.g. 笔迹"
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none"
                />
              </div>
            </div>

            {/* Stable URL Slug & Entry Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono-quiet text-black/60">
                    URL Slug (Stable path)
                  </label>
                  <span className="text-[10px] font-mono-quiet text-black/40">
                    Editing title preserves this URL
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-mono-quiet text-black/40 px-2.5 py-2 border border-r-0 border-black/20 bg-black/[0.02]">
                    #entry/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setHasManuallyEditedSlug(true);
                    }}
                    placeholder="stable-url-slug"
                    className="flex-1 border border-black/20 focus:border-black px-3 py-2 text-xs font-mono-quiet text-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Entry Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EntryType)}
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none bg-white font-mono-quiet text-xs"
                >
                  <option value="work">Work</option>
                  <option value="project">Project</option>
                  <option value="publication">Publication</option>
                  <option value="note">Note (concept, vocabulary, study)</option>
                </select>
              </div>
            </div>

            {/* Developing study & Associated Projects */}
            <div className="p-4 border border-black/10 bg-black/[0.015] space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="developingStudy"
                  checked={isDevelopingWork}
                  onChange={(e) => setIsDevelopingWork(e.target.checked)}
                  className="rounded-none border-black/30 text-black focus:ring-0"
                />
                <label htmlFor="developingStudy" className="text-xs text-black/80 font-sans cursor-pointer">
                  <strong>Developing idea or study</strong> (Distinguished from completed artworks in the index; separate from draft/published status)
                </label>
              </div>

              {/* Associated Projects Picker */}
              <div className="pt-2 border-t border-black/10 space-y-2">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono-quiet text-black/70 font-medium">
                    Associated Projects ({associatedProjectIds.length} assigned)
                  </label>
                  <span className="text-[10px] font-mono-quiet text-black/40">
                    Links entry to stable project pages
                  </span>
                </div>

                {type === 'project' ? (
                  <p className="text-xs font-mono-quiet text-black/50 italic bg-white p-2.5 border border-black/10">
                    This entry is a project entry itself. Other works, publications, and notes can be associated with it.
                  </p>
                ) : availableProjects.length > 0 ? (
                  <div className="border border-black/15 p-3 max-h-36 overflow-y-auto space-y-1.5 bg-white">
                    {availableProjects.map((proj) => {
                      const isChecked = associatedProjectIds.includes(proj.id);
                      return (
                        <label
                          key={proj.id}
                          className="flex items-center gap-2.5 text-xs text-black/85 hover:bg-black/[0.02] p-1 cursor-pointer font-sans"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssociatedProjectId(proj.id)}
                            className="rounded-none border-black/30"
                          />
                          <span className="font-editorial text-sm text-black">{proj.title}</span>
                          {proj.titleZh && (
                            <span className="text-xs text-black/50 font-editorial">
                              ({proj.titleZh})
                            </span>
                          )}
                          <span className="text-[10px] font-mono-quiet text-black/40 ml-auto">
                            ID: {proj.id}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-mono-quiet text-black/40 italic">
                    No other projects exist in the archive to associate with.
                  </p>
                )}
              </div>
            </div>

            {/* Date, Medium & Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-mono-quiet text-black/60">
                    Date / Year
                  </label>
                  <label className="text-[10px] font-mono-quiet text-black/50 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={datePlaceholder}
                      onChange={(e) => setDatePlaceholder(e.target.checked)}
                      className="rounded-none"
                    />
                    Placeholder
                  </label>
                </div>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. 2023 or c. 2022"
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none font-mono-quiet"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Medium / Materials
                </label>
                <input
                  type="text"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  placeholder="e.g. Ink on loose paper"
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Dimensions (optional)
                </label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="e.g. 21 × 29.7 cm"
                  className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none font-mono-quiet"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Short Description / Overview *
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary of the work or inquiry for index and cards…"
                className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none font-sans"
              />
            </div>
          </div>

          <section className="space-y-4 pt-4 border-t border-black/10" aria-label="Additional Credits">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider">Additional Credits</h3>
              <button type="button" onClick={handleAddCredit} className="border border-black/30 px-3 py-1 text-xs">+ Add Credit</button>
            </div>
            <p className="text-xs text-black/60">Publishers, collaborators, editors, designers, translators, printers, commissioners, and other contributors.</p>
            {credits.length === 0 && <p className="text-xs text-black/40">No credits added yet.</p>}
            {credits.map((credit, index) => (
              <fieldset key={credit.id} className="border border-black/15 p-4 space-y-3">
                <legend className="text-xs font-mono-quiet">Credit {index + 1}</legend>
                <label className="block text-xs">Role
                  <select aria-label={`Credit ${index + 1} role`} value={credit.role} onChange={e => handleUpdateCredit(index, { role: e.target.value as CreditRole })} className="block w-full border border-black/20 p-2 mt-1 bg-white">
                    {Array.from(new Set(['publisher', 'collaborator', 'editor', 'designer', 'translator', 'printer', 'commissioner', 'custom', credit.role])).map(role => <option key={role} value={role}>{role === 'custom' ? 'Other / Custom' : role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
                  </select>
                </label>
                {credit.role === 'custom' && <FormattedField label="Custom Role" value={credit.customRole || ''} onChange={value => handleUpdateCredit(index, { customRole: value })} allEntries={allEntries} />}
                <FormattedField label="Name / Organisation" value={credit.name} onChange={value => handleUpdateCredit(index, { name: value })} allEntries={allEntries} />
                <label className="block text-xs">Link (optional)
                  <input aria-label={`Credit ${index + 1} link`} value={credit.link || ''} onChange={e => handleUpdateCredit(index, { link: e.target.value })} placeholder="https://…" className="block w-full border border-black/20 p-2 mt-1" />
                </label>
                <div className="flex gap-4 text-xs">
                  <button type="button" aria-label={`Move credit ${index + 1} up`} disabled={index === 0} onClick={() => handleMoveCredit(index, 'up')} className="disabled:opacity-30">↑ Up</button>
                  <button type="button" aria-label={`Move credit ${index + 1} down`} disabled={index === credits.length - 1} onClick={() => handleMoveCredit(index, 'down')} className="disabled:opacity-30">↓ Down</button>
                  <button type="button" onClick={() => handleRemoveCredit(index)} className="text-red-700">Remove Credit {index + 1}</button>
                </div>
              </fieldset>
            ))}
          </section>

          <section className="space-y-4 pt-4 border-t border-black/10" aria-label="Provenance / Presentation History">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider">Provenance / Presentation History</h3>
              <button type="button" onClick={handleAddPresentation} className="border border-black/30 px-3 py-1 text-xs">+ Add Record</button>
            </div>
            <p className="text-xs text-black/60">Records become sentences using the work title, action, event, venue, year, and attribution. Link the event using the URL below; names can also contain inline hyperlinks.</p>
            {presentationHistory.length === 0 && <p className="text-xs text-black/40">No history records added yet.</p>}
            {presentationHistory.map((record, index) => (
              <fieldset key={record.id} className="border border-black/15 p-4 space-y-3">
                <legend className="text-xs font-mono-quiet">History Record {index + 1}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs">The work was
                    <select aria-label={`History record ${index + 1} action`} value={record.action || 'presented'} onChange={e => handleUpdatePresentation(index, { action: e.target.value as PresentationRecord['action'] })} className="block w-full border border-black/20 p-2 mt-1 bg-white">
                      {['launched', 'commissioned', 'shown', 'screened', 'developed', 'presented'].map(action => <option key={action} value={action}>{action}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs">Attribution
                    <select aria-label={`History record ${index + 1} attribution`} value={record.attribution || 'curated'} onChange={e => handleUpdatePresentation(index, { attribution: e.target.value as PresentationRecord['attribution'] })} className="block w-full border border-black/20 p-2 mt-1 bg-white">
                      {['curated', 'programmed', 'organised'].map(role => <option key={role} value={role}>{role} by</option>)}
                    </select>
                  </label>
                  {([['title', 'Exhibition / Programme / Event'], ['venue', 'Venue / Institution'], ['location', 'Location'], ['date', 'Date / Year'], ['curator', 'Curator / Programmer / Organiser']] as const).map(([key, label]) => (
                    <FormattedField key={key} label={label} value={record[key] || ''} onChange={value => handleUpdatePresentation(index, { [key]: value })} allEntries={allEntries} />
                  ))}
                  <label className="block text-xs">Link (optional)
                    <input aria-label={`History record ${index + 1} link`} value={record.link || ''} onChange={e => handleUpdatePresentation(index, { link: e.target.value })} placeholder="https://…" className="block w-full border border-black/20 p-2 mt-1" />
                  </label>
                </div>
                <FormattedField label="Note (public)" value={record.note || ''} onChange={value => handleUpdatePresentation(index, { note: value })} multiline allEntries={allEntries} />
                <div className="flex gap-4 text-xs">
                  <button type="button" aria-label={`Move history record ${index + 1} up`} disabled={index === 0} onClick={() => handleMovePresentation(index, 'up')} className="disabled:opacity-30">↑ Up</button>
                  <button type="button" aria-label={`Move history record ${index + 1} down`} disabled={index === presentationHistory.length - 1} onClick={() => handleMovePresentation(index, 'down')} className="disabled:opacity-30">↓ Down</button>
                  <button type="button" onClick={() => handleRemovePresentation(index)} className="text-red-700">Remove Record {index + 1}</button>
                </div>
              </fieldset>
            ))}
          </section>

          {/* Section 2: Ordered Content Blocks (Text, Galleries, Document Readers, Videos) */}
          <div className="space-y-5 pt-4 border-t border-black/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-2">
              <div>
                <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                  2. Ordered Content Blocks ({blocks.length})
                </h3>
                <p className="text-[11px] text-black/60 font-sans">
                  Each entry is composed of an ordered sequence of blocks: prose text, documentation galleries, interactive document readers (PDF & page spreads), and video embeds.
                </p>
              </div>

              {/* Add block toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono-quiet text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddBlock('text')}
                  className="px-2.5 py-1 bg-black text-white hover:bg-black/85 text-[11px] transition-colors"
                >
                  + Text
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('image_gallery')}
                  className="px-2.5 py-1 border border-black/30 hover:border-black text-[11px] transition-colors"
                >
                  + Gallery
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('document_reader')}
                  className="px-2.5 py-1 border border-black/30 hover:border-black text-[11px] transition-colors"
                >
                  + Document Reader
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('video')}
                  className="px-2.5 py-1 border border-black/30 hover:border-black text-[11px] transition-colors"
                >
                  + Video
                </button>
              </div>
            </div>

            {/* List of Ordered Block Editors */}
            <div className="space-y-6">
              {blocks.map((block, index) => (
                <BlockEditorItem
                  key={block.id}
                  block={block}
                  index={index}
                  totalBlocks={blocks.length}
                  entryId={targetId}
                  onUpdateBlock={handleUpdateBlock}
                  onMoveBlock={handleMoveBlock}
                  onRemoveBlock={handleRemoveBlock}
                />
              ))}

              {blocks.length === 0 && (
                <div className="p-8 text-center border border-dashed border-black/20 text-xs font-editorial italic text-black/40">
                  No content blocks yet. Use the buttons above to add text, an image gallery, a document reader, or a video embed.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Connections & Taxonomy */}
          <div className="space-y-5 pt-4 border-t border-black/10">
            <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black border-b border-black/10 pb-1">
              3. Canonical Tags & Connections
            </h3>

            {/* Canonical Tags Picker */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-mono-quiet text-black/70 font-medium">
                  Canonical Tags ({selectedTagIds.length} assigned)
                </label>
                <span className="text-[10px] font-mono-quiet text-black/40">
                  Stable ID system with optional linked concept notes
                </span>
              </div>

              {/* Selected Tag Chips */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-black/[0.02] border border-black/10">
                  {selectedTagIds.map((tId) => {
                    const tagObj = canonicalTags.find((t) => t.id === tId);
                    const label = tagObj ? tagObj.label : tId.replace(/^tag-/, '');
                    return (
                      <span
                        key={tId}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black/20 text-xs font-sans text-black"
                      >
                        <span className="font-medium italic">{label}</span>
                        <span className="text-[10px] font-mono-quiet text-black/40">({tId})</span>
                        <button
                          type="button"
                          onClick={() => toggleTagId(tId)}
                          className="text-black/40 hover:text-black font-bold ml-1 text-xs"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Tag search & list */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Search existing canonical tags…"
                  className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-xs text-black focus:outline-none font-sans"
                />

                <div className="border border-black/15 p-3 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white">
                  {filteredCanonicalTags.map((tag) => {
                    const isChecked = selectedTagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className="flex items-start gap-2 text-xs text-black/85 hover:bg-black/[0.02] p-1 cursor-pointer font-sans"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTagId(tag.id)}
                          className="rounded-none border-black/30 mt-0.5"
                        />
                        <div className="truncate">
                          <span className="font-medium italic">{tag.label}</span>
                          {tag.linkedNoteId && (
                            <span className="text-[10px] font-mono-quiet text-black/40 block truncate">
                              note: {tag.linkedNoteId}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Inline Quick Add New Tag */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Create new canonical tag label…"
                    className="flex-1 border border-black/20 focus:border-black px-2.5 py-1 text-xs text-black focus:outline-none font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTag}
                    className="px-3 py-1 bg-black text-white hover:bg-black/80 text-xs font-mono-quiet shrink-0 transition-colors"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Explicit Relationships Picker */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-mono-quiet text-black/70 font-medium">
                  Related Entries Picker ({relatedEntryIds.length} selected)
                </label>
                <span className="text-[10px] font-mono-quiet text-black/40">
                  Points explicitly to Entry IDs for automatic backlinks
                </span>
              </div>

              <input
                type="text"
                value={filterPickerQuery}
                onChange={(e) => setFilterPickerQuery(e.target.value)}
                placeholder="Filter entries in picker…"
                className="w-full border border-black/15 px-2.5 py-1 text-xs text-black focus:border-black focus:outline-none font-mono-quiet"
              />

              <div className="border border-black/15 p-3 max-h-44 overflow-y-auto space-y-1 bg-white">
                {availableEntriesForPicker.map((e) => {
                  const isChecked = relatedEntryIds.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className="flex items-center gap-2.5 text-xs text-black/80 hover:bg-black/[0.02] p-1 cursor-pointer font-sans"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRelatedEntry(e.id)}
                        className="rounded-none border-black/30"
                      />
                      <span className="font-editorial text-sm text-black">{e.title}</span>
                      <span className="text-[10px] font-mono-quiet text-black/40 capitalize">
                        ({e.type} · ID: {e.id})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Publishing & Private Notes */}
          <div className="space-y-4 pt-4 border-t border-black/10">
            <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black border-b border-black/10 pb-1">
              4. Publication & Review
            </h3>

            <div className="flex items-center gap-4">
              <label className="text-xs font-mono-quiet text-black/60">
                Publication Status:
              </label>
              <div className="flex items-center border border-black/20 text-xs font-mono-quiet">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`px-3 py-1 transition-colors ${
                    status === 'published' ? 'bg-black text-white' : 'text-black/60 hover:text-black'
                  }`}
                >
                  Published (Public)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`px-3 py-1 border-l border-black/20 transition-colors ${
                    status === 'draft' ? 'bg-black text-white' : 'text-black/60 hover:text-black'
                  }`}
                >
                  Draft (browser draft only)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono-quiet text-black/60">
                Review notes (browser draft and export backup only)
              </label>
              <input
                type="text"
                value={notesForArtist}
                onChange={(e) => setNotesForArtist(e.target.value)}
                placeholder="e.g. Check page dimension against original archive, verify translation"
                className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-xs text-black focus:outline-none font-mono-quiet"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-6 border-t border-black/10 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-mono-quiet text-black/50 hover:text-black hover:underline disabled:opacity-50"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {saveSuccessMsg && (
                <span className="text-xs font-mono-quiet text-emerald-700 font-medium">
                  ✓ Saved
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving || !!saveSuccessMsg}
                className={`px-6 py-2 text-xs font-mono-quiet font-medium transition-colors ${
                  saveSuccessMsg
                    ? 'bg-emerald-700 text-white cursor-default'
                    : isSaving
                    ? 'bg-black/60 text-white cursor-wait'
                    : 'bg-black text-white hover:bg-black/85'
                }`}
              >
                {isSaving ? 'Saving…' : saveSuccessMsg ? 'Saved ✓' : isNew ? 'Create & Save Entry' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
