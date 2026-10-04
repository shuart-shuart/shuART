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
    {credits.length > 0 && <section aria-label="Credits" className="pt-8 border-t border-black/10 my-8">
      <dl className="space-y-3 text-sm">
        {credits.map(credit => <div key={credit.id} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
          <dt className="font-mono-quiet text-xs text-black/50 capitalize">{formatted(credit.role === 'custom' ? credit.customRole || 'Contributor' : credit.role)}</dt>
          <dd className="whitespace-pre-line">{linkedText(credit.name, credit.link)}</dd>
        </div>)}
      </dl>
    </section>}
    {records.length > 0 && <section aria-label="Provenance / Presentation History" className="my-8 space-y-4">
      <ol className="space-y-5">
        {records.map(record => {
          const event = record.title.trim() || record.venue.trim();
          const details = [record.title.trim() ? record.venue : '', record.location, record.date].filter(value => value?.trim());
          const hasSentence = event || details.length > 0 || record.curator?.trim() || record.link?.trim();
          return <li key={record.id} className="space-y-2 text-sm leading-relaxed whitespace-pre-line">
            {hasSentence && <p>
              <span className="font-editorial italic">{formatted(entry.title)}</span>{' was '}{record.action || 'presented'}
              {event && <>{' at '}{linkedText(event, record.link)}</>}
              {!event && record.link?.trim() && <>{' at '}{linkedText('a presentation', record.link)}</>}
              {details.length > 0 && <>{' ('}{details.map((text, index) => <React.Fragment key={index}>{index > 0 && ', '}{formatted(text)}</React.Fragment>)}{')'}</>}
              {record.curator?.trim() && <>{', '}{record.attribution || 'curated'}{' by '}{formatted(record.curator)}</>}{'.'}
            </p>}
            {record.note && <p>{formatted(record.note)}</p>}
          </li>;
        })}
      </ol>
    </section>}
  </>;
}
