import React from 'react';
import { ViewMode } from '../types';

interface FooterProps {
  onNavigateView: (view: ViewMode) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateView }) => {
  return (
    <footer className="border-t border-black/10 mt-24 py-12 px-5 sm:px-8 text-xs text-black/60 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-baseline gap-6">
        {/* Brand identity */}
        <div className="space-y-1">
          <p className="font-editorial text-sm text-black">
            Hong Shu-ying <span className="font-normal text-black/80 whitespace-nowrap">方舒颖</span>
          </p>
          <p className="font-serif italic text-xs text-black/50">
            Archive, instructional scores, transcription, and library inquiries.
          </p>
        </div>

        {/* Contact & external links */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 font-mono-quiet text-xs text-black/70">
          <a
            href="mailto:work@anotherunit.xyz"
            className="hover:text-black hover:underline"
          >
            work@anotherunit.xyz
          </a>
          <span className="text-black/25">·</span>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-black hover:underline"
          >
            Instagram
          </a>
          <span className="text-black/25">·</span>
          <button
            onClick={() => onNavigateView('about')}
            className="hover:text-black hover:underline focus:outline-none"
          >
            CV & Bio
          </button>
          <span className="text-black/25">·</span>
          <a
            href="https://hongshuying.art"
            target="_blank"
            rel="noreferrer"
            className="hover:text-black hover:underline"
          >
            hongshuying.art
          </a>
        </div>
      </div>
    </footer>
  );
};
