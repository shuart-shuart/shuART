import React from 'react';
import { Download } from 'lucide-react';
import type { AboutContent } from '../types';
import { websiteEmbedUrl } from '../services/websiteEmbed';

export function CvLinks({ content }: { content: AboutContent }) {
  const section = content.sections.find(section => section.id === 'cv-links');
  const links = [...(section?.text || '').matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)];
  const download = links.find(link => /download/i.test(link[1]) || /[?&]format=pdf/.test(link[2]));
  const view = links.find(link => link !== download);
  const sourceUrl = websiteEmbedUrl(download?.[2] || view?.[2] || '');
  if (!sourceUrl) return null;
  // Older settings may contain only the Google Doc's editing/viewing URL.
  const doc = sourceUrl.match(/^https:\/\/docs\.google\.com\/document\/d\/([^/?#]+)(?:[/?#]|$)/);
  const pdfUrl = doc ? `https://docs.google.com/document/d/${doc[1]}/export?format=pdf` : sourceUrl;
  return <a href={pdfUrl} target="_blank" rel="noopener noreferrer" aria-label="Download CV as PDF" title="CV (PDF, opens in a new tab)" className="inline-flex items-center gap-1 py-0.5 text-sm font-sans text-black/60 hover:text-black focus-visible:underline underline-offset-4">
    CV <Download size={16} strokeWidth={1.5} aria-hidden="true" />
  </a>;
}
