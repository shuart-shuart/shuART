import type { CSSProperties } from 'react';
import type { FontRole, FontSettings } from '../types';

export const DEFAULT_FONTS: FontSettings = { body: 'Source Sans 3', title: 'Newsreader', label: 'IBM Plex Mono', chinese: 'Noto Sans SC' };
export const FONT_CHOICES: Record<FontRole, string[]> = {
  body: ['Source Sans 3', 'Inter', 'DM Sans', 'Work Sans', 'Source Serif 4', 'Newsreader'],
  title: ['Newsreader', 'EB Garamond', 'Source Serif 4', 'Libre Baskerville', 'Cormorant Garamond', 'DM Serif Display'],
  label: ['IBM Plex Mono', 'Roboto Mono', 'Space Mono', 'Inconsolata', 'DM Mono'],
  chinese: ['Noto Sans SC', 'Noto Serif SC', 'ZCOOL XiaoWei'],
};
const normalAndItalic = 'ital,wght@0,400;0,500;0,600;1,400';
const specs: Record<string,string> = {
  'Source Sans 3': normalAndItalic, 'Inter': normalAndItalic, 'DM Sans': normalAndItalic, 'Work Sans': normalAndItalic,
  'Newsreader': normalAndItalic, 'Source Serif 4': normalAndItalic, 'EB Garamond': normalAndItalic, 'Cormorant Garamond': normalAndItalic,
  'Libre Baskerville': 'ital,wght@0,400;0,700;1,400', 'DM Serif Display': 'ital@0;1',
  'IBM Plex Mono': 'ital,wght@0,400;0,500;1,400', 'Roboto Mono': 'ital,wght@0,400;0,500;1,400',
  'Space Mono': 'ital,wght@0,400;0,700;1,400', 'Inconsolata': 'wght@400;500', 'DM Mono': 'ital,wght@0,400;0,500;1,400',
  'Noto Sans SC': 'wght@400;500;600', 'Noto Serif SC': 'wght@400;500;600', 'ZCOOL XiaoWei': 'wght@400',
};

export function cleanFontFamily(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const family = value.trim().replace(/\s+/g, ' ');
  return /^[\p{L}\p{N}][\p{L}\p{N} .’'\-]{0,79}$/u.test(family) ? family : null;
}
export function resolveFonts(value?: Partial<FontSettings>): FontSettings {
  return Object.fromEntries(Object.entries(DEFAULT_FONTS).map(([role, fallback]) => [role, cleanFontFamily(value?.[role as FontRole]) || fallback])) as unknown as FontSettings;
}
export function googleFontUrl(value: string): string {
  const family = cleanFontFamily(value);
  if (!family) throw new Error('Enter a Google Fonts family name, such as Source Sans 3.');
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}${specs[family] ? ':' + specs[family] : ''}&display=swap`;
}
export function fontVariables(value?: Partial<FontSettings>): CSSProperties {
  const fonts = resolveFonts(value);
  const chinese = [...new Set([fonts.chinese, DEFAULT_FONTS.chinese])].map(name => JSON.stringify(name)).join(', ');
  const stack = (role: 'title' | 'body' | 'label', generic: string) => [...new Set([fonts[role], DEFAULT_FONTS[role], fonts.chinese, DEFAULT_FONTS.chinese])].map(name => JSON.stringify(name)).join(', ') + ', ' + generic;
  const title = stack('title', 'serif');
  const body = stack('body', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
  const label = stack('label', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace');
  return { '--font-chinese': chinese, '--font-display-serif': title, '--font-serif': title,
    '--font-sans': body, '--font-mono': label, '--font-combo-a': title, '--font-combo-c': body } as CSSProperties;
}

const requests = new Map<string, Promise<void>>();
const preloaded = new Set(Object.values(DEFAULT_FONTS));
export function loadGoogleFont(value: string): Promise<void> {
  const family = cleanFontFamily(value);
  if (!family) return Promise.reject(new Error('Enter a font family name.'));
  if (preloaded.has(family)) return Promise.resolve();
  const existing = requests.get(family);
  if (existing) return existing;
  const request = new Promise<void>((resolve,reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = googleFontUrl(family); link.dataset.siteFont = family;
    const timer = window.setTimeout(fail, 20000);
    function fail() { window.clearTimeout(timer); link.remove(); reject(new Error(`Could not load ${family}. Check its Google Fonts family name.`)); }
    link.onload = () => { window.clearTimeout(timer); resolve(); };
    link.onerror = fail;
    document.head.append(link);
  });
  requests.set(family, request);
  request.catch(() => { if (requests.get(family) === request) requests.delete(family); });
  return request;
}
