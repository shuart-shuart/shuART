import React from 'react';
import type { Entry } from '../types';

export function splitEntryTitle(entry: Pick<Entry, 'title' | 'titleZh'>) {
  let chinese = entry.titleZh?.trim() || '';
  let english = entry.title.trim();
  if (chinese && english.startsWith(chinese)) {
    english = english.slice(chinese.length).replace(/^[\s/–—-]+/, '');
  } else if (!chinese) {
    const match = english.match(/^([\p{Script=Han}·\s/–—-]+?)\s+(\(?[A-Za-z].*)$/u);
    if (match) {
      chinese = match[1].replace(/[\s/–—-]+$/, '');
      english = match[2];
      if (english.startsWith('(') && english.endsWith(')')) english = english.slice(1, -1);
    }
  }
  return { chinese, english };
}

export function EntryTitle({ entry, primaryClassName, chineseClassName, inline = false }: {
  entry: Pick<Entry, 'title' | 'titleZh'>;
  primaryClassName: string;
  chineseClassName: string;
  inline?: boolean;
}) {
  const { chinese, english } = splitEntryTitle(entry);
  return <>
    {chinese && <span lang="zh-Hans" className={`${inline ? 'inline' : 'block'} break-words ${english ? chineseClassName : primaryClassName}`}>{chinese}</span>}
    {inline && chinese && english && ' '}
    {english && <span className={`${inline ? 'inline' : 'block'} break-words ${primaryClassName}`}>{english}</span>}
  </>;
}
