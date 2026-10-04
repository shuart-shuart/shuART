import React from 'react';
import { Entry } from '../types';

/**
 * Text formatting specification:
 * 1. Title style: `[title]styled text[/title]`
 *    Rendered with the site's title serif typography (`font-editorial font-serif italic text-black`)
 *    at a scale matching its surrounding context.
 * 2. Hyperlinks: `[Anchor text](url)`
 *    Rendered with a dotted underline, small underline offset, sufficient contrast,
 *    and clear hover/focus states.
 * 3. Wiki links: `[[identifier]]` or `[[identifier|label]]`
 *    Resolves against existing archive entries.
 * 4. Safe rendering:
 *    All plain text is rendered safely as React text nodes without accepting arbitrary HTML.
 */

export interface RenderFormattedOptions {
  disableLinks?: boolean;
  allEntries?: Entry[];
  onSelectEntry?: (slugOrId: string) => void;
  className?: string;
  titleClassName?: string;
  linkClassName?: string;
}

const DEFAULT_LINK_CLASSES =
  'text-black font-medium underline decoration-dotted underline-offset-4 decoration-black/60 hover:decoration-black hover:text-black focus:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors inline cursor-pointer';

const DEFAULT_TITLE_CLASSES =
  'font-editorial font-serif italic tracking-normal text-black font-normal';

/**
 * Parses formatted string containing [title]...[/title], [text](url), and [[wikilink]].
 * Returns safe React nodes with zero innerHTML usage.
 */
export function renderFormattedText(
  text: string | undefined | null,
  options: RenderFormattedOptions = {}
): React.ReactNode {
  if (!text) return null;

  const {
    allEntries = [],
    onSelectEntry,
    titleClassName = DEFAULT_TITLE_CLASSES,
    linkClassName = DEFAULT_LINK_CLASSES,
  } = options;

  // Pattern matches:
  // 1. [title]content[/title]
  // 2. [link text](url)
  // 3. [[wikilink]] or [[wikilink|label]]
  const combinedRegex =
    /\[title\]([\s\S]*?)\[\/title\]|\[((?:\[title\][\s\S]*?\[\/title\]|[^\]])+)\]\(((?:[^()]|\([^()]*\))+)\)|\[\[(.*?)\]\]/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = combinedRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      elements.push(text.substring(lastIndex, matchIndex));
    }

    // Case 1: [title]...[/title]
    if (match[1] !== undefined) {
      const innerContent = match[1];
      // Recursively parse inside title in case it contains links
      elements.push(
        <span key={`title-${keyCounter++}`} className={titleClassName}>
          {renderFormattedText(innerContent, {
            ...options,
            titleClassName: '', // prevent double title styling
          })}
        </span>
      );
    }
    // Case 2: [link text](url)
    else if (match[2] !== undefined && match[3] !== undefined) {
      const label = match[2];
      const rawUrl = match[3].trim();
      if (options.disableLinks) {
        elements.push(<React.Fragment key={`label-${keyCounter++}`}>{renderFormattedText(label, options)}</React.Fragment>);
        lastIndex = combinedRegex.lastIndex;
        continue;
      }

      const isInternal =
        rawUrl.startsWith('#entry/') || rawUrl.startsWith('entry/');

      const resolvedSlug = rawUrl.replace(/^#?entry\//, '').replace(/^#/, '');

      if (isInternal && onSelectEntry) {
        elements.push(
          <button
            key={`link-${keyCounter++}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSelectEntry(resolvedSlug);
            }}
            className={linkClassName}
            title={`Go to entry: ${resolvedSlug}`}
          >
            {renderFormattedText(label, { ...options, linkClassName: '' })}
          </button>
        );
      } else if (isInternal) {
        elements.push(
          <a
            key={`link-${keyCounter++}`}
            href={rawUrl.startsWith('#') ? rawUrl : `#entry/${resolvedSlug}`}
            className={linkClassName}
            title={`Go to entry: ${resolvedSlug}`}
          >
            {renderFormattedText(label, { ...options, linkClassName: '' })}
          </a>
        );
      } else {
        if (/^[a-z][a-z0-9+.-]*:/i.test(rawUrl) && !/^(https?:|mailto:|tel:)/i.test(rawUrl)) {
          elements.push(<React.Fragment key={`invalid-${keyCounter++}`}>{renderFormattedText(label, options)}</React.Fragment>);
          lastIndex = combinedRegex.lastIndex;
          continue;
        }
        const safeHref =
          rawUrl.startsWith('http://') ||
          rawUrl.startsWith('https://') ||
          rawUrl.startsWith('mailto:') ||
          rawUrl.startsWith('tel:') ||
          rawUrl.startsWith('#')
            ? rawUrl
            : `https://${rawUrl}`;

        elements.push(
          <a
            key={`link-${keyCounter++}`}
            href={safeHref}
            target={safeHref.startsWith('#') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className={linkClassName}
            title={`Open external link: ${safeHref}`}
          >
            {renderFormattedText(label, { ...options, linkClassName: '' })}
          </a>
        );
      }
    }
    // Case 3: [[wikilink]]
    else if (match[4] !== undefined) {
      const rawTarget = match[4].trim();
      const [targetIdentifier, wikiLabel] = rawTarget.includes('|')
        ? rawTarget.split('|').map((s) => s.trim())
        : [rawTarget, rawTarget];

      const found = allEntries.find(
        (e) =>
          e.id.toLowerCase() === targetIdentifier.toLowerCase() ||
          e.slug.toLowerCase() === targetIdentifier.toLowerCase() ||
          e.title.toLowerCase() === targetIdentifier.toLowerCase() ||
          (e.titleZh && e.titleZh.toLowerCase() === targetIdentifier.toLowerCase())
      );

      if (options.disableLinks) {
        elements.push(wikiLabel || found?.title || targetIdentifier);
      } else if (found && onSelectEntry) {
        elements.push(
          <button
            key={`wiki-${keyCounter++}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSelectEntry(found.slug);
            }}
            className={linkClassName}
            title={`Go to entry: ${found.title}`}
          >
            {wikiLabel || found.title}
          </button>
        );
      } else if (found) {
        elements.push(
          <a
            key={`wiki-${keyCounter++}`}
            href={`#entry/${found.slug}`}
            className={linkClassName}
            title={`Go to entry: ${found.title}`}
          >
            {wikiLabel || found.title}
          </a>
        );
      } else {
        elements.push(
          <span
            key={`wiki-missing-${keyCounter++}`}
            className="text-black/60 italic font-mono-quiet text-xs"
          >
            [{wikiLabel || targetIdentifier}]
          </span>
        );
      }
    }

    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <>{elements}</>;
}

/**
 * Text selection formatting helper:
 * Toggles [title]...[/title] wrapping on selection.
 */
export function toggleTitleStyle(
  fullText: string,
  start: number,
  end: number
): { newText: string; newStart: number; newEnd: number } {
  if (start === end) {
    // If no selection, check if cursor is inside [title]...[/title]
    const openTag = '[title]';
    const closeTag = '[/title]';
    const beforeCursor = fullText.slice(0, start);
    const afterCursor = fullText.slice(start);

    const lastOpen = beforeCursor.lastIndexOf(openTag);
    const nextClose = afterCursor.indexOf(closeTag);

    if (
      lastOpen !== -1 &&
      nextClose !== -1 &&
      !beforeCursor.slice(lastOpen).includes(closeTag) &&
      !afterCursor.slice(0, nextClose).includes(openTag)
    ) {
      // Remove enclosing tags
      const closeIdx = start + nextClose;
      const newText =
        fullText.slice(0, lastOpen) +
        fullText.slice(lastOpen + openTag.length, closeIdx) +
        fullText.slice(closeIdx + closeTag.length);
      return {
        newText,
        newStart: Math.max(0, start - openTag.length),
        newEnd: Math.max(0, start - openTag.length),
      };
    }

    // Insert empty [title][/title]
    const newText =
      fullText.slice(0, start) + openTag + closeTag + fullText.slice(end);
    return {
      newText,
      newStart: start + openTag.length,
      newEnd: start + openTag.length,
    };
  }

  const selected = fullText.slice(start, end);
  const openTag = '[title]';
  const closeTag = '[/title]';

  // If already exactly wrapped in [title]...[/title]
  if (selected.startsWith(openTag) && selected.endsWith(closeTag)) {
    const uncurled = selected.slice(openTag.length, selected.length - closeTag.length);
    const newText = fullText.slice(0, start) + uncurled + fullText.slice(end);
    return {
      newText,
      newStart: start,
      newEnd: start + uncurled.length,
    };
  }

  // If selection boundary is just inside [title] and [/title]
  if (
    fullText.slice(start - openTag.length, start) === openTag &&
    fullText.slice(end, end + closeTag.length) === closeTag
  ) {
    const newText =
      fullText.slice(0, start - openTag.length) +
      selected +
      fullText.slice(end + closeTag.length);
    return {
      newText,
      newStart: start - openTag.length,
      newEnd: start - openTag.length + selected.length,
    };
  }

  // Otherwise, wrap selection with [title]...[/title]
  const newText =
    fullText.slice(0, start) + openTag + selected + closeTag + fullText.slice(end);
  return {
    newText,
    newStart: start,
    newEnd: start + openTag.length + selected.length + closeTag.length,
  };
}

/**
 * Text selection formatting helper:
 * Wraps or updates hyperlink [text](url) on selection.
 */
export function applyHyperlink(
  fullText: string,
  start: number,
  end: number,
  url: string,
  customLabel?: string
): { newText: string; newStart: number; newEnd: number } {
  const selected = fullText.slice(start, end);
  const label = customLabel || selected || 'Link';
  const cleanUrl = url.trim();

  // If selection is already a markdown link [old](url)
  const linkRegex = /^\[((?:\[title\][\s\S]*?\[\/title\]|[^\]])+)\]\(((?:[^()]|\([^()]*\))+)\)$/;
  if (linkRegex.test(selected)) {
    const replacement = `[${label}](${cleanUrl})`;
    const newText = fullText.slice(0, start) + replacement + fullText.slice(end);
    return {
      newText,
      newStart: start,
      newEnd: start + replacement.length,
    };
  }

  const replacement = `[${label}](${cleanUrl})`;
  const newText = fullText.slice(0, start) + replacement + fullText.slice(end);
  return {
    newText,
    newStart: start,
    newEnd: start + replacement.length,
  };
}

/**
 * Removes hyperlink formatting around selection, keeping plain text.
 */
export function removeHyperlink(
  fullText: string,
  start: number,
  end: number
): { newText: string; newStart: number; newEnd: number } {
  const selected = fullText.slice(start, end);
  const linkRegex = /^\[((?:\[title\][\s\S]*?\[\/title\]|[^\]])+)\]\(((?:[^()]|\([^()]*\))+)\)$/;
  const match = selected.match(linkRegex);

  if (match) {
    const plainText = match[1];
    const newText = fullText.slice(0, start) + plainText + fullText.slice(end);
    return {
      newText,
      newStart: start,
      newEnd: start + plainText.length,
    };
  }

  return { newText: fullText, newStart: start, newEnd: end };
}

/** Plain text for image alt text, tooltips, and other text-only attributes. */
export function formattedTextToPlainText(text: string | undefined | null): string {
  return (text || '').replace(/\[title\]|\[\/title\]/g, '')
    .replace(/\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => label || target);
}
