import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React from 'react';
import { EntryImage } from '../types';

interface LightboxProps {
  image: EntryImage | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<LightboxProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col justify-between p-6 sm:p-10 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="flex justify-between items-center text-xs font-mono-quiet text-black/50">
        <span>Image detail</span>
        <button
          onClick={onClose}
          className="hover:text-black px-2 py-1 border border-black/20"
        >
          Close (Esc)
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={image.url}
          alt={formattedTextToPlainText(image.alt || image.caption) || 'Archive document'}
          className="max-h-[82vh] max-w-full object-contain cursor-default shadow-sm border border-black/5"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-1">
        {image.caption && (
          <p className="text-sm font-editorial text-black/90">{renderFormattedText(image.caption)}</p>
        )}
        <div className="text-xs font-mono-quiet text-black/50 flex justify-center gap-3">
          {image.alt && <span>Alt: {renderFormattedText(image.alt)}</span>}
          {image.credit && <span>Photo: {renderFormattedText(image.credit)}</span>}
        </div>
      </div>
    </div>
  );
};
