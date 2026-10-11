import test from 'node:test';
import assert from 'node:assert/strict';
import { sortIndexEntries } from '../src/services/indexSorting';
import type { Entry } from '../src/types';

const entry = (id: string, date?: string, type: Entry['type'] = 'work') => ({ id, title: id, date, type } as Entry);
const ids = (entries: Entry[]) => entries.map(item => item.id);

test('index preserves archive order until sorting and sorts titles naturally without mutating content', () => {
  const entries = [entry('Work 10'), entry('Work 2'), entry('Alpha')];
  assert.deepEqual(ids(sortIndexEntries(entries, null)), ['Work 10', 'Work 2', 'Alpha']);
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'title', direction: 'ascending' })), ['Alpha', 'Work 2', 'Work 10']);
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'title', direction: 'descending' })), ['Work 10', 'Work 2', 'Alpha']);
  assert.deepEqual(ids(entries), ['Work 10', 'Work 2', 'Alpha']);
});

test('year sorting handles date ranges and approximate years, keeping undated entries last both ways', () => {
  const entries = [entry('Undated'), entry('Recent', '2024'), entry('Range', '2021–ongoing'), entry('Approximate', 'c. 2018')];
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'year', direction: 'descending' })), ['Recent', 'Range', 'Approximate', 'Undated']);
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'year', direction: 'ascending' })), ['Approximate', 'Range', 'Recent', 'Undated']);
});

test('type sorting groups entries alphabetically and keeps titles ordered within each type', () => {
  const entries = [entry('Z', '', 'work'), entry('Publication', '', 'publication'), entry('A', '', 'work'), entry('Note', '', 'note')];
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'type', direction: 'ascending' })), ['Note', 'Publication', 'A', 'Z']);
  assert.deepEqual(ids(sortIndexEntries(entries, { key: 'type', direction: 'descending' })), ['A', 'Z', 'Publication', 'Note']);
});
