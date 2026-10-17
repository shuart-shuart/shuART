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
  const proseClassName = 'about-prose max-w-[65ch] font-sans text-black/85';
  const contactEmail = content.contactText.trim().match(/^\[[^\]]+\]\((mailto:[^)]+)\)$/i)?.[1];
  const contactInFooter = contactEmail && siteSettings.footer?.links.some(link => link.label.trim() && link.url.trim().toLowerCase() === contactEmail.toLowerCase());
  const render = (text: string) => renderFormattedText(text, { allEntries });
  const paragraphs = (text: string) => text.split(/\n\s*\n/).filter(p => p.trim()).map((p, i) => (
    <p key={i} className="whitespace-pre-line">{render(p)}</p>
  ));

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-14 pb-4 sm:pb-6 animate-fadeIn">
      <article className="about-page space-y-12">
        <header className="space-y-3 mb-10">
          <h1 className="font-editorial text-[24px] sm:text-[38.4px] text-black font-normal tracking-tight">{render(content.title)}</h1>
          <p className={proseClassName}>{render(content.artistName)}</p>
        </header>
        {content.biography.trim() && (
          <section className={`${proseClassName} space-y-6`}>
            {paragraphs(content.biography)}
          </section>
        )}
        {content.sections.filter(section => section.id !== 'cv-links').map(section => (
          <section key={section.id} className={`${proseClassName} pt-8 border-t border-black/10 space-y-6`}>
            {section.title && <h2 className="font-editorial text-[26px] sm:text-[28px] text-black font-normal">{render(section.title)}</h2>}
            {section.text.trim() && <div className="space-y-6">{paragraphs(section.text)}</div>}
            {section.items.length > 0 && (
              <div className="space-y-8">
                {section.items.map(item => (
                  <div key={item.id} className="space-y-3.5">
                    {item.title.trim() && <h3 className="font-sans text-[22px] sm:text-[24px] leading-[1.35] font-medium tracking-[-0.015em] text-black">{render(item.title)}</h3>}
                    <div className="space-y-6">{paragraphs(item.text)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        {content.contactText.trim() && !contactInFooter && (
          <section className={`${proseClassName} pt-8 border-t border-black/10 space-y-3`}>
            <h2 className="font-mono-quiet text-[14px] uppercase tracking-wider text-black/60">{render(content.contactTitle)}</h2>
            <div className="space-y-6">{paragraphs(content.contactText)}</div>
          </section>
        )}
      </article>
    </div>
  );
};
