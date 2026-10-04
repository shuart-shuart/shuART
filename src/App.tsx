import { ArchiveBundle } from './services/githubPublishing';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Entry, ViewMode, SiteSettings, Tag } from './types';
import {
  fetchEntries,
  fetchSiteSettings,
  fetchTags,
  saveEntry,
  saveEntriesBatch,
  deleteEntryById,
  updateSiteSettings,
  saveTag,
  deleteTagById,
  mergeTags,
  getEditorAuthState,
  setEditorAuthState,
  DEFAULT_SITE_SETTINGS,
  PUBLISHED_ARCHIVE,
  beginGitHubEditorSession,
  saveDraftArchive,
  getLocalTags,
} from './services/storage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { IndexView } from './components/IndexView';
import { TagView } from './components/TagView';
import { AboutView } from './components/AboutView';
import { EntryDetail } from './components/EntryDetail';
import { EditorView } from './components/EditorView';
import { EditorAuthModal } from './components/EditorAuthModal';
import { EntryEditorModal } from './components/EntryEditorModal';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [currentView, setCurrentView] = useState<ViewMode>('index');
  const [selectedEntrySlug, setSelectedEntrySlug] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication state
  const [isEditorLoggedIn, setIsEditorLoggedIn] = useState<boolean>(() => {
    return getEditorAuthState().isAuthenticated;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Editor Modal state
  const [isEntryEditorModalOpen, setIsEntryEditorModalOpen] = useState(false);
  const [entryBeingEdited, setEntryBeingEdited] = useState<Entry | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    async function initData() {
      try {
        const [loadedEntries, loadedSettings, loadedTags] = await Promise.all([
          fetchEntries(),
          fetchSiteSettings(),
          fetchTags(),
        ]);
        setEntries(loadedEntries);
        setSiteSettings(loadedSettings);
        setTags(loadedTags);
      } catch (err) {
        console.error('Failed to initialize archive data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Filter entries visible to user:
  // Public visitors see published entries only; Editor sees all entries.
  const visibleEntries = useMemo(() => {
    if (isEditorLoggedIn) {
      return entries;
    }
    return entries.filter((e) => e.status === 'published');
  }, [entries, isEditorLoggedIn]);

  // List of only published entries (strictly used for public Wander selection)
  const publishedEntries = useMemo(() => {
    return entries.filter((e) => e.status === 'published');
  }, [entries]);

  const handleSelectEntry = useCallback((slugOrId: string) => {
    const target = entries.find(
      (e) =>
        e.slug.toLowerCase() === slugOrId.toLowerCase() ||
        e.id.toLowerCase() === slugOrId.toLowerCase() ||
        e.title.toLowerCase() === slugOrId.toLowerCase()
    );

    if (target) {
      // If target is draft and user is not logged in as editor, do not show
      if (target.status === 'draft' && !isEditorLoggedIn) {
        setSelectedEntrySlug(null);
        setSelectedTagId(null);
        setCurrentView('entry');
        window.location.hash = `#entry/${slugOrId}`;
        return;
      }

      setSelectedEntrySlug(target.slug);
      setSelectedTagId(null);
      setCurrentView('entry');
      window.location.hash = `#entry/${target.slug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSelectedEntrySlug(slugOrId);
      setSelectedTagId(null);
      setCurrentView('entry');
      window.location.hash = `#entry/${slugOrId}`;
    }
  }, [entries, isEditorLoggedIn]);

  const handleSelectTag = useCallback((tagIdOrLabel: string) => {
    const norm = tagIdOrLabel.trim();
    const matched = tags.find(
      (t) => t.id === norm || t.label.toLowerCase() === norm.toLowerCase() || t.id === 'tag-' + norm
    );
    const targetId = matched ? matched.id : norm.startsWith('tag-') ? norm : 'tag-' + norm;

    setSelectedTagId(targetId);
    setSelectedEntrySlug(null);
    setCurrentView('tag');
    window.location.hash = `#tag/${targetId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tags]);

  // Random entry wanderer: Strictly chooses from published entries
  const handleRandomWander = useCallback(() => {
    if (!siteSettings.showWander && !isEditorLoggedIn) {
      // Wander is disabled by site settings for public visitors
      return;
    }

    const pool = publishedEntries.filter((e) => e.slug !== selectedEntrySlug);
    const candidates = pool.length > 0 ? pool : publishedEntries;

    if (candidates.length === 0) return;
    const randomOne = candidates[Math.floor(Math.random() * candidates.length)];
    handleSelectEntry(randomOne.slug);
  }, [siteSettings.showWander, isEditorLoggedIn, publishedEntries, selectedEntrySlug, handleSelectEntry]);

  // URL Hash Routing with Show Wander protection & redirects
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash || hash === 'index') {
        setCurrentView('index');
        setSelectedEntrySlug(null);
        setSelectedTagId(null);
      } else if (hash === 'works') {
        // Redirect legacy #works to index
        setCurrentView('index');
        setSelectedEntrySlug(null);
        setSelectedTagId(null);
        window.location.hash = '#index';
      } else if (hash === 'ss') {
        // Redirect legacy #ss route to the SS project entry
        handleSelectEntry('ss-between-books-and-libraries');
      } else if (hash === 'about') {
        setCurrentView('about');
        setSelectedEntrySlug(null);
        setSelectedTagId(null);
      } else if (hash === 'wander') {
        // Direct route to Wander: check if Wander is enabled or user is editor
        if (siteSettings.showWander || isEditorLoggedIn) {
          handleRandomWander();
        } else {
          // Direct public access to wander route is blocked when Show Wander is off
          setCurrentView('index');
          setSelectedEntrySlug(null);
          setSelectedTagId(null);
          window.location.hash = '';
        }
      } else if (hash === 'editor') {
        if (isEditorLoggedIn) {
          setCurrentView('editor');
          setSelectedEntrySlug(null);
          setSelectedTagId(null);
        } else {
          setIsAuthModalOpen(true);
        }
      } else if (hash.startsWith('entry/')) {
        const slug = hash.replace('entry/', '');
        setSelectedEntrySlug(slug);
        setSelectedTagId(null);
        setCurrentView('entry');
      } else if (hash.startsWith('tag/')) {
        const tagId = hash.replace('tag/', '');
        setSelectedTagId(tagId);
        setSelectedEntrySlug(null);
        setCurrentView('tag');
      } else if (hash.startsWith('subject/')) {
        // Redirect old subject route to canonical tag route
        const subj = hash.replace('subject/', '');
        const tagId = 'tag-' + subj.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        setSelectedTagId(tagId);
        setSelectedEntrySlug(null);
        setCurrentView('tag');
        window.location.hash = `#tag/${tagId}`;
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, [isEditorLoggedIn, siteSettings.showWander, handleRandomWander, handleSelectEntry]);

  const navigateToView = (view: ViewMode) => {
    setCurrentView(view);
    setSelectedEntrySlug(null);
    setSelectedTagId(null);
    window.location.hash = view === 'index' ? '' : `#${view}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterBySubject = (subject: string) => {
    setSelectedSubject(subject);
    navigateToView('index');
  };

  // Auth actions
  const handleEditorLoginSuccess = (bundle: ArchiveBundle, sha: string) => {
    const draft = beginGitHubEditorSession(bundle, sha);
    setEntries(draft.entries);
    setTags(draft.tags);
    setSiteSettings(draft.settings);
    setIsEditorLoggedIn(true);
    setCurrentView('editor');
    window.location.hash = '#editor';
  };

  const handleEditorSignOut = () => {
    setIsEditorLoggedIn(false);
    setEditorAuthState(false);
    setEntries(PUBLISHED_ARCHIVE.entries);
    setTags(PUBLISHED_ARCHIVE.tags);
    setSiteSettings(PUBLISHED_ARCHIVE.settings);
    if (currentView === 'editor') {
      navigateToView('index');
    }
  };

  // Entry CRUD handlers
  const handleCreateNewEntry = () => {
    setEntryBeingEdited(null);
    setIsEntryEditorModalOpen(true);
  };

  const handleEditEntry = (entry: Entry) => {
    setEntryBeingEdited(entry);
    setIsEntryEditorModalOpen(true);
  };

  const handleSaveEntry = async (savedEntry: Entry) => {
    const updated = await saveEntry(savedEntry, entries);
    setEntries(updated);

    // Keep entryBeingEdited synchronized
    if (entryBeingEdited && entryBeingEdited.id === savedEntry.id) {
      setEntryBeingEdited(savedEntry);
    }

    // Keep URL and selectedEntrySlug in sync if currently viewing this entry
    if (selectedEntrySlug) {
      const isCurrentViewedEntry =
        savedEntry.id.toLowerCase() === selectedEntrySlug.toLowerCase() ||
        savedEntry.slug.toLowerCase() === selectedEntrySlug.toLowerCase() ||
        (entryBeingEdited && entryBeingEdited.slug.toLowerCase() === selectedEntrySlug.toLowerCase());

      if (isCurrentViewedEntry) {
        setSelectedEntrySlug(savedEntry.slug);
        window.location.hash = `#entry/${savedEntry.slug}`;
      }
    }
  };

  const handleBatchSaveEntries = async (updatedBatch: Entry[]) => {
    const updated = await saveEntriesBatch(updatedBatch, entries);
    setEntries(updated);
  };

  const handleDeleteEntry = async (id: string) => {
    const updated = await deleteEntryById(id, entries);
    setEntries(updated);
    setTags(getLocalTags());
    if (selectedEntrySlug && entries.find((e) => e.id === id)?.slug === selectedEntrySlug) {
      navigateToView('index');
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;

    const updatedEntry: Entry = {
      ...target,
      status: target.status === 'published' ? 'draft' : 'published',
      updatedAt: new Date().toISOString(),
    };

    const updated = await saveEntry(updatedEntry, entries);
    setEntries(updated);
  };

  // Tag CRUD handlers
  const handleSaveTag = async (tag: Tag) => {
    const updated = await saveTag(tag, tags);
    setTags(updated);
    return updated;
  };

  const handleDeleteTag = async (tagId: string) => {
    const result = await deleteTagById(tagId, tags, entries);
    setTags(result.tags);
    setEntries(result.entries);
  };

  const handleMergeTags = async (sourceTagId: string, targetTagId: string) => {
    const result = await mergeTags(sourceTagId, targetTagId, tags, entries);
    setTags(result.tags);
    setEntries(result.entries);
  };

  const handleUpdateSiteSettings = async (newSettings: SiteSettings) => {
    await updateSiteSettings(newSettings);
    setSiteSettings(newSettings);
  };

  const handleImportArchive = (bundle: ArchiveBundle) => {
    saveDraftArchive(bundle);
    setEntries(bundle.entries); setTags(bundle.tags); setSiteSettings(bundle.settings);
  };

  // Resolve current active entry for EntryDetail view
  const currentActiveEntry = useMemo(() => {
    if (!selectedEntrySlug) return null;
    const target = entries.find(
      (e) =>
        e.slug.toLowerCase() === selectedEntrySlug.toLowerCase() ||
        e.id.toLowerCase() === selectedEntrySlug.toLowerCase()
    );

    // If draft and not editor, block viewing
    if (target && target.status === 'draft' && !isEditorLoggedIn) {
      return null;
    }
    return target || null;
  }, [entries, selectedEntrySlug, isEditorLoggedIn]);

  // Resolve current active tag for TagView
  const currentActiveTag = useMemo(() => {
    if (!selectedTagId) return null;
    const found = tags.find(
      (t) =>
        t.id.toLowerCase() === selectedTagId.toLowerCase() ||
        t.label.toLowerCase() === selectedTagId.toLowerCase() ||
        t.id.toLowerCase() === ('tag-' + selectedTagId).toLowerCase()
    );
    if (found) return found;
    // Fallback tag object if not in canonical tags list yet
    return {
      id: selectedTagId,
      label: selectedTagId.replace(/^tag-/, '').replace(/-/g, ' '),
    };
  }, [tags, selectedTagId]);

  // Resolve linked note for the active tag (must be published unless editor)
  const currentLinkedNote = useMemo(() => {
    if (!currentActiveTag || !currentActiveTag.linkedNoteId) return null;
    const note = entries.find((e) => e.id === currentActiveTag.linkedNoteId);
    if (!note) return null;
    if (note.status === 'draft' && !isEditorLoggedIn) return null;
    return note;
  }, [currentActiveTag, entries, isEditorLoggedIn]);

  // Associated published entries for the active tag (excludes drafts for public visitors)
  const tagAssociatedEntries = useMemo(() => {
    if (!currentActiveTag) return [];
    return visibleEntries.filter((e) => {
      const hasTagId = e.tagIds?.includes(currentActiveTag.id);
      const hasSubject = e.subjects?.some(
        (s) =>
          s.toLowerCase() === currentActiveTag.label.toLowerCase() ||
          s.toLowerCase() === currentActiveTag.id.replace(/^tag-/, '').toLowerCase()
      );
      return hasTagId || hasSubject;
    });
  }, [currentActiveTag, visibleEntries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 font-mono-quiet text-xs text-black/50">
        Loading Hong Shu-ying archive…
      </div>
    );
  }

  const typographyClass = siteSettings.typography === 'c' ? 'font-combo-c' : 'font-combo-a';

  return (
    <div className={`min-h-screen bg-white text-[#111111] flex flex-col justify-between selection:bg-black selection:text-white ${typographyClass}`}>
      <div>
        {/* Main Site Header */}
        <Header
          currentView={currentView}
          onNavigateView={navigateToView}
          onRandomWander={handleRandomWander}
          showWander={siteSettings.showWander}
          navOrder={siteSettings.navOrder}
        />

        {/* Primary Page Views */}
        <main>
          {currentView === 'index' && (
            <IndexView
              entries={visibleEntries}
              tags={tags}
              onSelectEntry={handleSelectEntry}
              selectedSubject={selectedSubject}
              onClearSubjectFilter={() => setSelectedSubject(null)}
              onFilterBySubject={handleFilterBySubject}
              onSelectTag={handleSelectTag}
            />
          )}

          {currentView === 'about' && (
            <AboutView
              siteSettings={siteSettings}
              allEntries={visibleEntries}
              onNavigateView={navigateToView}
            />
          )}

          {currentView === 'tag' && currentActiveTag && (
            <TagView
              tag={currentActiveTag}
              linkedNote={currentLinkedNote}
              associatedEntries={tagAssociatedEntries}
              allEntries={visibleEntries}
              onSelectEntry={handleSelectEntry}
              onSelectTag={handleSelectTag}
              onNavigateBack={() => navigateToView('index')}
            />
          )}

          {currentView === 'entry' && currentActiveEntry && (
            <EntryDetail
              entry={currentActiveEntry}
              allEntries={visibleEntries}
              tags={tags}
              onSelectEntry={handleSelectEntry}
              onFilterBySubject={handleFilterBySubject}
              onSelectTag={handleSelectTag}
              onNavigateBack={() => navigateToView('index')}
              onRandomWander={handleRandomWander}
              showWander={siteSettings.showWander}
              isEditorLoggedIn={isEditorLoggedIn}
              onEditEntry={handleEditEntry}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {currentView === 'entry' && !currentActiveEntry && (
            <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
              <h2 className="font-editorial text-2xl text-black">Entry not found</h2>
              <p className="text-sm font-sans text-black/60 leading-relaxed">
                The requested entry may have been moved, unpublished, or is a draft under review.
              </p>
              <button
                onClick={() => navigateToView('index')}
                className="text-xs font-mono-quiet underline text-black"
              >
                Return to archive index →
              </button>
            </div>
          )}

          {currentView === 'editor' && isEditorLoggedIn && (
            <EditorView
              entries={entries}
              tags={tags}
              siteSettings={siteSettings}
              onArchivePublished={(bundle) => {
                setEntries(bundle.entries); setTags(bundle.tags); setSiteSettings(bundle.settings);
              }}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              onAddNewEntry={handleCreateNewEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onToggleStatus={handleToggleStatus}
              onSelectEntry={handleSelectEntry}
              onImportArchive={handleImportArchive}
              onSaveEntry={handleSaveEntry}
              onBatchSaveEntries={handleBatchSaveEntries}
              onSaveTag={handleSaveTag}
              onDeleteTag={handleDeleteTag}
              onMergeTags={handleMergeTags}
              onSignOut={handleEditorSignOut}
              onReturnToPublic={() => navigateToView('index')}
            />
          )}
        </main>
      </div>

      {/* Main Site Footer */}
      <Footer
        siteSettings={siteSettings}
        onNavigateView={navigateToView}
      />

      {/* Editor Sign In Modal */}
      <EditorAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleEditorLoginSuccess}
      />

      {/* Entry Editor Modal */}
      {isEntryEditorModalOpen && (
        <EntryEditorModal
          key={entryBeingEdited ? `edit-${entryBeingEdited.id}-${entryBeingEdited.updatedAt || ''}` : 'new-entry'}
          isOpen={isEntryEditorModalOpen}
          entryToEdit={entryBeingEdited}
          allEntries={entries}
          tags={tags}
          onClose={() => {
            setIsEntryEditorModalOpen(false);
            setEntryBeingEdited(null);
          }}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
