import React, { useState } from 'react';
import { Entry } from '../types';

/**
 * Token types for safe formatted text rendering
 */
type FormattedToken =
  | { type: 'text'; content: string }
  | { type: 'title'; content: string }
  | { type: 'link'; label: string; url: string; isInternalEntry?: boolean; targetSlug?: string };

/**
 * Parses structured text safely without executing arbitrary HTML or scripts.
 * Supports:
 * - `<span class="title-style">...</span>` and `[title:...]` for Title-style text
 * - `[label](url)` for markdown hyperlinks
 * - `[[target|label]]` and `[[target]]` for wikilinks
 */
export function parseFormattedText(text: string, allEntries?: Entry[]): FormattedToken[] {
  if (!text) return [];

  const tokens: FormattedToken[] = [];
  let cursor = 0;

  // Combined regex targeting:
  // 1. Title style: <span class="title-style">...</span> or [title:...]
  // 2. Markdown link: [label](url)
  // 3. Wikilink: [[target|label]] or [[target]]
  const masterRegex = /(?:<span\s+class="title-style">([\s\S]*?)<\/span>|\[title:([\s\S]*?)\])|(?:\[([^\]]+)\]\(([^)]+)\))|(?:\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g;

  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(text)) !== null) {
    const matchIndex = match.index;

    // Push preceding plain text
    if (matchIndex > cursor) {
      tokens.push({
        type: 'text',
        content: text.substring(cursor, matchIndex),
      });
    }

    if (match[1] !== undefined || match[2] !== undefined) {
      // Title style match
      const titleContent = match[1] !== undefined ? match[1] : match[2];
      tokens.push({
        type: 'title',
        content: titleContent,
      });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // Markdown link: [label](url)
      const label = match[3];
      const rawUrl = match[4].trim();

      // Check if URL matches an entry ID or slug
      const foundEntry = allEntries?.find(
        (e) =>
          e.slug.toLowerCase() === rawUrl.toLowerCase() ||
          e.id.toLowerCase() === rawUrl.toLowerCase() ||
          e.title.toLowerCase() === rawUrl.toLowerCase() ||
          rawUrl === `#entry/${e.slug}` ||
          rawUrl === `#entry/${e.id}`
      );

      tokens.push({
        type: 'link',
        label,
        url: rawUrl,
        isInternalEntry: Boolean(foundEntry),
        targetSlug: foundEntry ? foundEntry.slug : undefined,
      });
    } else if (match[5] !== undefined) {
      // Wikilink: [[target|label]]
      const targetIdentifier = match[5].trim();
      const label = match[6] ? match[6].trim() : targetIdentifier;

      const foundEntry = allEntries?.find(
        (e) =>
          e.id.toLowerCase() === targetIdentifier.toLowerCase() ||
          e.slug.toLowerCase() === targetIdentifier.toLowerCase() ||
          e.title.toLowerCase() === targetIdentifier.toLowerCase() ||
          (e.titleZh && e.titleZh.toLowerCase() === targetIdentifier.toLowerCase())
      );

      tokens.push({
        type: 'link',
        label: foundEntry ? (match[6] ? label : foundEntry.title) : label,
        url: foundEntry ? `#entry/${foundEntry.slug}` : `#entry/${targetIdentifier}`,
        isInternalEntry: Boolean(foundEntry),
        targetSlug: foundEntry ? foundEntry.slug : undefined,
      });
    }

    cursor = masterRegex.lastIndex;
  }

  // Push remaining plain text
  if (cursor < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(cursor),
    });
  }

  return tokens;
}

/**
 * Safely renders formatted text with dotted hyperlinks and title-style typography
 */
export function renderFormattedText(
  text: string,
  options?: {
    allEntries?: Entry[];
    onSelectEntry?: (slugOrId: string) => void;
    className?: string;
  }
): React.ReactNode {
  if (!text) return null;

  const tokens = parseFormattedText(text, options?.allEntries);

  return (
    <span className={options?.className}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return <React.Fragment key={index}>{token.content}</React.Fragment>;
        }

        if (token.type === 'title') {
          return (
            <span
              key={index}
              className="font-editorial text-[1.14em] tracking-tight font-normal text-black inline leading-snug"
            >
              {token.content}
            </span>
          );
        }

        if (token.type === 'link') {
          // Internal entry link handler
          if (token.targetSlug && options?.onSelectEntry) {
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  options.onSelectEntry!(token.targetSlug!);
                }}
                className="inline text-black font-medium underline underline-offset-[3px] decoration-dotted decoration-black/60 hover:decoration-solid hover:text-black focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer"
                title={`Open entry: ${token.label}`}
              >
                {token.label}
              </button>
            );
          }

          // Hash route link or normal URL
          const isExternal =
            token.url.startsWith('http://') ||
            token.url.startsWith('https://') ||
            token.url.startsWith('mailto:');

          return (
            <a
              key={index}
              href={token.url}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (token.url.startsWith('#entry/') && options?.onSelectEntry) {
                  e.preventDefault();
                  const slug = token.url.replace('#entry/', '');
                  options.onSelectEntry(slug);
                }
              }}
              className="inline text-black font-medium underline underline-offset-[3px] decoration-dotted decoration-black/60 hover:decoration-solid hover:text-black focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer"
            >
              {token.label}
            </a>
          );
        }

        return null;
      })}
    </span>
  );
}

/**
 * Text selection manipulation helper for Title Style
 */
export function toggleTitleStyleAtSelection(
  currentText: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
  const openTag = '<span class="title-style">';
  const closeTag = '</span>';

  // If no selection, insert placeholder
  if (selectionStart === selectionEnd) {
    const placeholder = 'Title text';
    const before = currentText.substring(0, selectionStart);
    const after = currentText.substring(selectionStart);
    const wrapped = `${openTag}${placeholder}${closeTag}`;
    return {
      newText: `${before}${wrapped}${after}`,
      newSelectionStart: selectionStart + openTag.length,
      newSelectionEnd: selectionStart + openTag.length + placeholder.length,
    };
  }

  const selected = currentText.substring(selectionStart, selectionEnd);
  const before = currentText.substring(0, selectionStart);
  const after = currentText.substring(selectionEnd);

  // Check if selected text is already wrapped
  if (selected.startsWith(openTag) && selected.endsWith(closeTag)) {
    const unwrapped = selected.slice(openTag.length, -closeTag.length);
    return {
      newText: `${before}${unwrapped}${after}`,
      newSelectionStart: selectionStart,
      newSelectionEnd: selectionStart + unwrapped.length,
    };
  }

  // Check if surrounding text wraps this selection
  const beforeOpen = before.endsWith(openTag);
  const afterClose = after.startsWith(closeTag);
  if (beforeOpen && afterClose) {
    const newBefore = before.slice(0, -openTag.length);
    const newAfter = after.slice(closeTag.length);
    return {
      newText: `${newBefore}${selected}${newAfter}`,
      newSelectionStart: selectionStart - openTag.length,
      newSelectionEnd: selectionEnd - openTag.length,
    };
  }

  // Wrap selection in Title style
  const wrapped = `${openTag}${selected}${closeTag}`;
  return {
    newText: `${before}${wrapped}${after}`,
    newSelectionStart: selectionStart,
    newSelectionEnd: selectionStart + wrapped.length,
  };
}

/**
 * Text selection manipulation helper for Hyperlinks
 */
export function applyLinkAtSelection(
  currentText: string,
  selectionStart: number,
  selectionEnd: number,
  url: string,
  customLabel?: string
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
  const before = currentText.substring(0, selectionStart);
  const after = currentText.substring(selectionEnd);
  const selected = currentText.substring(selectionStart, selectionEnd);

  const label = (customLabel || selected || 'link').trim();

  // If url is empty, remove link formatting if selected text was a link
  if (!url.trim()) {
    return {
      newText: `${before}${label}${after}`,
      newSelectionStart: selectionStart,
      newSelectionEnd: selectionStart + label.length,
    };
  }

  const cleanUrl = url.trim();
  const linkMarkdown = `[${label}](${cleanUrl})`;

  return {
    newText: `${before}${linkMarkdown}${after}`,
    newSelectionStart: selectionStart,
    newSelectionEnd: selectionStart + linkMarkdown.length,
  };
}

/**
 * Compact toolbar for text inputs and textareas that enables:
 * - [Title Style] toggle
 * - [Add Link] popup with external URL input or internal entry picker
 */
interface FormattedFieldToolbarProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  allEntries?: Entry[];
  className?: string;
}

export const FormattedFieldToolbar: React.FC<FormattedFieldToolbarProps> = ({
  inputRef,
  value,
  onChange,
  allEntries = [],
  className = '',
}) => {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [savedSelection, setSavedSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  const handleApplyTitle = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;

    const result = toggleTitleStyleAtSelection(value, start, end);
    onChange(result.newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
    }, 10);
  };

  const handleOpenLinkModal = () => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? 0;
    const end = input?.selectionEnd ?? 0;
    const selected = value.substring(start, end);

    setSavedSelection({ start, end });
    setLinkLabel(selected);
    setLinkUrl('');
    setShowLinkPopover(true);
  };

  const handleConfirmLink = () => {
    const input = inputRef.current;
    if (!input) return;

    const result = applyLinkAtSelection(
      value,
      savedSelection.start,
      savedSelection.end,
      linkUrl,
      linkLabel
    );

    onChange(result.newText);
    setShowLinkPopover(false);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
    }, 10);
  };

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono-quiet py-1 ${className}`}>
      <span className="text-[10px] text-black/40 uppercase tracking-wider">Format:</span>

      <button
        type="button"
        onClick={handleApplyTitle}
        className="px-2 py-0.5 border border-black/20 hover:border-black bg-white hover:bg-black/5 text-[11px] font-editorial text-black transition-colors"
        title="Apply or remove Title style to selected text"
      >
        T Title Style
      </button>

      <button
        type="button"
        onClick={handleOpenLinkModal}
        className="px-2 py-0.5 border border-black/20 hover:border-black bg-white hover:bg-black/5 text-[11px] text-black transition-colors"
        title="Add or edit hyperlink for selected text"
      >
        🔗 Link…
      </button>

      {/* Link Popover Dialog */}
      {showLinkPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-black p-5 max-w-md w-full space-y-4 shadow-xl font-sans animate-fadeIn">
            <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
              <h4 className="font-editorial text-base text-black font-medium">
                Insert Hyperlink
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkPopover(false)}
                className="text-xs font-mono-quiet text-black/50 hover:text-black"
              >
                [Cancel ×]
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Link Text (Display Label)
                </label>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Text to display…"
                  className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-sm text-black focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono-quiet text-black/60">
                  Target URL (External URL, e.g. https://… or mailto:…)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.org or #entry/slug"
                  className="w-full border border-black/20 focus:border-black px-3 py-1.5 text-xs font-mono-quiet text-black focus:outline-none"
                />
              </div>

              {/* Internal Entry Quick Picker */}
              {allEntries.length > 0 && (
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-mono-quiet text-black/60">
                    Or Link to an Internal Archive Entry:
                  </label>
                  <select
                    value={linkUrl.startsWith('#entry/') ? linkUrl : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setLinkUrl(e.target.value);
                        if (!linkLabel.trim()) {
                          const chosen = allEntries.find((entry) => `#entry/${entry.slug}` === e.target.value);
                          if (chosen) setLinkLabel(chosen.title);
                        }
                      }
                    }}
                    className="w-full border border-black/20 px-2 py-1 text-xs font-mono-quiet bg-white text-black focus:outline-none"
                  >
                    <option value="">— Choose internal archive entry —</option>
                    {allEntries.map((e) => (
                      <option key={e.id} value={`#entry/${e.slug}`}>
                        {e.title} ({e.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={() => {
                  setLinkUrl('');
                  handleConfirmLink();
                }}
                className="text-xs font-mono-quiet text-red-700 hover:underline"
              >
                Remove Link
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkPopover(false)}
                  className="px-3 py-1 border border-black/30 text-xs font-mono-quiet hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLink}
                  className="px-4 py-1 bg-black text-white text-xs font-mono-quiet hover:bg-black/85"
                >
                  Apply Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
