import React, { useEffect, useState } from 'react';
import type { EntryImage, ImageGalleryBlock } from '../types';
import { formattedTextToPlainText, renderFormattedText } from '../services/formatting';

export function GallerySlideshow({block, onOpen, isLightboxOpen = false}: {block:ImageGalleryBlock;onOpen:(image:EntryImage)=>void;isLightboxOpen?:boolean}) {
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  const [hovered,setHovered] = useState(false);
  const [focused,setFocused] = useState(false);
  const [reducedMotion,setReducedMotion] = useState(false);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(query.matches);
    update(); query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  const count=block.images.length;
  const automatic=!!block.autoPlay && !paused && !hovered && !focused && !reducedMotion && !isLightboxOpen && count>1;
  useEffect(()=>{
    if (!automatic) return;
    const interval=window.setInterval(()=>setIndex(current=>(current+1)%count),Math.min(20,Math.max(2,block.intervalSeconds || 5))*1000);
    return ()=>window.clearInterval(interval);
  },[automatic,count,block.intervalSeconds]);
  if (!count) return null;
  const image=block.images[index%count];
  const change=(direction:number)=>setIndex(current=>(current+direction+count)%count);
  return <div className="space-y-3" aria-label="Image slideshow" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setFocused(false);}}>
    <figure className="space-y-2">
      <button type="button" className="block w-full cursor-zoom-in" onClick={()=>onOpen(image)} aria-label={`Enlarge image ${index%count+1} of ${count}`}>
        <img src={image.url} alt={formattedTextToPlainText(image.alt || image.caption) || 'Artwork image'} className="w-full h-[55vh] max-h-[70vh] object-contain" />
      </button>
      {(image.caption || image.credit) && <figcaption className="text-xs font-mono-quiet text-black/60 space-y-1">
        {image.caption && <p>{renderFormattedText(image.caption)}</p>}
        {image.credit && <p>Photo: {renderFormattedText(image.credit)}</p>}
      </figcaption>}
    </figure>
    {count>1 && <div className="flex justify-between items-center gap-4 text-xs font-mono-quiet">
      <button type="button" onClick={()=>change(-1)}>← Previous</button>
      <span>{index%count+1} / {count}</span>
      {block.autoPlay && <button type="button" disabled={reducedMotion} onClick={()=>setPaused(value=>!value)}>{reducedMotion ? 'Autoplay off' : paused ? 'Play' : 'Pause'}</button>}
      <button type="button" onClick={()=>change(1)}>Next →</button>
    </div>}
  </div>;
}
