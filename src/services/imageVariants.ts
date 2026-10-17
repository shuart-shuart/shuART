import manifest from '../data/imageVariants.json';
import { publicAssetUrl } from './publicAssetUrl';

interface ImageVariant { animated?: boolean; width: number; height: number; thumbnail: string; thumbnailWidth: number; display: string; displayWidth: number }
const variants = manifest as Record<string, ImageVariant>;

export function mediaFileName(url: string): string | null {
  try {
    const value = new URL(url, 'https://shuart-shuart.github.io/shuART/');
    const local = url.startsWith('/') || value.origin === 'https://shuart-shuart.github.io' || value.origin === 'https://raw.githubusercontent.com';
    if (value.origin === 'https://raw.githubusercontent.com' && !value.pathname.startsWith('/shuart-shuart/shuART/main/public/media/')) return null;
    const match = value.pathname.match(/(?:\/media\/|\/shuART\/media\/|\/shuart-shuart\/shuART\/main\/public\/media\/)([^/]+)$/);
    return local && match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

export function imageSource(url: string, thumbnail = false) {
  const name = mediaFileName(url);
  const variant = name ? variants[name] : undefined;
  const original = name ? publicAssetUrl(`/media/${encodeURIComponent(name)}`)! : publicAssetUrl(url)!;
  if (!variant) return { src: original, original };
  const display = publicAssetUrl(variant.display)!;
  const small = publicAssetUrl(variant.thumbnail)!;
  return {
    src: thumbnail ? small : display,
    srcSet: thumbnail || variant.animated ? undefined : [...new Map([[variant.thumbnailWidth, small], [variant.displayWidth, display]]).entries()].map(([width, src]) => `${src} ${width}w`).join(', '),
    width: variant.width, height: variant.height, original,
  };
}
