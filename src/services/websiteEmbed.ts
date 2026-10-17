export function websiteEmbedUrl(value: string, basePath = '/'): string | null {
  const raw = value.trim();
  if (!raw || /[\u0000-\u0020\\]/.test(raw)) return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    if (basePath !== '/' && !raw.startsWith(basePath)) return `${basePath}${raw.slice(1)}`;
    return raw;
  }
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function websiteEmbedHeight(value: number | undefined) {
  return Number.isFinite(value) ? Math.min(1200, Math.max(320, value!)) : 640;
}
