import type { Entry } from '../types';
import { splitEntryTitle } from '../components/EntryTitle';

export type IndexSortKey = 'title' | 'year' | 'type';
export type IndexSort = { key: IndexSortKey; direction: 'ascending' | 'descending' };

const titles = new Intl.Collator('zh-Hans', { numeric: true, sensitivity: 'base' });
const title = (entry: Entry) => {
  const { chinese, english } = splitEntryTitle(entry);
  return [chinese, english].filter(Boolean).join(' ');
};
const year = (entry: Entry) => {
  const match = entry.date?.match(/(?:1|2)\d{3}/);
  return match ? Number(match[0]) : undefined;
};

export function sortIndexEntries(entries: Entry[], sort: IndexSort | null): Entry[] {
  if (!sort) return entries;
  const direction = sort.direction === 'ascending' ? 1 : -1;
  return [...entries].sort((a, b) => {
    if (sort.key === 'year') {
      const first = year(a), second = year(b);
      // Undated entries stay last in either direction; ranges use their starting year.
      if (first === undefined || second === undefined) {
        if (first !== second) return first === undefined ? 1 : -1;
      } else if (first !== second) return (first - second) * direction;
    } else if (sort.key === 'type') {
      const comparison = titles.compare(a.type, b.type);
      if (comparison) return comparison * direction;
    }
    return titles.compare(title(a), title(b)) * (sort.key === 'title' ? direction : 1);
  });
}
