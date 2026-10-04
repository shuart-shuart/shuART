// Keep bundled public files within the deployment subpath. Remote uploads remain unchanged.
export function publicAssetUrl(url: string | undefined): string | undefined {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  const base = import.meta.env.BASE_URL;
  if (base !== '/' && url.startsWith(base)) return url;
  return `${base}${url.slice(1)}`;
}
