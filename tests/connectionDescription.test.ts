import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionDescription } from '../src/services/connectionDescription';

test('connection summaries omit a repeated bilingual title, retain the verb and keep lowercase', () => {
  const entry={title:'lapping emulations',titleZh:'临摹',shortDescription:'临摹 Lapping Emulations is a process-led body of prints.'};
  assert.equal(connectionDescription(entry),'is a process-led body of prints.');
  assert.equal(entry.shortDescription,'临摹 Lapping Emulations is a process-led body of prints.');
  assert.equal(connectionDescription({title:'in the aisle',shortDescription:'in the aisle gathers photographs.'}),'gathers photographs.');
  assert.equal(connectionDescription({title:'Test',shortDescription:'[title]Test[/title]: A collection of notes.'}),'a collection of notes.');
});
test('connection summaries preserve unrelated openings, word boundaries and links in the remaining text', () => {
  assert.equal(connectionDescription({title:'time',shortDescription:'Timeless objects.'}),'Timeless objects.');
  assert.equal(connectionDescription({title:'Test',shortDescription:'A different opening.'}),'A different opening.');
  assert.equal(connectionDescription({title:'Test',shortDescription:'Test gathers [notes](https://example.org).'}),'gathers [notes](https://example.org).');
});

test('curly and straight quotation marks still identify the complete repeated bilingual title', () => {
  assert.equal(connectionDescription({title:'i’ve never met yoko ono',titleZh:'天明日月奣',shortDescription:"天明日月奣  i've never met yoko ono collects images."}),'collects images.');
});
