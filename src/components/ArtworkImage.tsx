import React from 'react';
import { imageSource } from '../services/imageVariants';

export function ArtworkImage({ src, thumbnail = false, sizes = '(min-width: 1024px) 900px, 100vw', ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; thumbnail?: boolean }) {
  const source = imageSource(src, thumbnail);
  return <img {...props} src={source.src} srcSet={source.srcSet} sizes={source.srcSet ? sizes : undefined} width={source.width} height={source.height} decoding="async" />;
}
