import { ArrowRight } from 'lucide-react';
import { connectionDescription } from '../services/connectionDescription';
import React from 'react';
import { Entry } from '../types';
import { renderFormattedText } from '../services/formatting';

function safeLink(value?: string): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (/^(https?:\/\/|mailto:|#entry\/)/i.test(url)) return url;
  return /^[^\s:/]+\.[^\s:]+$/.test(url) ? `https://${url}` : undefined;
}

export function EntryHistory({ entry, allEntries, onSelectEntry }: {
  entry: Entry;
  allEntries: Entry[];
  onSelectEntry: (slugOrId: string) => void;
}) {
  const formatted = (text: string) => renderFormattedText(text, { allEntries, onSelectEntry });
  const linkedText = (text: string, url?: string) => {
    const href = safeLink(url);
    return href ? <a href={href} target={href.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 text-black/70 hover:text-black">
      {renderFormattedText(text, { allEntries, disableLinks: true })}
    </a> : formatted(text);
  };
  const credits = (entry.credits || []).filter(credit => credit.name.trim());
  const records = (entry.presentationHistory || []).filter(record =>
    [record.title, record.venue, record.location, record.date, record.curator, record.link, record.note].some(value => value?.trim())
  );
  return <>
    {credits.length > 0 && <section aria-label="Credits">
      <dl className="space-y-3 reference-copy">
        {credits.map(credit => <div key={credit.id} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
          <dt className="font-mono-quiet reference-label text-black/65 capitalize">{formatted(credit.role === 'custom' ? credit.customRole || 'Contributor' : credit.role)}</dt>
          <dd className="whitespace-pre-line">{linkedText(credit.name, credit.link)}</dd>
        </div>)}
      </dl>
    </section>}
    {records.length > 0 && <section aria-label="Provenance / Presentation History" className="reference-copy text-black/75">
      <p className="mb-3"><span className="font-editorial italic">{formatted(entry.title)}</span>{' was:'}</p>
      <ul className="space-y-2.5">
        {records.flatMap(record => {
          const event = record.title.trim() || record.venue.trim();
          const venueDetail = record.title.trim() ? record.venue.trim() : '';
          const details = [venueDetail, record.location, record.date].filter(value => value?.trim());
          const hasSentence = event || details.length > 0 || record.curator?.trim() || record.link?.trim();
          const withoutTitle = connectionDescription({ ...entry, shortDescription: record.note || '' });
          const separateNote = withoutTitle !== record.note && /^was\s+/i.test(withoutTitle);
          const note = separateNote ? withoutTitle.replace(/^was\s+/i, '') : record.note;
          const line = (key: string, content: React.ReactNode) => <li key={key} className="flex items-start gap-2.5">
            <ArrowRight size={14} strokeWidth={1} aria-hidden="true" className="shrink-0 mt-1" />
            <div className="min-w-0 space-y-2">{content}</div>
          </li>;
          const rows: React.ReactNode[] = [];
          if (hasSentence) rows.push(line(record.id, <>
            <p>{record.action || 'presented'}
              {event && <>{' at '}<em className="font-editorial italic">{linkedText(event, record.link)}</em></>}
              {!event && record.link?.trim() && <>{' at '}{linkedText('a presentation', record.link)}</>}
              {details.length > 0 && <>{' ('}
                {venueDetail && <>{formatted(venueDetail)}{(record.location || record.date) && ', '}</>}
                {record.location && record.date
                  ? <span className={record.location.length + record.date.length <= 30 ? 'whitespace-nowrap' : undefined}>{formatted(record.location)}{', '}{formatted(record.date)}</span>
                  : formatted(record.location || record.date || '')}
                {')'}</>}
              {record.curator?.trim() && <>{', '}{record.attribution || 'curated'}{' by '}{formatted(record.curator)}</>}{'.'}
            </p>
            {note && !separateNote && <p className="whitespace-pre-line">{formatted(note)}</p>}
          </>));
          if (note && (!hasSentence || separateNote)) rows.push(line(`${record.id}-note`, <p className="whitespace-pre-line">{formatted(note)}</p>));
          return rows;
        })}
      </ul>
    </section>}
  </>;
}
