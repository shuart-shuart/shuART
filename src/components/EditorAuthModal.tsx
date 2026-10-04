import React, { useState } from 'react';
import { DESIGNATED_EDITOR_EMAIL } from '../services/storage';

interface EditorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const EditorAuthModal: React.FC<EditorAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState(DESIGNATED_EDITOR_EMAIL);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your editor email address.');
      return;
    }

    // Check if designated account
    if (email.trim().toLowerCase() !== DESIGNATED_EDITOR_EMAIL.toLowerCase()) {
      setError(`Access is restricted to designated editor (${DESIGNATED_EDITOR_EMAIL}).`);
      return;
    }

    onSuccess(email.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full border border-black/20 bg-white p-8 space-y-6 shadow-sm">
        <div className="space-y-1">
          <div className="text-xs font-mono-quiet text-black/40 uppercase tracking-wider">
            Private Access
          </div>
          <h2 className="font-editorial text-2xl text-black">
            Hong Shu-ying Archive Editor
          </h2>
          <p className="text-xs text-black/60 font-sans leading-relaxed">
            Restricted editing console for updating entries, managing drafts, uploading documentation, and curating connections.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4 font-sans text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-mono-quiet text-black/60">
              Designated Editor Account
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none font-mono-quiet"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono-quiet text-black/60">
              Session Passcode (Optional for preview)
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Leave blank or enter session key"
              className="w-full border border-black/20 focus:border-black px-3 py-2 text-sm text-black focus:outline-none font-mono-quiet"
            />
          </div>

          {error && (
            <p className="text-xs font-mono-quiet text-rose-700 bg-rose-50 p-2 border border-rose-200">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono-quiet text-black/50 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-xs font-mono-quiet hover:bg-black/80 transition-colors"
            >
              Sign In as Editor
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-black/10 text-[11px] font-mono-quiet text-black/45 space-y-1">
          <p>Designated editor: <span className="text-black font-medium">{DESIGNATED_EDITOR_EMAIL}</span></p>
          <p>Unpublished drafts and editing controls remain hidden from public visitors.</p>
        </div>
      </div>
    </div>
  );
};
