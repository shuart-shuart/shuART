import { VideoProvider } from '../types';

export interface ParsedVideoInfo {
  provider: VideoProvider;
  embedUrl: string;
  cleanUrl: string;
  id: string;
}

/**
 * Validates Vimeo, YouTube, and Google Drive video links and converts them
 * into secure iframe embed URLs without autoplay. Disallows arbitrary embed HTML.
 */
export function parseVideoUrl(input: string): ParsedVideoInfo | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Explicitly reject raw HTML strings or script tags
  if (trimmed.startsWith('<') || trimmed.includes('<iframe') || trimmed.includes('<script')) {
    return null;
  }

  // 1. YouTube Detection
  // Examples:
  // https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // https://youtu.be/dQw4w9WgXcQ
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  // https://youtube.com/shorts/dQw4w9WgXcQ
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`,
      cleanUrl: `https://www.youtube.com/watch?v=${videoId}`,
      id: videoId,
    };
  }

  // 2. Vimeo Detection
  // Examples:
  // https://vimeo.com/111111111
  // https://player.vimeo.com/video/111111111
  const vimeoMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i
  );
  if (vimeoMatch && vimeoMatch[3]) {
    const vimeoId = vimeoMatch[3];
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=0&dnt=1`,
      cleanUrl: `https://vimeo.com/${vimeoId}`,
      id: vimeoId,
    };
  }

  // 3. Google Drive Video Detection
  // Examples:
  // https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
  // https://drive.google.com/open?id=1a2b3c4d5e
  // https://drive.google.com/file/d/1a2b3c4d5e/preview
  const driveFileMatch = trimmed.match(
    /(?:https?:\/\/)?drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i
  );
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return {
      provider: 'google_drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      cleanUrl: `https://drive.google.com/file/d/${fileId}/view`,
      id: fileId,
    };
  }

  return null;
}
