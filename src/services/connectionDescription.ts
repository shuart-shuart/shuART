import type { Entry } from '../types';
import { splitEntryTitle } from '../components/EntryTitle';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');

// This is a display transformation; the saved description is never changed.
export function connectionDescription(entry: Pick<Entry, 'title' | 'titleZh' | 'shortDescription'>): string {
  const description = entry.shortDescription || '';
  const { chinese, english } = splitEntryTitle(entry);
  const candidates = [...new Set([entry.title.trim(), [chinese, english].filter(Boolean).join(' '), english, chinese].filter(Boolean))].sort((a,b)=>b.length-a.length);
  for (const title of candidates) {
    const name = escape(title);
    const prefix = new RegExp(`^(?:${name}|\\[title\\]${name}\\[/title\\]|\\*\\*${name}\\*\\*|\\*${name}\\*|_${name}_|\\[\\[${name}\\]\\]|\\[\\[[^\\]\\n|]+\\|${name}\\]\\]|\\[${name}\\]\\([^\\)\\n]+\\))(?=\\s|[:：,，—–-]|$)`, 'iu');
    const match = description.trimStart().match(prefix);
    if (!match) continue;
    return description.trimStart().slice(match[0].length)
      .replace(/^[\s:：,，—–-]+/, '')
      .replace(/^(?:is|are|was|were)\s+/i, '')
      .replace(/^([*_]*)(\p{Lu})/u, (_, formatting: string, letter: string) => formatting + letter.toLowerCase());
  }
  return description;
}
