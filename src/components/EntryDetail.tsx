import { HtmlContent } from './HtmlContent';
import { GallerySlideshow } from './GallerySlideshow';
import { entryTags as canonicalEntryTags } from '../services/canonicalTags';
import { EntryTitle } from './EntryTitle';
import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React, { useState, useMemo } from 'react';
import { Entry, BacklinkInfo, EntryImage, Tag } from '../types';
import { findBacklinks } from '../services/wiki';
import { getEntryBlocks } from '../services/blockUtils';
import { ImageLightbox } from './ImageLightbox';
import { DocumentReader } from './DocumentReader';
import { VideoPlayer } from './VideoPlayer';
import { EntryHistory } from './EntryHistory';

interface EntryDetailProps {
  entry: Entry;
  allEntries: Entry[];
  tags?: Tag[];
  onSelectEntry: (slugOrId: string) => void;
  onFilterBySubject: (subject: string) => void;
  onSelectTag?: (tagId: string) => void;
  onNavigateBack: () => void;
  onRandomWander: () => void;
  showWander: boolean;
  isEditorLoggedIn: boolean;
  onEditEntry: (entry: Entry) => void;
  onToggleStatus?: (id: string) => void;
}

export const EntryDetail: React.FC<EntryDetailProps> = ({
  entry,
  allEntries,
  tags = [],
  onSelectEntry,
  onFilterBySubject,
  onSelectTag,
  onNavigateBack,
  isEditorLoggedIn,
  onEditEntry,
  onToggleStatus,
}) => {
  const [activeLightboxImage, setActiveLightboxImage] = useState<EntryImage | null>(null);

  // Compute backlinks dynamically from visible (published) entries
  const backlinks: BacklinkInfo[] = findBacklinks(entry, allEntries);

  // Find explicitly related entries by looking up entry IDs
  const relatedEntries = (entry.relatedEntryIds || [])
    .map((id) => allEntries.find((e) => e.id === id || e.slug === id))
    .filter((e): e is Entry => !!e);

  // Associated projects for this entry
  const associatedProjects = (entry.associatedProjectIds || [])
    .map((pid) => allEntries.find((e) => e.id === pid && e.type === 'project'))
    .filter((e): e is Entry => !!e);

  // If this entry itself is a project, find all published entries that reference this project ID
  const associatedProjectEntries = entry.type === 'project'
    ? allEntries.filter((e) => e.associatedProjectIds?.includes(entry.id) && e.id !== entry.id)
    : [];

  const entryTags = useMemo(() => canonicalEntryTags(entry, tags), [entry.tagIds, tags]);

  // Deduplicate entries while retaining every reason for the connection.
  const connectionMap = new Map<string, { entry: Entry; relationships: string[] }>();
  const addConnection = (item: Entry | undefined, relationship: string) => {
    if (!item || item.id === entry.id) return;
    const connection = connectionMap.get(item.id) || { entry: item, relationships: [] };
    if (!connection.relationships.includes(relationship)) connection.relationships.push(relationship);
    connectionMap.set(item.id, connection);
  };
  associatedProjects.forEach(item => addConnection(item, 'Part of'));
  associatedProjectEntries.forEach(item => addConnection(item, 'In this project'));
  relatedEntries.forEach(item => addConnection(item, 'Related'));
  backlinks.forEach(link => addConnection(allEntries.find(item => item.id === link.id), 'Links here'));
  const connections = [...connectionMap.values()];

  const renderWikiText = (text: string) => renderFormattedText(text, { allEntries, onSelectEntry });

  return (
    <article className="max-w-4xl mx-auto px-5 sm:px-8 py-5 sm:py-7 animate-fadeIn">
      {/* Top Back / Action bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 text-xs font-mono-quiet text-black/50">
        <button
          onClick={onNavigateBack}
          className="hover:text-black flex items-center gap-1"
        >
          ← Back to index
        </button>

        <div className="flex items-center gap-3">
          {isEditorLoggedIn && (
            <div className="flex items-center gap-2">
              {onToggleStatus && (
                <button
                  onClick={() => onToggleStatus(entry.id)}
                  className="hover:underline text-black/70"
                  title="Toggle publish / draft"
                >
                  [{entry.status === 'published' ? 'Unpublish' : 'Publish'}]
                </button>
              )}
              <button
                onClick={() => onEditEntry(entry)}
                className="text-black underline font-medium hover:text-black/80"
              >
                [Edit Entry]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Entry Header */}
      <header className="space-y-4 mb-10">
        <div className="space-y-1">
          <h1 className="space-y-1">
            <EntryTitle inline entry={entry} primaryClassName="font-editorial text-[28px] sm:text-[40px] text-black font-normal tracking-tight leading-tight" chineseClassName="font-editorial text-[26px] sm:text-[36px] text-black/80 font-light leading-tight" />
          </h1>
        </div>

        {/* Quiet editorial metadata line */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-black/60 font-mono-quiet pt-1">
          <span className="capitalize text-black font-medium">{entry.type}</span>
          {entry.date && (
            <>
              <span aria-hidden="true" className="text-black/30">·</span>
              <span>{entry.date}</span>
            </>
          )}
          {entry.medium && (
            <>
              <span aria-hidden="true" className="text-black/30">·</span>
              <span>{entry.medium}</span>
            </>
          )}
          {entry.dimensions && (
            <>
              <span aria-hidden="true" className="text-black/30">·</span>
              <span>{entry.dimensions}</span>
            </>
          )}
          {entry.status === 'draft' && (
            <>
              <span aria-hidden="true" className="text-black/30">·</span>
              <span className="text-amber-700 italic font-bold">[Draft — hidden from website]</span>
            </>
          )}
        </div>

        {/* Specific editorial warnings / context */}
        {entry.isDevelopingWork && (
          <div className="py-2.5 px-3.5 border-l-2 border-black/30 bg-black/[0.02] text-xs font-mono-quiet text-[#c18f32]">
            [developing study / working fragment]
          </div>
        )}

        {entry.notesForArtist && isEditorLoggedIn && (
          <div className="py-2 px-3 border border-amber-300/60 bg-amber-50/50 text-xs font-mono-quiet text-amber-900">
            <strong>Editor review note:</strong> {entry.notesForArtist}
          </div>
        )}
      </header>

      {/* Short Description / Lead paragraph */}
      {entry.shortDescription && (
        <div className="max-w-[65ch] font-editorial text-base sm:text-lg text-black/80 leading-[1.65] mb-8 border-b border-black/5 pb-8">
          {renderWikiText(entry.shortDescription)}
        </div>
      )}

      {/* Ordered Content Blocks (Text, Image Gallery, Document Reader, Video) */}
      <div className="space-y-12 my-10">
        {getEntryBlocks(entry).map((block) => {
          if (block.type === 'text') {
            return (
              <section
                key={block.id}
                className="max-w-[65ch] font-sans text-base sm:text-lg text-black/90 leading-[1.65] space-y-6"
              >
                {(block.content || '').split('\n\n').map((paragraph, index) => {
                  if (!paragraph.trim()) return null;
                  if (paragraph.trim().startsWith('- ')) {
                    const items = paragraph.split('\n').filter((l) => l.trim().startsWith('- '));
                    return (
                      <ul key={index} className="list-disc pl-5 space-y-2 my-4 text-black/85">
                        {items.map((it, i) => (
                          <li key={i}>{renderWikiText(it.replace(/^- /, ''))}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="whitespace-pre-line">
                      {renderWikiText(paragraph)}
                    </p>
                  );
                })}
              </section>
            );
          }

          if (block.type === 'html') return <section key={block.id}><HtmlContent content={block.content} /></section>;

          if (block.type === 'image_gallery') {
            const hasImages = block.images && block.images.length > 0;
            if (!hasImages) return null;
            return (
              <section key={block.id} className="space-y-6">
                {block.title && (
                  <h4 className="font-editorial text-xl text-black font-normal">
                    {renderWikiText(block.title)}
                  </h4>
                )}
                {block.layout === 'carousel' ? <GallerySlideshow block={block} onOpen={setActiveLightboxImage} isLightboxOpen={!!activeLightboxImage} /> : (
                <div className={block.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-6' : 'space-y-8'}>
                  {block.images.map((img, idx) => (
                    <figure key={img.id || idx} className="space-y-2">
                      <div
                        className="overflow-hidden cursor-zoom-in"
                        onClick={() => setActiveLightboxImage(img)}
                      >
                        <img
                          src={img.url}
                          alt={formattedTextToPlainText(img.alt || img.caption || entry.title)}
                          className="mx-auto w-auto max-w-full h-auto object-contain max-h-[70vh] transition-opacity hover:opacity-95"
                          loading="lazy"
                        />
                      </div>
                      {(img.caption || img.credit || img.alt) && (
                        <figcaption className="mx-auto max-w-[65ch] text-center text-xs font-mono-quiet text-black/60 pt-1 space-y-1">
                          {(img.caption || img.alt) && <p>{renderWikiText(img.caption || img.alt || '')}</p>}
                          {img.credit && <p className="text-black/40">Photo: {renderWikiText(img.credit)}</p>}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
                )}
              </section>
            );
          }

          if (block.type === 'document_reader') {
            return (
              <DocumentReader
                key={block.id}
                block={block}
              />
            );
          }

          if (block.type === 'video') {
            return (
              <VideoPlayer
                key={block.id}
                block={block}
              />
            );
          }

          return null;
        })}

        {getEntryBlocks(entry).length === 0 && (
          <div className="my-8 py-8 px-6 border border-black/10 bg-black/[0.01] text-center space-y-1">
            <p className="font-editorial text-sm text-black/60 italic">
              Visual documentation and text pending review by artist.
            </p>
            <p className="text-[11px] font-mono-quiet text-black/40">
              No placeholder images fabricated. Documentation, texts, documents, and videos can be uploaded directly in the GitHub editor.
            </p>
          </div>
        )}
      </div>

      <EntryHistory entry={entry} allEntries={allEntries} onSelectEntry={onSelectEntry} />

      {/* Canonical Tags & Subjects */}
      {entryTags.length > 0 && (
        <section className="pt-8 border-t border-black/10 my-8">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 text-black/60">
            <span className="font-mono-quiet text-black/40 uppercase tracking-wider text-[11px]">
              Tags:
            </span>
            {entryTags.map((tItem, idx) => (
              <React.Fragment key={tItem.id}>
                <button
                  onClick={() => {
                    if (onSelectTag) {
                      onSelectTag(tItem.id);
                    } else {
                      onFilterBySubject(tItem.label);
                    }
                  }}
                  className="hover:text-black hover:underline cursor-pointer font-serif italic text-base sm:text-lg text-black/80"
                  title={`View subject view for ${tItem.label}`}
                >
                  {tItem.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* All entry relationships share one deduplicated list. */}
      {connections.length > 0 && (
        <section className="pt-6 border-t border-black/10 mt-8">
          <h3 className="font-mono-quiet uppercase text-xs tracking-wider text-black/40 mb-3">
            Connections ({connections.length})
          </h3>
          <ul className={`grid grid-cols-1 ${connections.length > 1 ? 'sm:grid-cols-2' : ''} gap-x-6 gap-y-2`}>
            {connections.map(({ entry: item, relationships }) => (
              <li key={item.id} className="px-3 py-3 hover:bg-black/5 focus-within:bg-black/5 transition-colors space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <a
                    href={`#entry/${item.slug}`}
                    onClick={event => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onSelectEntry(item.slug);
                    }}
                    className="group leading-tight focus-visible:underline underline-offset-2"
                  >
                    <EntryTitle inline entry={item} primaryClassName="font-editorial text-base text-black group-hover:underline" chineseClassName="font-editorial text-base text-black/70 group-hover:underline" />
                  </a>
                  <span className="text-[11px] font-mono-quiet text-black/40 capitalize shrink-0">
                    {item.type}
                  </span>
                </div>
                <p className="text-[11px] font-mono-quiet text-black/40">
                  {relationships.join(' · ')}
                </p>
                {item.shortDescription && (
                  <p className="text-xs sm:text-sm text-black/60 font-sans leading-relaxed line-clamp-2">
                    {renderWikiText(item.shortDescription)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />
    </article>
  );
};
