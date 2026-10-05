import React from 'react';
import { AboutContent, Entry, FooterContent, IndexContent } from '../../types';
import { FormattedField } from './FormattedField';

interface Props {
  index: IndexContent;
  onIndexChange: (index: IndexContent) => void;
  about: AboutContent;
  footer: FooterContent;
  entries: Entry[];
  onAboutChange: (about: AboutContent) => void;
  onFooterChange: (footer: FooterContent) => void;
}

const newId = () => crypto.randomUUID();
const inputClass = 'w-full border border-black/20 p-2 text-sm bg-white focus:border-black';
const buttonClass = 'text-xs underline decoration-dotted underline-offset-4 hover:text-black/60';

export const EditorSiteContentSection: React.FC<Props> = ({ index, onIndexChange, about, footer, entries, onAboutChange, onFooterChange }) => {
  const field = (label: string, value: string, onChange: (value: string) => void, multiline = false) => (
    <FormattedField label={label} value={value} onChange={onChange} multiline={multiline} rows={multiline ? 5 : undefined} allEntries={entries} />
  );
  const updateSection = (id: string, patch: Partial<AboutContent['sections'][number]>) => onAboutChange({
    ...about, sections: about.sections.map(section => section.id === id ? { ...section, ...patch } : section),
  });
  return (
    <>
      <section className="p-6 border border-black/15 bg-white space-y-6">
        <h3 className="font-editorial text-xl text-black">Index page</h3>
        <p className="text-xs text-black/60">Edit the heading and introduction above the entry list. Save using “Save All Settings”, then Publish to GitHub.</p>
        {field('Index heading', index.title, title => onIndexChange({ ...index, title }))}
        {field('Index introduction', index.description, description => onIndexChange({ ...index, description }), true)}
      </section>
      <section className="p-6 border border-black/15 bg-white space-y-6">
        <h3 className="font-editorial text-xl text-black">About page</h3>
        <p className="text-xs text-black/60">Edit the biography, sections and contact information. Separate paragraphs with a blank line. Save using “Save All Settings”.</p>
        {field('Page title', about.title, title => onAboutChange({ ...about, title }))}
        {field('Artist name on About page', about.artistName, artistName => onAboutChange({ ...about, artistName }))}
        {field('Biography', about.biography, biography => onAboutChange({ ...about, biography }), true)}
        {about.sections.map((section, index) => (
          <div key={section.id} className="border border-black/15 p-4 space-y-4">
            <div className="flex flex-wrap justify-between gap-3 items-center">
              <h4 className="text-sm font-medium">Section {index + 1}</h4>
              <div className="flex gap-4">
                <button type="button" className={buttonClass} disabled={index === 0} onClick={() => {
                  const sections = [...about.sections];
                  [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
                  onAboutChange({ ...about, sections });
                }}>Move up</button>
                <button type="button" className={buttonClass} onClick={() => onAboutChange({ ...about, sections: about.sections.filter(s => s.id !== section.id) })}>Remove section</button>
              </div>
            </div>
            {field('Section heading', section.title, title => updateSection(section.id, { title }))}
            {field('Section text', section.text, text => updateSection(section.id, { text }), true)}
            {section.items.map((item, itemIndex) => (
              <div key={item.id} className="pl-4 border-l border-black/15 space-y-3">
                <div className="flex justify-between text-xs">
                  <span>Column item {itemIndex + 1}</span>
                  <button type="button" className={buttonClass} onClick={() => updateSection(section.id, { items: section.items.filter(i => i.id !== item.id) })}>Remove item</button>
                </div>
                {field('Item heading', item.title, title => updateSection(section.id, { items: section.items.map(i => i.id === item.id ? { ...i, title } : i) }))}
                {field('Item text', item.text, text => updateSection(section.id, { items: section.items.map(i => i.id === item.id ? { ...i, text } : i) }), true)}
              </div>
            ))}
            <button type="button" className={buttonClass} onClick={() => updateSection(section.id, { items: [...section.items, { id: newId(), title: '', text: '' }] })}>Add column item</button>
          </div>
        ))}
        <button type="button" className={buttonClass} onClick={() => onAboutChange({ ...about, sections: [...about.sections, { id: newId(), title: '', text: '', items: [] }] })}>Add About section</button>
        {field('Contact heading', about.contactTitle, contactTitle => onAboutChange({ ...about, contactTitle }))}
        {field('Contact text and links', about.contactText, contactText => onAboutChange({ ...about, contactText }), true)}
      </section>
      <section className="p-6 border border-black/15 bg-white space-y-6">
        <h3 className="font-editorial text-xl text-black">Footer</h3>
        {field('Artist name in footer', footer.artistName, artistName => onFooterChange({ ...footer, artistName }))}
        {field('Footer description', footer.description, description => onFooterChange({ ...footer, description }), true)}
        <p className="text-xs text-black/60">Edit each link’s label and destination. Use #about for the About page, mailto: for email, or an https:// address. A blank destination hides the link.</p>
        {footer.links.map((link, index) => (
          <div key={link.id} className="border border-black/15 p-4 space-y-3">
            <div className="flex justify-between gap-3 items-center">
              <h4 className="text-sm font-medium">Link {index + 1}</h4>
              <div className="flex gap-4">
                <button type="button" className={buttonClass} disabled={index === 0} onClick={() => {
                  const links = [...footer.links];
                  [links[index - 1], links[index]] = [links[index], links[index - 1]];
                  onFooterChange({ ...footer, links });
                }}>Move up</button>
                <button type="button" className={buttonClass} onClick={() => onFooterChange({ ...footer, links: footer.links.filter(l => l.id !== link.id) })}>Remove link</button>
              </div>
            </div>
            <label className="block text-xs space-y-1">Link label
              <input className={inputClass} value={link.label} onChange={e => onFooterChange({ ...footer, links: footer.links.map(l => l.id === link.id ? { ...l, label: e.target.value } : l) })} />
            </label>
            <label className="block text-xs space-y-1">Link destination
              <input className={inputClass} value={link.url} onChange={e => onFooterChange({ ...footer, links: footer.links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l) })} placeholder="https://… or #about" />
            </label>
          </div>
        ))}
        <button type="button" className={buttonClass} onClick={() => onFooterChange({ ...footer, links: [...footer.links, { id: newId(), label: '', url: '' }] })}>Add footer link</button>
      </section>
    </>
  );
};
