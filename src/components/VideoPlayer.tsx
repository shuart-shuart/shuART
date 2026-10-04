import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React from 'react';
import { VideoBlock } from '../types';

interface VideoPlayerProps {
  block: VideoBlock;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ block }) => {
  const isDrive = block.provider === 'google_drive';

  return (
    <figure className="my-8 space-y-3 font-sans">
      {/* Optional Title above player */}
      {block.title && (
        <h4 className="font-editorial text-lg text-black font-normal">
          {renderFormattedText(block.title)}
        </h4>
      )}

      {/* Responsive 16:9 Video Embed Container */}
      <div className="relative w-full aspect-video bg-black/[0.04] border border-black/15 overflow-hidden">
        <iframe
          src={block.embedUrl}
          title={formattedTextToPlainText(block.title) || 'Video player'}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>

      {/* Caption, Credits & Fallback Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 text-xs font-mono-quiet text-black/60 pt-1">
        <div className="space-y-0.5 max-w-2xl">
          {block.caption && (
            <p className="text-black/80">{renderFormattedText(block.caption)}</p>
          )}
          {block.credit && (
            <p className="text-[11px] text-black/50">Credit: {renderFormattedText(block.credit)}</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <a
            href={block.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline hover:text-black/70 inline-flex items-center gap-1"
            title="Open video in original provider tab"
          >
            Open video ↗
          </a>
        </div>
      </div>

      {/* Google Drive Sharing Permission Guidance */}
      {isDrive && (
        <div className="p-2.5 bg-black/[0.02] border border-black/10 text-[11px] font-mono-quiet text-black/60 space-y-0.5">
          <span className="text-black font-medium">Google Drive playback notice:</span>{' '}
          If playback does not start or reports an authorization restriction, ensure the file's sharing setting in Google Drive is configured to <em>"Anyone with the link can view"</em>.
        </div>
      )}
    </figure>
  );
};
