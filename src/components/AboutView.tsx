import React from 'react';
import { Entry, SiteSettings, ViewMode } from '../types';
import { DEFAULT_ABOUT } from '../data/siteContent';
import { renderFormattedText } from '../services/formatting';

interface AboutViewProps {
  siteSettings: SiteSettings;
  allEntries?: Entry[];
  onNavigateView: (view: ViewMode) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ siteSettings, allEntries = [] }) => {
  const content = siteSettings.about ?? DEFAULT_ABOUT;
  const render = (text: string) => renderFormattedText(text, { allEntries });
  const paragraphs = (text: string) => text.split(/\n\s*\n/).filter(p => p.trim()).map((p, i) => (
    <p key={i} className="whitespace-pre-line">{render(p)}</p>
  ));

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-14 animate-fadeIn">
      <article className="space-y-12">
        <header className="space-y-3 mb-10">
          <h1 className="font-editorial text-3xl sm:text-5xl text-black font-normal tracking-tight">{render(content.title)}</h1>
          <p className="font-editorial text-2xl sm:text-3xl text-black/80 font-light leading-snug">{render(content.artistName)}</p>
        </header>
        {content.biography.trim() && (
          <section className="max-w-[65ch] text-base sm:text-lg text-black/85 leading-[1.65] space-y-6">
            {paragraphs(content.biography)}
          </section>
        )}
        {content.sections.map(section => (
          <section key={section.id} className="my-14 pt-10 border-t border-black/10 space-y-6 max-w-4xl">
            {section.title && <h2 className="font-editorial text-2xl text-black font-normal">{render(section.title)}</h2>}
            {section.text.trim() && <div className="space-y-4 text-base sm:text-lg text-black/75 leading-[1.65] max-w-[65ch]">{paragraphs(section.text)}</div>}
            {section.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-base sm:text-lg leading-[1.65]">
                {section.items.map(item => (
                  <div key={item.id} className="space-y-1.5">
                    <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">{render(item.title)}</h3>
                    <div className="text-black/70 space-y-3">{paragraphs(item.text)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        {content.contactText.trim() && (
          <section className="my-14 pt-10 border-t border-black/10 text-sm space-y-1">
            <h2 className="font-mono-quiet text-xs uppercase tracking-wider text-black/40">{render(content.contactTitle)}</h2>
            <div className="font-editorial text-lg text-black space-y-3">{paragraphs(content.contactText)}</div>
          </section>
        )}
      </article>
    </div>
  );
};
