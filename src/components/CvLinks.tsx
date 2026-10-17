import React from 'react';
import { Download } from 'lucide-react';
import type { AboutContent } from '../types';
import { websiteEmbedUrl } from '../services/websiteEmbed';

export function CvLinks({ content }: { content: AboutContent }) {
  const section = content.sections.find(section => section.id === 'cv-links');
  const links = [...(section?.text || '').matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)];
  const download = links.find(link => /download/i.test(link[1]) || /[?&]format=pdf/.test(link[2]));
  const view = links.find(link => link !== download);
  const viewUrl = view && websiteEmbedUrl(view[2]);
  const downloadUrl = download && websiteEmbedUrl(download[2]);
  if (!viewUrl && !downloadUrl) return null;
  return <div className="flex items-center gap-2 pt-2 text-sm font-mono-quiet">
    {viewUrl ? <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4 hover:text-black/60" title="View CV">CV</a> : <span>CV</span>}
    {downloadUrl && <a href={downloadUrl} target="_blank" rel="noopener noreferrer" aria-label="Download CV as PDF" title="Download CV (PDF)" className="inline-flex p-1 hover:text-black/60 focus-visible:outline focus-visible:outline-1">
      <Download size={16} strokeWidth={1.5} aria-hidden="true" />
    </a>}
  </div>;
}
