import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderFormattedText, toggleTitleStyle, applyHyperlink, removeHyperlink } from '../src/services/formatting';
import { EntryDetail } from '../src/components/EntryDetail';
import { FormattedField } from '../src/components/editor/FormattedField';
import type { Entry } from '../src/types';

const html = (text: string) => renderToStaticMarkup(React.createElement(React.Fragment, null, renderFormattedText(text)));

test('title styling and hyperlinks combine in either order and can be removed', () => {
  const titled = toggleTitleStyle('An artwork', 3, 10).newText;
  assert.equal(titled, 'An [title]artwork[/title]');
  const linked = applyHyperlink(titled, 3, titled.length, 'https://example.org/Work_(edition)').newText;
  const output = html(linked);
  assert.ok(output.includes('font-editorial'));
  assert.ok(output.includes('href="https://example.org/Work_(edition)"'));
  assert.ok(output.includes('decoration-dotted'));
  assert.ok(!output.includes('[title]'), output);
  assert.equal(removeHyperlink(linked, 3, linked.length).newText, titled);
  const titleOutside = html('[title][artwork](https://example.org)[/title]');
  assert.ok(titleOutside.includes('href="https://example.org"'));
  assert.ok(!titleOutside.includes('[title]'));
  assert.equal(toggleTitleStyle(titled, 10, 17).newText, 'An artwork');
});

test('archive links route to entries while other hash links retain their destination', () => {
  let selected = '';
  const result = renderFormattedText('[Read](#entry/work)', { onSelectEntry: slug => { selected = slug; } }) as React.ReactElement<{children: React.ReactNode}>;
  const button = React.Children.toArray(result.props.children)[0] as React.ReactElement<{onClick: (e: {preventDefault: () => void}) => void}>;
  button.props.onClick({ preventDefault() {} });
  assert.equal(selected, 'work');
  assert.ok(html('[About](#about)').includes('href="#about"'));
  assert.ok(html('[Website](example.org)').includes('href="https://example.org"'));
  assert.ok(!html('[Bad](javascript:alert(1))').includes('href='));
});

test('public entry prose and gallery captions render formatting instead of raw tags', () => {
  const entry = { id: 'test', slug: 'test', title: 'Test', type: 'work', status: 'published',
    shortDescription: '[title]Overview[/title] [Read](https://example.org)',
    blocks: [
      {id: 'text', type: 'text', content: '[title]Essay[/title] [Source](https://example.org/source)'},
      {id: 'video', type: 'video', provider: 'youtube', originalUrl: 'https://example.org/video', embedUrl: 'https://example.org/embed', title: '[title]Video title[/title]', caption: '[Video caption](https://example.org/caption)'},
      {id: 'document', type: 'document_reader', title: '[title]Book[/title]', sourceType: 'page_images', pages: [], description: '[Description](https://example.org/description)'},
      {id: 'gallery', type: 'image_gallery', images: [{ id: 'image', url: 'https://example.org/image.jpg', caption: '[title]Caption[/title]', credit: '[Photographer](https://example.org/photo)' }]},
    ],
  } as Entry;
  const output = renderToStaticMarkup(React.createElement(EntryDetail, {
    entry, allEntries: [entry], onSelectEntry() {}, onFilterBySubject() {}, onNavigateBack() {}, onRandomWander() {}, showWander: false, isEditorLoggedIn: false, onEditEntry() {},
  }));
  assert.ok(!output.includes('[title]'), output);
  for (const url of ['https://example.org/source','https://example.org/photo','https://example.org/caption','https://example.org/description']) assert.ok(output.includes(`href="${url}"`));
});

test('formatted field labels target inputs and do not create a nested form', () => {
  const output = renderToStaticMarkup(React.createElement('form', null, React.createElement(FormattedField, {label:'Caption', value:'', onChange() {}})));
  assert.equal((output.match(/<form/g) || []).length, 1);
  assert.ok(output.includes('for='));
});
