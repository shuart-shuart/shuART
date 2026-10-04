import React, { useState } from 'react';
import type { Entry, SiteSettings, Tag } from '../../types';
import { ArchiveBundle, DRAFT_BASE_KEY, REPOSITORY, publishArchive, readRepositoryArchive, validateArchive } from '../../services/githubPublishing';
import { exportArchiveAsJSON, getDraftArchive, replaceGitHubDraft, getLegacyBrowserArchive, saveDraftArchive } from '../../services/storage';

interface Props { entries: Entry[]; tags: Tag[]; settings: SiteSettings; onPublished: (bundle: ArchiveBundle) => void; }
export const GitHubPublishPanel: React.FC<Props> = ({entries, tags, settings, onPublished}) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [commit, setCommit] = useState('');
  async function publish() {
    setBusy(true); setMessage('Publishing content and media…'); setCommit('');
    try {
      const result = await publishArchive({version:3,entries,tags,settings}, localStorage.getItem(DRAFT_BASE_KEY) || '');
      setCommit(result.commitSha);
      onPublished(result.bundle);
      try { replaceGitHubDraft(result.bundle, result.contentSha); }
      catch { setMessage('Committed to GitHub, but the browser draft could not be updated. Export your draft and reload repository content before editing further.'); return; }
      setMessage(result.changed ? 'Committed to GitHub. The public site updates after its deployment finishes.' : 'No content changes to publish.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Publishing failed. Your draft is retained.'); }
    finally { setBusy(false); }
  }
  function importLegacy() {
    try {
      const legacy = getLegacyBrowserArchive();
      if (!legacy) { setMessage('No previous browser draft was found on this device. You can import a JSON backup in the Entries tab.'); return; }
      validateArchive(legacy);
      if (!window.confirm('Replace the current draft with your previous browser edits? Export your current draft first if you want to keep it.')) return;
      saveDraftArchive(legacy); onPublished(legacy); setMessage('Previous browser draft imported. Review it, then Publish to GitHub.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not import the previous browser draft.'); }
  }
  async function reload() {
    if (!window.confirm('Replace this browser’s draft with current repository content? Export a backup first if you want to keep local changes.')) return;
    setBusy(true); setMessage('Loading repository content…');
    try { const snapshot = await readRepositoryArchive(); replaceGitHubDraft(snapshot.bundle,snapshot.sha); onPublished(snapshot.bundle); setMessage('Repository content loaded.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not reload repository content.'); }
    finally { setBusy(false); }
  }
  return (
    <section className="my-6 p-5 border border-black/20 space-y-3">
      {busy && <div role="dialog" aria-modal="true" aria-label="GitHub publishing in progress" className="fixed inset-0 z-[100] bg-white/95 flex items-center justify-center"><p className="font-editorial text-xl">{message}</p></div>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="font-editorial text-xl">GitHub publishing</h2><p className="text-xs text-black/60">Save edits to your draft first, then publish them together.</p></div>
        <button onClick={publish} disabled={busy} className="px-4 py-2 bg-black text-white text-xs disabled:opacity-50">{busy ? 'Working…' : 'Publish to GitHub'}</button>
      </div>
      <p className="text-xs text-black/60">Only entries marked Published are committed to GitHub. Draft entries and review notes stay in this browser and your exported backup. The repository is public, so publish only content you intend to share. Uploaded images and PDFs for published entries are added to public/media when you publish. Limit each file to 2 MB; link videos externally.</p>
      <div className="flex flex-wrap gap-4 text-xs">
        <button disabled={busy} onClick={() => { const draft = getDraftArchive(); exportArchiveAsJSON(draft.entries, draft.settings); }} className="underline decoration-dotted">Export draft backup</button>
        <button disabled={busy} onClick={importLegacy} className="underline decoration-dotted">Import previous browser draft</button>
        <button disabled={busy} onClick={reload} className="underline decoration-dotted">Reload repository content</button>
        <a href={`https://github.com/${REPOSITORY}/actions`} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">Deployment status</a>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {commit && <a href={`https://github.com/${REPOSITORY}/commit/${commit}`} target="_blank" rel="noopener noreferrer" className="text-xs underline decoration-dotted">View GitHub commit</a>}
    </section>
  );
};
