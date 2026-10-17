import { connectionDescription } from '../services/connectionDescription';
import { ArtworkImage } from './ArtworkImage';
import { HtmlContent } from './HtmlContent';
import { WebsiteEmbed } from './WebsiteEmbed';
import { GallerySlideshow } from './GallerySlideshow';
import { entryTags as canonicalEntryTags } from '../services/canonicalTags';
import { EntryTitle } from './EntryTitle';
import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React, { useState, useMemo } from 'react';
import { Entry, BacklinkInfo, EntryImage, Tag } from '../types';
import { findBacklinks } from '../services/wiki';
import { getEntryBlocks } from '../services/blockUtils';
import { ImageLightbox } from './ImageLightbox';
import { DocumentReader } from './LazyDocumentReader';
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

  // Combine all connection sources without repeating entries.
  const connectionMap = new Map<string, Entry>();
  const addConnection = (item: Entry | undefined) => {
    if (!item || item.id === entry.id) return;
    connectionMap.set(item.id, item);
  };
  associatedProjects.forEach(addConnection);
  associatedProjectEntries.forEach(addConnection);
  relatedEntries.forEach(addConnection);
  backlinks.forEach(link => addConnection(allEntries.find(item => item.id === link.id)));
  const connections = [...connectionMap.values()];

  const renderWikiText = (text: string) => renderFormattedText(text, { allEntries, onSelectEntry });

  return (
    <article className="max-w-4xl mx-auto px-5 sm:px-8 py-5 sm:py-7 animate-fadeIn">
      {/* Top Back / Action bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 text-xs font-mono-quiet text-black/65">
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
            <EntryTitle inline entry={entry} primaryClassName="font-editorial text-[26px] md:text-[30px] text-black font-normal tracking-tight leading-tight" chineseClassName="font-editorial text-[24px] md:text-[28px] text-black/80 font-light leading-tight" />
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
        <div className="entry-reading-column font-editorial body-copy text-black/80 leading-[1.6] mb-8 border-b border-black/5 pb-8">
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
                className="entry-reading-column font-sans body-copy text-black/90 leading-[1.6] space-y-6"
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

          if (block.type === 'html') return <section key={block.id} className="entry-reading-column"><HtmlContent content={block.content} /></section>;
          if (block.type === 'website') return <section key={block.id}><WebsiteEmbed block={block} /></section>;

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
                      <button
                        type="button"
                        aria-label={`Enlarge image ${idx + 1}`}
                        className="block w-full overflow-hidden cursor-zoom-in"
                        onClick={() => setActiveLightboxImage(img)}
                      >
                        <ArtworkImage
                          src={img.url}
                          alt={formattedTextToPlainText(img.alt || img.caption || entry.title)}
                          className={`mx-auto w-auto max-w-full h-auto object-contain max-h-[70vh] transition-opacity hover:opacity-95${block.showOutline ? ' border border-black/20' : ''}`}
                          loading="lazy"
                        />
                      </button>
                      {(img.caption || img.credit || img.alt) && (
                        <figcaption className="gallery-caption mx-auto text-center text-xs font-mono-quiet text-black pt-1">
                          {(img.caption || img.alt) && <span>{renderWikiText(img.caption || img.alt || '')}</span>}
                          {(img.caption || img.alt) && img.credit && <span aria-hidden="true"> · </span>}
                          {img.credit && <span>Photo: {renderWikiText(img.credit)}</span>}
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
            <p className="text-xs font-mono-quiet text-black/60">
              No placeholder images fabricated. Documentation, texts, documents, and videos can be uploaded directly in the GitHub editor.
            </p>
          </div>
        )}
      </div>

      {(entryTags.length > 0 || connections.length > 0 || entry.credits?.length || entry.presentationHistory?.length) ? <div className="mt-8 border-t border-black/10 pt-6 space-y-6">
      <EntryHistory entry={entry} allEntries={allEntries} onSelectEntry={onSelectEntry} />

      {/* Canonical Tags & Subjects */}
      {entryTags.length > 0 && (
        <section aria-label="Tags">
          <h3 className="reference-label font-mono-quiet uppercase tracking-wider text-black/60 mb-3">Tags</h3>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-black/60">
            {entryTags.map((tItem, idx) => (
              <React.Fragment key={tItem.id}>
                {idx > 0 && <span aria-hidden="true" className="text-black/35">·</span>}
                <button
                  onClick={() => {
                    if (onSelectTag) {
                      onSelectTag(tItem.id);
                    } else {
                      onFilterBySubject(tItem.label);
                    }
                  }}
                  className="hover:text-black hover:underline cursor-pointer entry-tag font-serif italic text-black/80"
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
        <section aria-label="Connections">
          <h3 className="reference-label font-mono-quiet uppercase tracking-wider text-black/60 mb-3">
            Connections ({connections.length})
          </h3>
          <ul className={`grid grid-cols-1 ${connections.length > 1 ? 'md:grid-cols-2' : ''} gap-x-8 gap-y-4`}>
            {connections.map(item => {
              const description = connectionDescription(item);
              return <li key={item.id} className="px-3 py-3 hover:bg-black/5 focus-within:bg-black/5 transition-colors space-y-1">
                <span className="block reference-label font-mono-quiet text-black/60 capitalize">
                  {item.type}
                </span>
                <div>
                  <a
                    href={`#entry/${item.slug}`}
                    onClick={event => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onSelectEntry(item.slug);
                    }}
                    className="group leading-tight focus-visible:underline underline-offset-2"
                  >
                    <EntryTitle inline entry={item} primaryClassName="connection-title font-editorial text-black group-hover:underline" chineseClassName="connection-title font-editorial text-black/70 group-hover:underline" />
                  </a>
                </div>
                {description && (
                  <p className="reference-copy text-black/65 font-sans leading-relaxed">
                    {renderWikiText(description)}
                  </p>
                )}
              </li>;
            })}
          </ul>
        </section>
      )}

      </div> : null}

      {/* Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />
    </article>
  );
};
