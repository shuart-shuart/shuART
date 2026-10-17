import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React, { useEffect, useRef } from 'react';
import { imageSource } from '../services/imageVariants';
import { EntryImage } from '../types';

interface LightboxProps {
  image: EntryImage | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<LightboxProps> = ({ image, onClose }) => {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!image) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const nodes = [...(dialog.current?.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]') || [])];
        const first = nodes[0], last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [image, onClose]);
  if (!image) return null;

  return (
    <div
      ref={dialog}
      aria-label="Image detail"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-neutral-500/30 flex flex-col justify-between p-6 sm:p-10 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="flex justify-between items-center text-xs font-mono-quiet text-black/65">
        <span>Image detail</span>
        <button
          ref={close}
          onClick={onClose}
          className="hover:text-black px-2 py-1 border border-black/20"
        >
          Close (Esc)
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={imageSource(image.url).original}
          alt={formattedTextToPlainText(image.alt || image.caption) || 'Archive document'}
          className="max-h-[82vh] max-w-full object-contain cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-1">
        {image.caption && (
          <p className="text-sm font-editorial text-black/90">{renderFormattedText(image.caption)}</p>
        )}
        <div className="text-xs font-mono-quiet text-black/65 flex justify-center gap-3">
          {image.alt && <span>Alt: {renderFormattedText(image.alt)}</span>}
          {image.credit && <span>Photo: {renderFormattedText(image.credit)}</span>}
        </div>
      </div>
    </div>
  );
};
