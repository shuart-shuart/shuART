import { renderFormattedText } from '../services/formatting';
import React from 'react';
import { Entry, Tag } from '../types';
import { getEntryBlocks } from '../services/blockUtils';
import { DocumentReader } from './DocumentReader';
import { VideoPlayer } from './VideoPlayer';

interface TagViewProps {
  tag: Tag;
  linkedNote: Entry | null;
  associatedEntries: Entry[];
  allEntries: Entry[];
  onSelectEntry: (slugOrId: string) => void;
  onSelectTag: (tagId: string) => void;
  onNavigateBack: () => void;
}

export const TagView: React.FC<TagViewProps> = ({
  tag,
  linkedNote,
  associatedEntries,
  allEntries,
  onSelectEntry,
  onSelectTag,
  onNavigateBack,
}) => {
  const renderWikiText = (text: string) => renderFormattedText(text, { allEntries, onSelectEntry });

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-14 animate-fadeIn">
      {/* Back button & Tag Breadcrumb */}
      <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-black/10 text-xs font-mono-quiet text-black/60">
        <button
          onClick={onNavigateBack}
          className="hover:text-black hover:underline"
        >
          ← Return to Archive Index
        </button>
        <span className="uppercase tracking-wider text-black/40">
          Canonical Subject View · Tag ID: {tag.id}
        </span>
      </div>

      {/* Main Tag Header */}
      <header className="space-y-4 mb-10">
        <div className="space-y-1">
          <div className="text-xs font-mono-quiet uppercase tracking-wider text-black/40">
            Subject / Thematic Tag
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl text-black font-normal tracking-tight capitalize">
            {tag.label}
          </h1>
        </div>

        {tag.description && !linkedNote && (
          <p className="font-editorial text-lg sm:text-xl text-black/75 max-w-2xl leading-relaxed">
            {tag.description}
          </p>
        )}
      </header>

      {/* Linked Note Section (if present) */}
      {linkedNote && (
        <section className="mb-16 p-6 sm:p-8 border border-black/15 bg-black/[0.015] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-black/10">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono-quiet uppercase tracking-wider text-black/40">
                Linked Note / Concept Definition
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-black">
                {linkedNote.title}
                {linkedNote.titleZh && linkedNote.titleZh !== linkedNote.title && (
                  <span className="text-black/60 font-light text-xl ml-2">
                    ({linkedNote.titleZh})
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={() => onSelectEntry(linkedNote.slug)}
              className="text-xs font-mono-quiet text-black/60 hover:text-black hover:underline shrink-0"
            >
              Open Full Note Entry →
            </button>
          </div>

          {/* Short definition & full text */}
          {linkedNote.shortDescription && (
            <p className="font-editorial text-base sm:text-lg text-black/85 leading-relaxed italic">
              {linkedNote.shortDescription}
            </p>
          )}

          {linkedNote.fullText && (
            <div className="text-sm font-sans text-black/80 leading-[1.8] space-y-4 whitespace-pre-line max-w-[65ch]">
              {renderWikiText(linkedNote.fullText)}
            </div>
          )}

          {/* Render content blocks from the linked note (if any images, document readers, videos) */}
          {getEntryBlocks(linkedNote).length > 0 && (
            <div className="space-y-6 pt-4 border-t border-black/10">
              {getEntryBlocks(linkedNote).map((block) => {
                if (block.type === 'document_reader') {
                  return (
                    <div key={block.id} className="my-4">
                      <DocumentReader block={block} />
                    </div>
                  );
                }
                if (block.type === 'video') {
                  return (
                    <div key={block.id} className="my-4">
                      <VideoPlayer block={block} />
                    </div>
                  );
                }
                if (block.type === 'text') {
                  return (
                    <div
                      key={block.id}
                      className="text-sm font-sans text-black/75 leading-relaxed whitespace-pre-line"
                    >
                      {renderWikiText(block.content)}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </section>
      )}

      {/* Associated Published Entries */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-black/15">
          <h2 className="font-editorial text-2xl text-black">
            Associated Published Entries
          </h2>
          <span className="font-mono-quiet text-xs text-black/50">
            {associatedEntries.length} {associatedEntries.length === 1 ? 'entry' : 'entries'} indexed under “{tag.label}”
          </span>
        </div>

        {associatedEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {associatedEntries.map((entry) => (
              <article
                key={entry.id}
                onClick={() => onSelectEntry(entry.slug)}
                className="group cursor-pointer p-6 border border-black/10 hover:border-black transition-all bg-white flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono-quiet text-black/50">
                    <span className="capitalize text-black font-medium">{entry.type}</span>
                    {entry.date && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{entry.date}</span>
                      </>
                    )}
                    {entry.isDevelopingWork && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="italic">[study]</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-editorial text-xl text-black group-hover:underline leading-snug">
                    {entry.title}
                  </h3>
                  {entry.titleZh && entry.titleZh !== entry.title && (
                    <p className="font-editorial text-xs text-black/50">{entry.titleZh}</p>
                  )}

                  {entry.shortDescription && (
                    <p className="text-xs text-black/70 font-sans leading-relaxed line-clamp-3 pt-1">
                      {entry.shortDescription}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/10 flex justify-between items-baseline text-[11px] font-mono-quiet text-black/45">
                  <span className="truncate max-w-[200px]">
                    {entry.subjects?.slice(0, 3).join(', ')}
                  </span>
                  <span className="group-hover:text-black">Open →</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm font-editorial text-black/50 italic border border-dashed border-black/15">
            No published entries currently associated with this tag.
          </div>
        )}
      </section>
    </div>
  );
};
