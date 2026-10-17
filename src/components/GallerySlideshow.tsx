import { ArtworkImage } from './ArtworkImage';
import React, { useEffect, useState, useRef } from 'react';
import type { EntryImage, ImageGalleryBlock } from '../types';
import { formattedTextToPlainText, renderFormattedText } from '../services/formatting';

export function GallerySlideshow({block, onOpen, isLightboxOpen = false}: {block:ImageGalleryBlock;onOpen:(image:EntryImage)=>void;isLightboxOpen?:boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
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
  const automatic=visible && !!block.autoPlay && !paused && !hovered && !focused && !reducedMotion && !isLightboxOpen && count>1;
  useEffect(()=>{
    if (!automatic) return;
    const interval=window.setInterval(()=>setIndex(current=>(current+1)%count),Math.min(20,Math.max(2,block.intervalSeconds || 5))*1000);
    return ()=>window.clearInterval(interval);
  },[automatic,count,block.intervalSeconds]);
  if (!count) return null;
  const image=block.images[index%count];
  const change=(direction:number)=>setIndex(current=>(current+direction+count)%count);
  return <div ref={root} className="space-y-3" aria-label="Image slideshow" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setFocused(false);}}>
    <figure className="space-y-2">
      <button type="button" className={block.showOutline ? 'flex items-center justify-center w-full h-[55vh] max-h-[70vh] cursor-zoom-in' : 'block w-full cursor-zoom-in'} onClick={()=>onOpen(image)} aria-label={`Enlarge image ${index%count+1} of ${count}`}>
        <ArtworkImage loading="lazy" src={image.url} alt={formattedTextToPlainText(image.alt || image.caption) || 'Artwork image'} className={block.showOutline ? 'w-auto h-auto max-w-full max-h-full object-contain border border-black/20' : 'w-full h-[55vh] max-h-[70vh] object-contain'} />
      </button>
      {(image.caption || image.credit) && <figcaption className="gallery-caption mx-auto text-center text-xs font-mono-quiet text-black">
        {image.caption && <span>{renderFormattedText(image.caption)}</span>}
        {image.caption && image.credit && <span aria-hidden="true"> · </span>}
        {image.credit && <span>Photo: {renderFormattedText(image.credit)}</span>}
      </figcaption>}
    </figure>
    {count>1 && <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs font-mono-quiet text-black/60 [&_button:hover]:text-black [&_button:focus-visible]:text-black">
      <button type="button" onClick={()=>change(-1)}>← Previous</button>
      <span>{index%count+1} / {count}</span>
      {block.autoPlay && <button type="button" disabled={reducedMotion} onClick={()=>setPaused(value=>!value)}>{reducedMotion ? 'Autoplay off' : paused ? 'Play' : 'Pause'}</button>}
      <button type="button" onClick={()=>change(1)}>Next →</button>
    </div>}
  </div>;
}
