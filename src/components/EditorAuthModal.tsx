import React, { useState } from 'react';
import { ArchiveBundle, connectGitHub, disconnectGitHub } from '../services/githubPublishing';

interface Props { isOpen: boolean; onClose: () => void; onSuccess: (bundle: ArchiveBundle, sha: string) => void; }
export const EditorAuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const close = () => { setToken(''); setError(''); onClose(); };
  async function connect(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const submittedToken = token; setToken('');
    try {
      const snapshot = await connectGitHub(submittedToken);
      onSuccess(snapshot.bundle, snapshot.sha);
      onClose();
    } catch (e) { disconnectGitHub(); setError(e instanceof Error ? e.message : 'Could not connect to GitHub.'); }
    finally { setBusy(false); }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="github-editor-title" className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-lg w-full border border-black/20 bg-white p-8 space-y-5">
        <h2 id="github-editor-title" className="font-editorial text-2xl">Connect GitHub editor</h2>
        <p className="text-sm text-black/70">Edit shuART and publish directly to your GitHub repository.</p>
        <ol className="list-decimal pl-5 space-y-2 text-xs text-black/70">
          <li>Create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4">fine-grained GitHub token</a> with a short expiry.</li>
          <li>Select resource owner <strong>shuart-shuart</strong>, only the <strong>shuART</strong> repository, and repository permission <strong>Contents: Read and write</strong>.</li>
          <li>Paste it below. It is sent only to GitHub and kept in memory until you disconnect, refresh, or close this page.</li>
        </ol>
        <p className="text-xs text-black/60">Do not paste the token into ChatGPT or commit it to the repository.</p>
        <form onSubmit={connect} className="space-y-4">
          <label className="block text-xs space-y-2">GitHub token
            <input type="password" autoComplete="off" spellCheck={false} value={token} onChange={e => setToken(e.target.value)} className="w-full border border-black/30 px-3 py-2 text-sm" required disabled={busy} />
          </label>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-between gap-4">
            <button type="button" onClick={close} disabled={busy} className="text-xs underline">Cancel</button>
            <button disabled={busy} className="px-4 py-2 bg-black text-white text-xs disabled:opacity-50">{busy ? 'Connecting…' : 'Connect GitHub'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
