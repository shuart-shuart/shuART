import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EntryTitle, splitEntryTitle } from '../src/components/EntryTitle';

test('bilingual titles place Chinese first without repeating a combined prefix', () => {
  const entry = {title: '笔迹 script/notes', titleZh: '笔迹'};
  assert.deepEqual(splitEntryTitle(entry), {chinese:'笔迹',english:'script/notes'});
  const html = renderToStaticMarkup(React.createElement(EntryTitle,{entry,primaryClassName:'primary',chineseClassName:'chinese'}));
  assert.equal((html.match(/笔迹/g)||[]).length,1);
  assert.ok(html.indexOf('笔迹') < html.indexOf('script/notes'));
  assert.deepEqual(splitEntryTitle({title:'scores',titleZh:'谱'}),{chinese:'谱',english:'scores'});
  assert.deepEqual(splitEntryTitle({title:'临摹 – 序 (linmo – sketches)'}),{chinese:'临摹 – 序',english:'linmo – sketches'});
  assert.deepEqual(splitEntryTitle({title:'in the aisle'}),{chinese:'',english:'in the aisle'});
});
