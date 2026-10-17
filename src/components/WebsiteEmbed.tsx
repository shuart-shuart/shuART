import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { WebsiteBlock } from '../types';
import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import { websiteEmbedUrl } from '../services/websiteEmbed';

export function WebsiteEmbed({ block }: { block: WebsiteBlock }) {
  const [loadedUrl, setLoadedUrl] = useState('');
  const url = websiteEmbedUrl(block.url, import.meta.env?.BASE_URL || '/');
  if (!url) return null;
  const title = formattedTextToPlainText(block.title) || 'Project website';
  const loaded = block.clickToLoad === false || loadedUrl === url;
  return <figure className="space-y-3">
    {block.title && <h4 className="font-editorial text-lg sm:text-xl">{renderFormattedText(block.title)}</h4>}
    {loaded ? <iframe
      src={url}
      title={title}
      loading="lazy"
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className="block w-full aspect-[3/2] border border-black/20 bg-white"
    /> : <button type="button" onClick={() => setLoadedUrl(url)} className="w-full aspect-[3/2] border border-black/20 p-5 bg-black/[0.025] text-sm font-mono-quiet hover:bg-black/5 focus-visible:outline focus-visible:outline-1">
      Load website
    </button>}
    <figcaption className="space-y-2 text-center text-xs font-mono-quiet text-black/60">
      {block.caption && <p>{renderFormattedText(block.caption)}</p>}
      <p>If the embedded page doesn’t load, <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 hover:text-black">
        open here. <ArrowUpRight size={12} aria-hidden="true" />
      </a></p>
    </figcaption>
  </figure>;
}
