import React, { useState, useRef, useId } from 'react';
import { Entry } from '../../types';
import {
  toggleTitleStyle,
  applyHyperlink,
  removeHyperlink,
  renderFormattedText,
} from '../../services/formatting';

interface FormattedFieldProps {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  allEntries?: Entry[];
  className?: string;
}

export const FormattedField: React.FC<FormattedFieldProps> = ({
  label,
  helperText,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  required = false,
  allEntries = [],
  className = '',
}) => {
  const fieldId = useId();
  const [showPreview, setShowPreview] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isInternalEntryLink, setIsInternalEntryLink] = useState(false);
  const [selectedEntrySlug, setSelectedEntrySlug] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Capture selection from input/textarea
  const updateSelection = () => {
    if (inputRef.current) {
      setSelectionRange({
        start: inputRef.current.selectionStart || 0,
        end: inputRef.current.selectionEnd || 0,
      });
    }
  };

  const handleTitleClick = () => {
    const el = inputRef.current;
    const start = el ? el.selectionStart || 0 : selectionRange.start;
    const end = el ? el.selectionEnd || 0 : selectionRange.end;

    const result = toggleTitleStyle(value, start, end);
    onChange(result.newText);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 20);
  };

  const handleOpenLinkModal = () => {
    const el = inputRef.current;
    const start = el ? el.selectionStart || 0 : selectionRange.start;
    const end = el ? el.selectionEnd || 0 : selectionRange.end;
    setSelectionRange({ start, end });

    const selectedSnippet = value.slice(start, end);
    const linkMatch = selectedSnippet.match(/^\[((?:\[title\][\s\S]*?\[\/title\]|[^\]])+)\]\(((?:[^()]|\([^()]*\))+)\)$/);

    if (linkMatch) {
      setLinkText(linkMatch[1]);
      const existingUrl = linkMatch[2];
      setLinkUrl(existingUrl);
      if (existingUrl.startsWith('#entry/') || existingUrl.startsWith('entry/')) {
        setIsInternalEntryLink(true);
        setSelectedEntrySlug(existingUrl.replace(/^#?entry\//, ''));
      } else {
        setIsInternalEntryLink(false);
      }
    } else {
      setLinkText(selectedSnippet || '');
      setLinkUrl('');
      setIsInternalEntryLink(false);
      setSelectedEntrySlug(allEntries[0]?.slug || '');
    }

    setIsLinkModalOpen(true);
  };

  const handleApplyLink = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalUrl = isInternalEntryLink ? `#entry/${selectedEntrySlug}` : linkUrl.trim();
    if (!finalUrl) return;

    const result = applyHyperlink(
      value,
      selectionRange.start,
      selectionRange.end,
      finalUrl,
      linkText.trim() || undefined
    );

    onChange(result.newText);
    setIsLinkModalOpen(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 20);
  };

  const handleRemoveLink = () => {
    const result = removeHyperlink(value, selectionRange.start, selectionRange.end);
    onChange(result.newText);
    setIsLinkModalOpen(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 20);
  };

  // Determine if selection has title tag or link
  const selectedSubstring = value.slice(selectionRange.start, selectionRange.end);
  const isSelectionTitle =
    selectedSubstring.startsWith('[title]') && selectedSubstring.endsWith('[/title]');
  const isSelectionLink = /^\[((?:\[title\][\s\S]*?\[\/title\]|[^\]])+)\]\(((?:[^()]|\([^()]*\))+)\)$/.test(selectedSubstring);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Toolbar Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {label && (
          <label htmlFor={fieldId} className="block text-xs font-mono-quiet text-black/70 font-medium">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}

        {/* Quiet formatting toolbar */}
        <div className="flex items-center gap-1 text-[11px] font-mono-quiet bg-black/[0.03] p-0.5 border border-black/10">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={handleTitleClick}
            className={`px-2 py-0.5 rounded-none transition-colors flex items-center gap-1 ${
              isSelectionTitle
                ? 'bg-black text-white'
                : 'text-black/80 hover:bg-black/10'
            }`}
            title="Select text and toggle Title Style (site title typography)"
          >
            <span className="font-editorial italic font-serif font-bold text-xs">T</span>
            <span>Title Style</span>
          </button>

          <span className="text-black/20">|</span>

          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={handleOpenLinkModal}
            className={`px-2 py-0.5 rounded-none transition-colors flex items-center gap-1 ${
              isSelectionLink
                ? 'bg-black text-white'
                : 'text-black/80 hover:bg-black/10'
            }`}
            title="Add or edit hyperlink (external URL or internal archive entry)"
          >
            <span>🔗</span>
            <span>Link</span>
          </button>

          <span className="text-black/20">|</span>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-1.5 py-0.5 rounded-none transition-colors ${
              showPreview ? 'bg-black text-white' : 'text-black/60 hover:text-black'
            }`}
            title="Toggle rendered typography preview"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {helperText && (
        <div className="text-[11px] font-mono-quiet text-black/45 pb-0.5">
          {helperText}
        </div>
      )}

      {/* Editor or Preview */}
      {showPreview ? (
        <div className="p-3 bg-black/[0.02] border border-black/20 min-h-[60px] text-sm text-black font-sans leading-relaxed">
          {value ? (
            renderFormattedText(value, { allEntries })
          ) : (
            <span className="text-black/40 italic font-mono-quiet text-xs">
              (Empty text)
            </span>
          )}
        </div>
      ) : multiline ? (
        <textarea
          id={fieldId}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onClick={updateSelection}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className="w-full p-2.5 border border-black/20 focus:border-black text-sm text-black focus:outline-none font-sans leading-relaxed transition-colors"
        />
      ) : (
        <input
          id={fieldId}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onClick={updateSelection}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-1.5 border border-black/20 focus:border-black text-sm text-black focus:outline-none font-sans transition-colors"
        />
      )}

      {/* Link Configuration Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-black max-w-md w-full p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
              <h4 className="font-editorial text-xl text-black">
                {isSelectionLink ? 'Edit Hyperlink' : 'Add Hyperlink'}
              </h4>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-xs font-mono-quiet text-black/50 hover:text-black"
              >
                [× Close]
              </button>
            </div>

            <div role="group" aria-label="Hyperlink settings" onKeyDown={e => { if (e.key === 'Enter') handleApplyLink(e); }} className="space-y-4 text-xs">
              {/* Display text */}
              <div className="space-y-1">
                <label className="block font-mono-quiet text-black/70">
                  Link Text / Anchor *
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. read the essay"
                  className="w-full border border-black/20 px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none"
                  required
                />
              </div>

              {/* Destination Type Toggle */}
              <div className="space-y-1">
                <label className="block font-mono-quiet text-black/70">
                  Link Destination Type:
                </label>
                <div className="flex items-center gap-4 pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-mono-quiet">
                    <input
                      type="radio"
                      name="linkType"
                      checked={!isInternalEntryLink}
                      onChange={() => setIsInternalEntryLink(false)}
                    />
                    <span>External URL</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-mono-quiet">
                    <input
                      type="radio"
                      name="linkType"
                      checked={isInternalEntryLink}
                      onChange={() => setIsInternalEntryLink(true)}
                    />
                    <span>Internal Archive Entry</span>
                  </label>
                </div>
              </div>

              {/* External URL Input */}
              {!isInternalEntryLink ? (
                <div className="space-y-1">
                  <label className="block font-mono-quiet text-black/70">
                    Target URL (https://…)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.org/publication"
                    className="w-full border border-black/20 px-3 py-1.5 text-xs text-black focus:border-black focus:outline-none font-mono-quiet"
                    required={!isInternalEntryLink}
                  />
                  <p className="text-[10px] text-black/40 font-mono-quiet">
                    External links open safely in a new tab with security attributes.
                  </p>
                </div>
              ) : (
                /* Internal Entry Picker */
                <div className="space-y-1">
                  <label className="block font-mono-quiet text-black/70">
                    Select Internal Entry:
                  </label>
                  <select
                    value={selectedEntrySlug}
                    onChange={(e) => setSelectedEntrySlug(e.target.value)}
                    className="w-full border border-black/20 px-2 py-1.5 text-xs text-black focus:border-black focus:outline-none font-mono-quiet bg-white"
                  >
                    {allEntries.map((e) => (
                      <option key={e.id} value={e.slug}>
                        {e.title} ({e.type}) — #entry/{e.slug}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-black/40 font-mono-quiet">
                    Links internally without refreshing page (#entry/{selectedEntrySlug}).
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-black/10">
                {isSelectionLink ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="text-xs text-red-700 hover:underline font-mono-quiet"
                  >
                    Remove Hyperlink
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-3 py-1 text-xs font-mono-quiet text-black/60 hover:text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyLink}
                    className="px-4 py-1.5 bg-black text-white text-xs font-mono-quiet hover:bg-black/85"
                  >
                    Apply Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
