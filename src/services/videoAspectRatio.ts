import type { VideoBlock } from '../types';

export function videoAspectRatio(block: Pick<VideoBlock, 'aspectRatio' | 'originalUrl'>): number {
  const parts = block.aspectRatio?.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
  if (parts) {
    const ratio = Number(parts[1]) / Number(parts[2]);
    if (Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10) return ratio;
  }
  try {
    const url = new URL(block.originalUrl);
    if (/^(www\.|m\.)?youtube\.com$/.test(url.hostname) && url.pathname.startsWith('/shorts/')) return 9 / 16;
  } catch { /* Use the standard landscape frame until proportions are supplied. */ }
  return 16 / 9;
}

export function videoFrameStyle(ratio: number) {
  return { aspectRatio: String(ratio), width: ratio < 1 ? `min(100%, ${ratio * 80}vh)` : '100%' };
}
