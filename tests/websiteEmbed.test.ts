import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WebsiteEmbed } from '../src/components/WebsiteEmbed';
import { CvLinks } from '../src/components/CvLinks';
import { websiteEmbedUrl, websiteEmbedHeight } from '../src/services/websiteEmbed';
import { DEFAULT_ABOUT } from '../src/data/siteContent';

test('website URLs support HTTPS and repository subpaths while rejecting executable URLs and credentials', () => {
  assert.equal(websiteEmbedUrl('https://example.org/archive/'), 'https://example.org/archive/');
  assert.equal(websiteEmbedUrl('/archives/project/', '/shuART/'), '/shuART/archives/project/');
  assert.equal(websiteEmbedUrl('/shuART/archives/project/', '/shuART/'), '/shuART/archives/project/');
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', '//example.org', 'https://user:pass@example.org', 'http://example.org', '/\\example.org', '<iframe>']) assert.equal(websiteEmbedUrl(url), null);
  assert.equal(websiteEmbedHeight(undefined), 640);
  assert.equal(websiteEmbedHeight(100), 320);
  assert.equal(websiteEmbedHeight(5000), 1200);
});

test('website embeds defer loading and retain a direct link; frames have a title and restricted sandbox', () => {
  const block = { id: 'site', type: 'website' as const, url: 'https://example.org/', title: 'Project archive', caption: 'Captured June 2023' };
  const deferred = renderToStaticMarkup(React.createElement(WebsiteEmbed, { block }));
  assert.ok(deferred.includes('Load website'));
  assert.ok(!deferred.includes('<iframe'));
  assert.ok(deferred.includes('href="https://example.org/"'));
  const loaded = renderToStaticMarkup(React.createElement(WebsiteEmbed, { block: { ...block, clickToLoad: false } }));
  assert.ok(loaded.includes('<iframe'));
  assert.ok(loaded.includes('title="Project archive"'));
  assert.ok(loaded.includes('sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"'));
  assert.ok(!loaded.includes('allow-same-origin'));
  assert.equal(renderToStaticMarkup(React.createElement(WebsiteEmbed, { block: { ...block, url: 'javascript:alert(1)' } })), '');
});

test('CV renders its existing view and PDF URLs as a compact CV link and accessible download icon', () => {
  const content = { ...DEFAULT_ABOUT, sections: [{ id: 'cv-links', title: 'CV', text: '[View CV](https://example.org/cv) · [Download CV (PDF)](https://example.org/cv.pdf)', items: [] }] };
  const html = renderToStaticMarkup(React.createElement(CvLinks, { content }));
  assert.ok(html.includes('href="https://example.org/cv"'));
  assert.ok(html.includes('>CV</a>'));
  assert.ok(html.includes('href="https://example.org/cv.pdf"'));
  assert.ok(html.includes('aria-label="Download CV as PDF"'));
  assert.ok(!html.includes('>View CV<'));
  assert.equal(renderToStaticMarkup(React.createElement(CvLinks, { content: { ...content, sections: [] } })), '');
});
