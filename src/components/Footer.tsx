import React from 'react';
import { SiteSettings, ViewMode } from '../types';
import { DEFAULT_FOOTER } from '../data/siteContent';
import { renderFormattedText } from '../services/formatting';
import { publicAssetUrl } from '../services/publicAssetUrl';

interface FooterProps {
  siteSettings: SiteSettings;
  onNavigateView: (view: ViewMode) => void;
}

export function footerLinkHref(value: string): string | undefined {
  const url = value.trim();
  if (!url) return undefined;
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(url)) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return publicAssetUrl(url);
  if (/^[^\s:/]+\.[^\s:]+$/.test(url)) return `https://${url}`;
  return undefined;
}

export const Footer: React.FC<FooterProps> = ({ siteSettings, onNavigateView }) => {
  const content = siteSettings.footer ?? DEFAULT_FOOTER;
  const links = content.links.map(link => ({ ...link, href: footerLinkHref(link.url) })).filter(link => link.label.trim() && link.href);
  const linkClass = 'hover:text-black underline decoration-dotted underline-offset-4';
  return (
    <footer className="border-t border-black/10 mt-24 py-12 px-5 sm:px-8 text-xs text-black/60 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-baseline gap-6">
        <div className="space-y-1">
          <p className="font-editorial text-sm text-black">{renderFormattedText(content.artistName)}</p>
          <p className="font-serif italic text-xs text-black/50 whitespace-pre-line">{renderFormattedText(content.description)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 font-mono-quiet text-xs text-black/70">
          {links.map((link, index) => (
            <React.Fragment key={link.id}>
              {index > 0 && <span className="text-black/25" aria-hidden="true">·</span>}
              {link.href === '#about' ? (
                <button onClick={() => onNavigateView('about')} className={linkClass}>{link.label}</button>
              ) : (
                <a href={link.href} target={/^https?:/i.test(link.href!) ? '_blank' : undefined} rel="noopener noreferrer" className={linkClass}>{link.label}</a>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
};
