import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GallerySlideshow } from '../src/components/GallerySlideshow';
import manifest from '../src/data/imageVariants.json';

test('slideshow frame follows the first image and reserves all captions without extra accessible text', () => {
  const entries=Object.entries(manifest);
  const [firstName,first]=entries[0];
  const [secondName]=entries.find(([,v])=>v.width/v.height!==first.width/first.height)!;
  const html=renderToStaticMarkup(React.createElement(GallerySlideshow,{block:{id:'gallery',type:'image_gallery',layout:'carousel',images:[{id:'one',url:`/media/${firstName}`},{id:'two',url:`/media/${secondName}`,caption:'A longer caption with [a link](https://example.org).',credit:'Photographer'}]},onOpen:()=>{}}));
  assert.ok(html.includes(`aspect-ratio:${first.width/first.height}`));
  assert.ok(html.includes('object-contain'));
  assert.ok(html.includes('aria-hidden="true" inert=""'));
  assert.equal((html.match(/data-gallery-caption="active"/g)||[]).length,1);
  assert.ok(html.includes('A longer caption'));
  assert.ok(html.includes('Photo:'));
  assert.ok(!html.includes('h-[55vh]'));
});
