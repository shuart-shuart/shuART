import { sortIndexEntries, type IndexSort, type IndexSortKey } from '../services/indexSorting';
import { DEFAULT_INDEX } from '../data/siteContent';
import { formattedTextToPlainText, renderFormattedText } from '../services/formatting';
import { getEntryBlocks } from '../services/blockUtils';
import { publicAssetUrl } from '../services/publicAssetUrl';
import { entryTags, tagCounts } from '../services/canonicalTags';
import { EntryTitle } from './EntryTitle';
import { useStickyHeight } from '../services/useStickyHeight';
import React, { useState, useMemo } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { Entry, EntryType, Tag, IndexContent } from '../types';

interface IndexViewProps {
  entries: Entry[];
  indexContent?: IndexContent;
  tags?: Tag[];
  onSelectEntry: (slugOrId: string) => void;
  selectedSubject?: string | null;
  onClearSubjectFilter?: () => void;
  onFilterBySubject?: (subject: string) => void;
  onSelectTag?: (tagId: string) => void;
  initialType?: 'all' | EntryType;
}

const TYPE_OPTIONS: { value: 'all' | EntryType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Works' },
  { value: 'project', label: 'Projects' },
  { value: 'publication', label: 'Publications' },
  { value: 'note', label: 'Notes' },
];

const TYPE_HOVER: Record<EntryType, string> = {
  project: 'hover:bg-[#e9edf0] focus-within:bg-[#e9edf0]',
  work: 'hover:bg-[#ededed] focus-within:bg-[#ededed]',
  publication: 'hover:bg-[#efede7] focus-within:bg-[#efede7]',
  note: 'hover:bg-[#eee9ed] focus-within:bg-[#eee9ed]',
};

export const IndexView: React.FC<IndexViewProps> = ({
  entries,
  indexContent = DEFAULT_INDEX,
  tags = [],
  onSelectEntry,
  selectedSubject,
  onClearSubjectFilter,
  onFilterBySubject,
  onSelectTag,
  initialType = 'all',
}) => {
  const controlsRef = useStickyHeight<HTMLDivElement>('--index-controls-height');
  const followEntry = (event: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    event.stopPropagation();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onSelectEntry(slug);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | EntryType>(initialType);
  const [displayMode, setDisplayMode] = useState<'directory' | 'cards'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 'cards' : 'directory'
  );

  const [sort, setSort] = useState<IndexSort | null>(null);
  const toggleSort = (key: IndexSortKey) => setSort(current => ({
    key,
    direction: current?.key === key
      ? (current.direction === 'ascending' ? 'descending' : 'ascending')
      : key === 'year' ? 'descending' : 'ascending',
  }));
  const sortControl = (key: IndexSortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1.5 uppercase hover:text-black focus-visible:text-black transition-colors"
      aria-label={`Sort by ${label.toLowerCase()}${sort?.key === key ? `, currently ${sort.direction}` : ''}`}
    >
      {label}
      <span aria-hidden="true" className={sort?.key === key ? 'text-black/60' : 'text-black/25'}>
        {sort?.key === key ? (sort.direction === 'ascending' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );

  // Build project title lookup
  const projectLookup = useMemo(() => {
    const map = new Map<string, string>();
    entries.filter((e) => e.type === 'project').forEach((p) => {
      map.set(p.id, p.title);
    });
    return map;
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Type filter
      if (selectedType !== 'all' && entry.type !== selectedType) {
        return false;
      }

      // Subject / Tag filter
      if (selectedSubject) {
        const matchesSubject = entryTags(entry, tags).some(tag => tag.label === selectedSubject);
        const matchesTagId = entry.tagIds?.includes(selectedSubject) || entry.tagIds?.includes('tag-' + selectedSubject);
        if (!matchesSubject && !matchesTagId) {
          return false;
        }
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = entry.title.toLowerCase().includes(q);
        const matchTitleZh = entry.titleZh?.toLowerCase().includes(q) || false;
        const matchDesc = entry.shortDescription?.toLowerCase().includes(q) || false;
        const matchFull = entry.fullText?.toLowerCase().includes(q) || false;
        const matchMedium = entry.medium?.toLowerCase().includes(q) || false;
        const matchSubject = entry.subjects?.some((s) => s.toLowerCase().includes(q)) || false;
        if (!matchTitle && !matchTitleZh && !matchDesc && !matchFull && !matchMedium && !matchSubject) {
          return false;
        }
      }

      return true;
    });
  }, [entries, tags, selectedType, selectedSubject, searchQuery]);

  const sortedEntries = useMemo(() => sortIndexEntries(filteredEntries, sort), [filteredEntries, sort]);

  const availableTags = useMemo(() => tagCounts(entries, tags), [entries, tags]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-fadeIn">
      {/* Intro Header */}
      <div className="mb-10 space-y-3">
        <h1 className="font-editorial text-3xl sm:text-4xl text-black font-normal tracking-tight">
          {renderFormattedText(indexContent.title, { allEntries: entries, onSelectEntry })}
        </h1>
        <p className="font-editorial text-base sm:text-lg text-black/70 max-w-[65ch] leading-[1.65] whitespace-pre-line">
          {renderFormattedText(indexContent.description, { allEntries: entries, onSelectEntry })}
        </p>
      </div>

      {/* Controls & Filters Bar */}
      <div ref={controlsRef} className="sticky z-20 bg-white border-y border-black/10 py-2 sm:py-3 my-6 space-y-2 sm:space-y-3 font-sans text-sm" style={{top:'var(--site-header-height, 80px)'}}>
        {/* Search input & layout mode switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, term, medium, or concept…"
              className="w-full bg-white border border-black/20 focus:border-black px-3.5 py-2 text-sm text-black placeholder:text-black/35 font-sans focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono-quiet text-black/40 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-quiet justify-between sm:justify-end">
            <div className="text-black/50">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </div>
            <div role="group" aria-label="Index view" className="flex items-center gap-2 border-l border-black/15 pl-3">
              <button
                onClick={() => setDisplayMode('directory')}
                aria-label="Directory view"
                aria-pressed={displayMode === 'directory'}
                title="Directory view"
                className={`p-2 border-b transition-colors focus-visible:outline focus-visible:outline-1 ${
                  displayMode === 'directory' ? 'text-black border-black' : 'text-black/40 border-transparent hover:text-black'
                }`}
              >
                <List size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                onClick={() => setDisplayMode('cards')}
                aria-label="Tiles view"
                aria-pressed={displayMode === 'cards'}
                title="Tiles view"
                className={`p-2 border-b transition-colors focus-visible:outline focus-visible:outline-1 ${
                  displayMode === 'cards' ? 'text-black border-black' : 'text-black/40 border-transparent hover:text-black'
                }`}
              >
                <LayoutGrid size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Type filters (Clean typographic zero-pill discipline) */}
        <div className="flex items-center gap-x-3 sm:gap-x-5 gap-y-2 flex-wrap text-xs font-mono-quiet">
          <span className="text-black/40 uppercase tracking-wider text-[11px]">Type:</span>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedType(opt.value)}
                className={`transition-colors ${
                  isActive
                    ? 'text-black font-medium underline underline-offset-4 decoration-black'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {displayMode === 'cards' && (
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-quiet text-black/40">
            <span>Sort:</span>
            {sortControl('title', 'Title')}
            {sortControl('year', 'Year')}
            {sortControl('type', 'Type')}
          </div>
        )}

        {/* Active subject indicator */}
        {selectedSubject && (
          <div className="flex items-center gap-2 pt-1 text-xs font-mono-quiet text-black/80">
            <span>Filtered by subject:</span>
            <span className="font-editorial italic text-black font-medium">"{selectedSubject}"</span>
            <button
              onClick={onClearSubjectFilter}
              className="text-black/50 hover:text-black underline ml-2"
            >
              (show all subjects)
            </button>
          </div>
        )}
      </div>

      {/* Directory Mode (Table / Clean Line Format) */}
      {displayMode === 'directory' ? (
        <div>
          <table className="w-full table-fixed text-left text-sm font-sans border-collapse index-directory">
            <thead>
              <tr className="border-b border-black/20 text-xs font-mono-quiet text-black/40 uppercase tracking-wider">
                <th aria-sort={sort?.key === 'title' ? sort.direction : 'none'} className="py-3 px-4 font-normal w-[60%] sm:w-[50%] md:w-[50%] lg:w-[38%]">{sortControl('title', 'Title')}</th>
                <th aria-sort={sort?.key === 'type' ? sort.direction : 'none'} className="py-3 px-1 sm:px-4 font-normal w-[20%] sm:w-[25%] md:w-[15%] lg:w-[12%]">{sortControl('type', 'Type')}</th>
                <th aria-sort={sort?.key === 'year' ? sort.direction : 'none'} className="py-3 px-1 sm:px-4 font-normal w-[20%] sm:w-[25%] md:w-[15%] lg:w-[12%]">{sortControl('year', 'Year')}</th>
                <th className="py-3 px-4 font-normal hidden lg:table-cell lg:w-[23%]">Medium / Scope</th>
                <th className="py-3 px-4 font-normal text-right hidden md:table-cell md:w-[20%] lg:w-[15%]">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {sortedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.slug)}
                  className={`group cursor-pointer transition-colors ${TYPE_HOVER[entry.type]}`}
                >
                  {/* Title & Chinese */}
                  <td className="py-4 px-4 align-baseline">
                    <div>
                      <a href={`#entry/${entry.slug}`} onClick={event=>followEntry(event,entry.slug)} className="block leading-[1.2] focus-visible:underline underline-offset-2">
                        <EntryTitle inline entry={entry} primaryClassName="font-editorial text-[15px] sm:text-base text-black group-hover:underline" chineseClassName="font-editorial text-[15px] sm:text-base text-black/70 group-hover:underline" />
                      </a>
                      {entry.isDevelopingWork && (
                        <div className="text-[11px] font-mono-quiet text-[#c18f32] italic mt-1">
                          [study / fragment]
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-1 sm:px-4 align-baseline text-[10px] sm:text-xs font-mono-quiet text-black/60 capitalize break-words">
                    {entry.type}
                  </td>

                  {/* Date */}
                  <td className="py-4 px-1 sm:px-4 align-baseline text-[10px] sm:text-xs font-mono-quiet text-black/60 break-words">
                    {entry.date || '—'}
                  </td>

                  {/* Medium / Scope */}
                  <td className="py-4 px-4 align-baseline text-xs text-black/60 hidden lg:table-cell max-w-xs truncate">
                    {entry.medium || entry.shortDescription || '—'}
                  </td>

                  {/* Link */}
                  <td className="py-4 px-4 align-baseline text-right hidden md:table-cell">
                    <span className="font-mono-quiet text-xs text-black/40 group-hover:text-black">
                      View →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEntries.length === 0 && (
            <div className="py-16 text-center text-sm font-editorial text-black/50 italic">
              No entries found matching current filter or search criteria.
            </div>
          )}
        </div>
      ) : (
        /* Thumbnail Tiles Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-4">
          {sortedEntries.map((entry) => {
            const thumbnail = getEntryBlocks(entry)
              .flatMap(block => block.type === 'image_gallery' ? block.images : [])
              .find(image => image.url);
            return (
            <article
              key={entry.id}
              onClick={() => onSelectEntry(entry.slug)}
              className={`group cursor-pointer p-4 border border-black/10 hover:border-black transition-colors flex flex-col justify-between space-y-4 bg-white ${TYPE_HOVER[entry.type]}`}
            >
              <div className="space-y-2">
                {thumbnail && (
                  <a href={`#entry/${entry.slug}`} onClick={event => followEntry(event, entry.slug)} className="block mb-4" aria-label={`Open ${entry.title}`}>
                    <img
                      src={publicAssetUrl(thumbnail.url)}
                      alt={formattedTextToPlainText(thumbnail.alt || thumbnail.caption || entry.title)}
                      className="w-full aspect-[4/3] object-contain"
                      loading="lazy"
                    />
                  </a>
                )}
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
                      <span className="italic text-[#c18f32]">[study / fragment]</span>
                    </>
                  )}
                </div>

                <h3 className="leading-[1.2]">
                  <a href={`#entry/${entry.slug}`} onClick={event=>followEntry(event,entry.slug)} className="block focus-visible:underline underline-offset-2">
                    <EntryTitle inline entry={entry} primaryClassName="font-editorial text-[15px] sm:text-base text-black group-hover:underline" chineseClassName="font-editorial text-[15px] sm:text-base text-black/70 group-hover:underline" />
                  </a>
                </h3>

              </div>

              {/* Subjects & Project Badges / Footer */}
              <div className="pt-3 border-t border-black/10 flex flex-wrap justify-between items-baseline gap-2 text-[11px] font-mono-quiet text-black/55">
                <div className="flex flex-wrap items-center gap-1.5 truncate max-w-[240px]">
                  {entry.associatedProjectIds && entry.associatedProjectIds.length > 0 && (
                    <span className="text-[10px] uppercase tracking-wider text-black font-medium border border-black/25 px-1 py-0.2">
                      {projectLookup.get(entry.associatedProjectIds[0]) || 'Project'}
                    </span>
                  )}
                  <span className="truncate text-black/50">
                    {entryTags(entry, tags).slice(0, 3).map(tag => tag.label).join(', ')}
                  </span>
                </div>
                <span className="group-hover:text-black shrink-0">Open →</span>
              </div>
            </article>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm font-editorial text-black/50 italic">
              No entries found matching current filter or search criteria.
            </div>
          )}
        </div>
      )}

      {/* Index Tags / Subjects cloud at bottom */}
      <div className="mt-20 pt-8 border-t border-black/10">
        <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black/40 mb-3">
          Index of Practice Tags & Subjects
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3 text-black/70">
          {availableTags.map((item, idx) => (
            <React.Fragment key={item.id}>
              <button
                onClick={() => {
                  if (onSelectTag) {
                    onSelectTag(item.id);
                  } else if (onFilterBySubject) {
                    onFilterBySubject(item.label);
                  }
                }}
                className={`inline-flex items-baseline gap-1.5 max-w-full text-left hover:text-black font-serif italic text-base sm:text-lg ${
                  selectedSubject === item.label || selectedSubject === item.id ? 'text-black font-medium underline' : 'text-black/75'
                }`}
                title={`Open subject view for ${item.label}`}
              >
                <span>{item.label}</span><span className="shrink-0 font-mono-quiet text-xs text-black/50 not-italic">({item.count})</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
