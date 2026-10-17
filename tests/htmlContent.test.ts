import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sanitizeContentHtml, htmlContentToText } from '../src/services/htmlContent';
import { HtmlContent } from '../src/components/HtmlContent';
import { GallerySlideshow } from '../src/components/GallerySlideshow';
import { syncEntryFromBlocks } from '../src/services/blockUtils';

test('HTML blocks preserve content and simple layout while stripping executable content',()=>{
  const html=sanitizeContentHtml('<div style="display:flex;gap:12px;position:fixed;background-image:url(https://evil.test)"><h2>标题</h2><p onclick="alert(1)"><em>Notes</em></p><script>alert(1)</script><iframe src="https://evil.test"></iframe><form><input></form><img src="https://example.test/image.jpg" onerror="alert(1)"><a href="javascript:alert(1)">Bad</a><a href="https://example.test" target="_blank">Good</a></div>');
  for(const expected of ['display:flex','gap:12px','<h2>标题</h2>','<em>Notes</em>','src="https://example.test/image.jpg"','noopener noreferrer']) assert.ok(html.includes(expected),expected);
  for(const rejected of ['onclick','onerror','<script','<iframe','<form','<input','javascript:','position:','background-image']) assert.ok(!html.includes(rejected),rejected);
  assert.ok(!sanitizeContentHtml('<a href="jav&#x61;script:alert(1)">bad</a>').includes('href='));
});

test('public HTML renderer sanitizes output and includes searchable plain text',()=>{
  const content='<p>First &amp; second</p><p><strong>Next</strong></p><script>unsafe</script>';
  const html=renderToStaticMarkup(React.createElement(HtmlContent,{content}));
  assert.ok(html.includes('<strong>Next</strong>'));
  assert.ok(!html.includes('unsafe'));
  assert.equal(htmlContentToText(content),'First & second\nNext');
  const entry=syncEntryFromBlocks({fullText:'',images:[]} as any,[{id:'html',type:'html',content}]);
  assert.ok(entry.fullText.includes('First & second\nNext'));
});

test('slideshow exposes navigation, pause and image enlargement for multiple images',()=>{
  const html=renderToStaticMarkup(React.createElement(GallerySlideshow,{block:{id:'gallery',type:'image_gallery',layout:'carousel',autoPlay:true,images:[{id:'a',url:'a.jpg'},{id:'b',url:'b.jpg'}]},onOpen:()=>{}}));
  for(const expected of ['Previous','Next','Pause','Enlarge image 1 of 2','object-contain']) assert.ok(html.includes(expected));
  assert.ok(!html.includes('border-black'));
  const outlined=renderToStaticMarkup(React.createElement(GallerySlideshow,{block:{id:'outlined',type:'image_gallery',showOutline:true,images:[{id:'a',url:'a.jpg'}]},onOpen:()=>{}}));
  assert.match(outlined, /<img[^>]+class="[^"]*border border-black\/20/);
});
