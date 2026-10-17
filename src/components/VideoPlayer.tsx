import { videoAspectRatio, videoFrameStyle } from '../services/videoAspectRatio';
import { renderFormattedText, formattedTextToPlainText } from '../services/formatting';
import React from 'react';
import { VideoBlock } from '../types';
import { YouTubePlayer } from './YouTubePlayer';
import { youtubeVideoId } from '../services/youtubePlayer';

interface VideoPlayerProps {
  block: VideoBlock;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ block }) => {
  const ratio = videoAspectRatio(block);
  const youtubeId = block.provider === 'youtube' ? youtubeVideoId(block.originalUrl) || youtubeVideoId(block.embedUrl) : null;

  return (
    <figure className="my-8 space-y-3 font-sans">
      {/* Optional Title above player */}
      {block.title && (
        <h4 className="font-editorial text-lg text-black font-normal">
          {renderFormattedText(block.title)}
        </h4>
      )}

      {/* Match the source proportions without cropping. */}
      {youtubeId ? <YouTubePlayer key={youtubeId} videoId={youtubeId} aspectRatio={ratio} title={formattedTextToPlainText(block.title) || 'Video'} /> : <div style={videoFrameStyle(ratio)} className="relative mx-auto bg-white overflow-hidden">
        <iframe
          src={block.embedUrl}
          title={formattedTextToPlainText(block.title) || 'Video player'}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>}

      {(block.caption || block.credit) && <figcaption className="text-center text-xs font-mono-quiet text-black/65 space-y-1">
        {block.caption && <p>{renderFormattedText(block.caption)}</p>}
        {block.credit && <p>Credit: {renderFormattedText(block.credit)}</p>}
      </figcaption>}
    </figure>
  );
};
