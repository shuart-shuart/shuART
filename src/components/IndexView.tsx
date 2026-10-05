import { DEFAULT_INDEX } from '../data/siteContent';
import { renderFormattedText } from '../services/formatting';
import { entryTags, tagCounts } from '../services/canonicalTags';
import { EntryTitle } from './EntryTitle';
import React, { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | EntryType>(initialType);
  const [displayMode, setDisplayMode] = useState<'directory' | 'cards'>('directory');

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
      <div className="border-y border-black/10 py-5 my-6 space-y-4 font-sans text-sm">
        {/* Search input & layout mode switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2 border-l border-black/15 pl-3">
              <span className="text-black/40">View:</span>
              <button
                onClick={() => setDisplayMode('directory')}
                className={`transition-colors ${
                  displayMode === 'directory' ? 'text-black font-medium underline' : 'text-black/50 hover:text-black'
                }`}
              >
                Directory
              </button>
              <span className="text-black/20">/</span>
              <button
                onClick={() => setDisplayMode('cards')}
                className={`transition-colors ${
                  displayMode === 'cards' ? 'text-black font-medium underline' : 'text-black/50 hover:text-black'
                }`}
              >
                Expanded
              </button>
            </div>
          </div>
        </div>

        {/* Type filters (Clean typographic zero-pill discipline) */}
        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs font-mono-quiet pt-2">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-black/20 text-xs font-mono-quiet text-black/40 uppercase tracking-wider">
                <th className="py-3 pr-4 font-normal">Title</th>
                <th className="py-3 px-4 font-normal hidden sm:table-cell">Type</th>
                <th className="py-3 px-4 font-normal hidden md:table-cell">Date</th>
                <th className="py-3 px-4 font-normal hidden lg:table-cell">Medium / Scope</th>
                <th className="py-3 pl-4 font-normal text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.slug)}
                  className="group hover:bg-black/[0.015] cursor-pointer transition-colors"
                >
                  {/* Title & Chinese */}
                  <td className="py-4 pr-4 align-baseline">
                    <div className="space-y-0.5">
                      <EntryTitle entry={entry} primaryClassName="font-editorial text-base sm:text-lg text-black group-hover:underline" chineseClassName="font-editorial text-base sm:text-lg text-black/70" />
                      {entry.isDevelopingWork && (
                        <div className="text-[11px] font-mono-quiet text-black/45 italic">
                          [study / fragment]
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-4 px-4 align-baseline text-xs font-mono-quiet text-black/60 capitalize hidden sm:table-cell">
                    {entry.type}
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 align-baseline text-xs font-mono-quiet text-black/60 hidden md:table-cell whitespace-nowrap">
                    {entry.date || '—'}
                  </td>

                  {/* Medium / Scope */}
                  <td className="py-4 px-4 align-baseline text-xs text-black/60 hidden lg:table-cell max-w-xs truncate">
                    {entry.medium || entry.shortDescription || '—'}
                  </td>

                  {/* Link */}
                  <td className="py-4 pl-4 align-baseline text-right">
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
        /* Expanded Archival Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              onClick={() => onSelectEntry(entry.slug)}
              className="group cursor-pointer p-6 border border-black/10 hover:border-black transition-all flex flex-col justify-between space-y-4 bg-white"
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

                <h3 className="leading-snug">
                  <EntryTitle entry={entry} primaryClassName="font-editorial text-xl text-black group-hover:underline" chineseClassName="font-editorial text-base sm:text-lg text-black/70" />
                </h3>

                {entry.shortDescription && (
                  <p className="text-base sm:text-lg text-black/70 font-sans leading-[1.65] line-clamp-3 pt-1">
                    {entry.shortDescription}
                  </p>
                )}
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
          ))}

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
