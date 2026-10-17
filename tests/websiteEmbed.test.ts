import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WebsiteEmbed } from '../src/components/WebsiteEmbed';
import { CvLinks } from '../src/components/CvLinks';
import { Header } from '../src/components/Header';
import { AboutView } from '../src/components/AboutView';
import { Footer } from '../src/components/Footer';
import type { SiteSettings } from '../src/types';
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

test('CV text and icon form one PDF link opening in a new tab', () => {
  const content = { ...DEFAULT_ABOUT, sections: [{ id: 'cv-links', title: 'CV', text: '[View CV](https://example.org/cv) · [Download CV (PDF)](https://example.org/cv.pdf)', items: [] }] };
  const html = renderToStaticMarkup(React.createElement(CvLinks, { content }));
  assert.ok(!html.includes('href="https://example.org/cv"'));
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('href="https://example.org/cv.pdf"'));
  assert.ok(html.includes('aria-label="View CV as PDF"'));
  assert.ok(!html.includes('>View CV<'));
  assert.equal(renderToStaticMarkup(React.createElement(CvLinks, { content: { ...content, sections: [] } })), '');
  const legacy = renderToStaticMarkup(React.createElement(CvLinks, { content: { ...content, sections: [{ ...content.sections[0], text: '[View CV](https://docs.google.com/document/d/cv-document-id/edit?usp=sharing)' }] } }));
  assert.ok(legacy.includes('/cv/HONG%20Shu-ying_CV.pdf"'));
  assert.ok(!legacy.includes(' download='));
});

test('CV sits beside About in navigation; repeated contact is hidden while custom contact text remains', () => {
  const about = { ...DEFAULT_ABOUT, contactTitle: 'Contact', contactText: '[hello@example.org](mailto:hello@example.org)', sections: [{ id: 'cv-links', title: 'CV', text: '[View CV](https://example.org/cv) · [Download CV (PDF)](https://example.org/cv.pdf)', items: [] }] };
  const settings = { about, footer: { artistName: 'Artist', description: '', links: [{ id: 'email', label: 'hello@example.org', url: 'mailto:hello@example.org' }] } } as SiteSettings;
  const header = renderToStaticMarkup(React.createElement(Header, { currentView: 'entry', onNavigateView() {}, onRandomWander() {}, showWander: true, about }));
  assert.ok(header.indexOf('>About</button>') < header.indexOf('aria-label="View CV as PDF"'));
  assert.ok(header.indexOf('aria-label="View CV as PDF"') < header.indexOf('aria-label="Wander'));
  assert.ok(header.includes('aria-label="View CV as PDF"'));
  const page = renderToStaticMarkup(React.createElement(AboutView, { siteSettings: settings, onNavigateView() {} }));
  assert.ok(!page.includes('mailto:hello@example.org'));
  assert.ok(!page.includes('Download CV'));
  const footer = renderToStaticMarkup(React.createElement(Footer, { siteSettings: settings, onNavigateView() {} }));
  assert.ok(footer.includes('mailto:hello@example.org'));
  const custom = renderToStaticMarkup(React.createElement(AboutView, { siteSettings: { ...settings, about: { ...about, contactText: 'For studio visits, please email hello@example.org.' } }, onNavigateView() {} }));
  assert.ok(custom.includes('For studio visits'));
});
