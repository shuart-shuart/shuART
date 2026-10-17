import { imageSource } from '../services/imageVariants';
import { ArtworkImage } from './ArtworkImage';
import React, { useEffect, useState, useRef } from 'react';
import type { EntryImage, ImageGalleryBlock } from '../types';
import { formattedTextToPlainText, renderFormattedText } from '../services/formatting';

export function GallerySlideshow({block, onOpen, isLightboxOpen = false}: {block:ImageGalleryBlock;onOpen:(image:EntryImage)=>void;isLightboxOpen?:boolean}) {
  const root = useRef<HTMLDivElement>(null);
  const firstImage = block.images[0];
  const firstSource = firstImage ? imageSource(firstImage.url) : undefined;
  const [measuredFrame, setMeasuredFrame] = useState<{ url: string; ratio: number }>();
  const knownRatio = firstSource?.width && firstSource?.height ? firstSource.width / firstSource.height : undefined;
  const frameRatio = knownRatio || (measuredFrame?.url === firstImage?.url ? measuredFrame?.ratio : undefined) || 16 / 9;
  useEffect(() => {
    if (!firstImage || knownRatio || !firstSource) return;
    // New uploads and external images may not yet be in the build manifest.
    const probe = new window.Image();
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) setMeasuredFrame({ url: firstImage.url, ratio: probe.naturalWidth / probe.naturalHeight });
    };
    probe.src = firstSource.src;
    return () => { probe.onload = null; };
  }, [firstImage?.url, firstSource?.src, knownRatio]);
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
      <button type="button"
        className="relative block mx-auto max-w-full bg-white cursor-zoom-in"
        style={{ aspectRatio: String(frameRatio), width: `min(100%, ${55 * frameRatio}vh)` }}
        onClick={()=>onOpen(image)} aria-label={`Enlarge image ${index%count+1} of ${count}`}>
        <span className="absolute inset-0 flex items-center justify-center">
          <ArtworkImage loading="lazy" src={image.url} alt={formattedTextToPlainText(image.alt || image.caption) || 'Artwork image'}
            className={`w-auto h-auto max-w-full max-h-full object-contain${block.showOutline ? ' border border-black/20' : ''}`} />
        </span>
      </button>
      {block.images.some(item => item.caption || item.credit) && <figcaption className="gallery-caption grid mx-auto text-center text-xs font-mono-quiet text-black">
        {/* Overlapping hidden copies reserve the tallest caption at any viewport width. */}
        {block.images.map((item, position) => <div key={item.id || position} aria-hidden="true" inert className="invisible pointer-events-none select-none min-w-0 col-start-1 row-start-1">
          {item.caption && <span>{renderFormattedText(item.caption)}</span>}
          {item.caption && item.credit && <span> · </span>}
          {item.credit && <span>Photo: {renderFormattedText(item.credit)}</span>}
        </div>)}
        <div className="min-w-0 col-start-1 row-start-1" data-gallery-caption="active">
          {image.caption && <span>{renderFormattedText(image.caption)}</span>}
          {image.caption && image.credit && <span aria-hidden="true"> · </span>}
          {image.credit && <span>Photo: {renderFormattedText(image.credit)}</span>}
        </div>
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
