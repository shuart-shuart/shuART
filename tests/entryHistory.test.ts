import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EntryHistory } from '../src/components/EntryHistory';
import type { Entry } from '../src/types';

const render = (fields: Partial<Entry>) => renderToStaticMarkup(React.createElement(EntryHistory, {
  entry: { ...fields } as Entry, allEntries: [], onSelectEntry: () => {},
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
  for (const value of ['Additional Credits', 'Provenance / Presentation History', 'Publisher One', 'Sound', 'Venue', 'Singapore', '2026', 'Curator', 'A note-only record', 'decoration-dotted']) assert.ok(html.includes(value), value);
  assert.ok(html.indexOf('Publisher One') < html.indexOf('Contributor Two'));
  assert.ok(!html.includes('[title]'));
  assert.ok(html.includes('href="https://example.com"'));
});

test('unsafe record links are not rendered as clickable links', () => {
  const html = render({ credits: [{ id: 'x', role: 'publisher', name: '<script>bad</script>', link: 'javascript:alert(1)' }] });
  assert.ok(!html.includes('href='));
  assert.ok(!html.includes('<script>'));
});
