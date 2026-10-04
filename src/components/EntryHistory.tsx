import React from 'react';
import { Entry } from '../types';
import { renderFormattedText } from '../services/formatting';

function safeLink(value?: string): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  return /^(https?:\/\/|mailto:|#entry\/)/i.test(url) ? url : undefined;
}

export function EntryHistory({ entry, allEntries, onSelectEntry }: {
  entry: Entry;
  allEntries: Entry[];
  onSelectEntry: (slugOrId: string) => void;
}) {
  const formatted = (text: string) => renderFormattedText(text, { allEntries, onSelectEntry });
  const credits = (entry.credits || []).filter(credit => credit.name.trim() || credit.link?.trim());
  const records = (entry.presentationHistory || []).filter(record =>
    [record.title, record.venue, record.location, record.date, record.curator, record.link, record.note].some(value => value?.trim())
  );
  const link = (url?: string) => {
    const href = safeLink(url);
    return href ? <a href={href} target={href.startsWith('#') ? undefined : '_blank'} rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 text-black/70 hover:text-black">View link</a> : null;
  };
  return <>
    {credits.length > 0 && <section aria-label="Additional Credits" className="pt-8 border-t border-black/10 my-8 space-y-4">
      <h2 className="font-editorial text-xl">Additional Credits</h2>
      <dl className="space-y-3 text-sm">
        {credits.map(credit => <div key={credit.id} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
          <dt className="font-mono-quiet text-xs text-black/50 capitalize">{formatted(credit.role === 'custom' ? credit.customRole || 'Contributor' : credit.role)}</dt>
          <dd className="space-y-1 whitespace-pre-line"><div>{formatted(credit.name)}</div>{link(credit.link)}</dd>
        </div>)}
      </dl>
    </section>}
    {records.length > 0 && <section aria-label="Provenance / Presentation History" className="pt-8 border-t border-black/10 my-8 space-y-4">
      <h2 className="font-editorial text-xl">Provenance / Presentation History</h2>
      <ol className="space-y-5">
        {records.map(record => <li key={record.id} className="space-y-2 text-sm whitespace-pre-line">
          {record.title && <h3 className="font-editorial text-lg">{formatted(record.title)}</h3>}
          {[record.date, record.venue, record.location].filter(Boolean).length > 0 && <div className="text-black/60">
            {[record.date, record.venue, record.location].filter(Boolean).map((text, index) => <React.Fragment key={index}>{index > 0 && ' · '}{formatted(text)}</React.Fragment>)}
          </div>}
          {record.curator && <p><span className="text-black/50">Curator / Organiser: </span>{formatted(record.curator)}</p>}
          {record.note && <p className="leading-relaxed">{formatted(record.note)}</p>}
          {link(record.link)}
        </li>)}
      </ol>
    </section>}
  </>;
}
