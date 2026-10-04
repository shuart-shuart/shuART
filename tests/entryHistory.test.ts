import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EntryHistory } from '../src/components/EntryHistory';
import type { Entry } from '../src/types';

const render = (fields: Partial<Entry>) => renderToStaticMarkup(React.createElement(EntryHistory, {
  entry: { title: 'Test work', ...fields } as Entry, allEntries: [], onSelectEntry: () => {},
}));

test('empty credits and history do not create public sections', () => {
  assert.equal(render({ credits: [], presentationHistory: [] }), '');
});

test('credits and provenance render formatted content, links, and author order', () => {
  const html = render({ credits: [
    { id: '1', role: 'publisher', name: '[title]Publisher One[/title]', link: 'https://example.com' },
    { id: '2', role: 'custom', customRole: 'Sound', name: 'Contributor Two' },
  ], presentationHistory: [
    { id: 'a', title: 'Show A', venue: 'Venue', location: 'Singapore', date: '2026', curator: 'Curator', note: '[Details](https://example.org)' },
    { id: 'b', title: '', venue: '', location: '', date: '', note: 'A note-only record' },
  ] });
  for (const value of ['Provenance / Presentation History', 'Publisher One', 'Sound', 'Venue', 'Singapore', '2026', 'Curator', 'A note-only record', 'decoration-dotted']) assert.ok(html.includes(value), value);
  assert.ok(html.indexOf('Publisher One') < html.indexOf('Contributor Two'));
  assert.ok(!html.includes('[title]'));
  assert.ok(html.includes('href="https://example.com"'));
  assert.ok(!html.includes('View link'));
  assert.ok(!html.includes('Additional Credits'));
  assert.ok(html.includes('was presented at Show A'));
  assert.ok(html.includes('curated by Curator'));
});

test('unsafe record links are not rendered as clickable links', () => {
  const html = render({ credits: [{ id: 'x', role: 'publisher', name: '<script>bad</script>', link: 'javascript:alert(1)' }] });
  assert.ok(!html.includes('href='));
  assert.ok(!html.includes('<script>'));
});

test('provenance uses selected action, links the event, and formats a programmer name', () => {
  const html = render({ presentationHistory: [{ id: 'launch', action: 'launched', attribution: 'programmed', title: '[title]Book Fair[/title]', venue: 'Gallery', location: '', date: '2022', curator: '[Person](https://example.org/person)', link: 'https://example.org/event' }] });
  assert.ok(html.includes('was launched at'));
  assert.ok(html.includes('(Gallery, 2022)'));
  assert.ok(html.includes('programmed by'));
  assert.ok(html.includes('href="https://example.org/event"'));
  assert.ok(html.includes('href="https://example.org/person"'));
  assert.ok(!html.includes('[title]'));
});

test('linked credits keep title styling without nesting links', () => {
  const html = render({ credits: [{ id: 'person', role: 'designer', name: '[title][Person](https://old.example)[/title]', link: 'https://new.example' }] });
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.ok(html.includes('href="https://new.example"'));
  assert.ok(html.includes('font-editorial'));
});
