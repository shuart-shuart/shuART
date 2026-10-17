import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanFontFamily, DEFAULT_FONTS, resolveFonts, googleFontUrl, fontVariables, loadGoogleFont } from '../src/services/siteFonts';
import { EditorTypographySection } from '../src/components/editor/EditorTypographySection';

test('font settings retain legacy defaults, validate family names and use only Google stylesheet URLs', () => {
  assert.deepEqual(resolveFonts(),DEFAULT_FONTS);
  assert.equal(cleanFontFamily('  Source   Sans 3  '),'Source Sans 3');
  for(const value of ['https://example.org/font','Inter; color:red','"Arial"','<style>','',null])assert.equal(cleanFontFamily(value),null);
  assert.match(googleFontUrl('EB Garamond'),/^https:\/\/fonts\.googleapis\.com\/css2\?family=EB\+Garamond:/);
  assert.equal(googleFontUrl('A New Font'),'https://fonts.googleapis.com/css2?family=A+New+Font&display=swap');
  assert.throws(()=>googleFontUrl('Bad&family=Other'));
  assert.equal(resolveFonts({body:'Inter',chinese:'Bad;'}).chinese,'Noto Sans SC');
  const vars=fontVariables({body:'Inter',chinese:'Noto Serif SC'}) as Record<string,string>;
  assert.match(vars['--font-sans'],/^"Inter", "Source Sans 3", "Noto Serif SC"/);
  assert.ok(!('fontSize' in vars));
});
test('typography settings offer curated and custom choices for all four roles with a scoped preview', () => {
  const html=renderToStaticMarkup(React.createElement(EditorTypographySection,{fonts:DEFAULT_FONTS,onChange:()=>{}}));
  assert.equal((html.match(/<select/g)||[]).length,4);
  assert.equal((html.match(/Custom Google Font/g)||[]).length,4);
  for(const text of ['Body font','Title font','Label font','Chinese font','Live typography preview','Restore default fonts'])assert.ok(html.includes(text));
  const custom=renderToStaticMarkup(React.createElement(EditorTypographySection,{fonts:{...DEFAULT_FONTS,title:'Spectral'},onChange:()=>{}}));
  assert.ok(custom.includes('Custom title font family'));
  assert.ok(custom.includes('value="Spectral"'));
});
test('font stylesheet loads are deduplicated and retry after failure', async () => {
  const root=globalThis as unknown as {window?:unknown;document?:unknown};const previous={window:root.window,document:root.document};
  const links:any[]=[];
  root.window={setTimeout,clearTimeout};root.document={createElement:()=>({dataset:{},remove(){}}),head:{append:(link:unknown)=>links.push(link)}};
  try {
    const first=loadGoogleFont('Inter');assert.equal(first,loadGoogleFont('Inter'));assert.equal(links.length,1);
    links[0].onload();await first;
    const failed=loadGoogleFont('A New Font');const check=assert.rejects(failed,/Could not load/);links[1].onerror();await check;
    const retry=loadGoogleFont('A New Font');assert.equal(links.length,3);links[2].onload();await retry;
    await loadGoogleFont('Newsreader');assert.equal(links.length,3);
  } finally {root.window=previous.window;root.document=previous.document;}
});

test('font choices survive public archive preparation and JSON round-tripping', async () => {
  const {prepareArchiveMedia}=await import('../src/services/githubPublishing');
  const fonts={...DEFAULT_FONTS,body:'Inter',chinese:'Noto Serif SC'};
  const {bundle}=await prepareArchiveMedia({version:3,entries:[],tags:[],settings:{showWander:true,typography:'c',updatedAt:'2026-10-17',fonts}});
  assert.deepEqual(JSON.parse(JSON.stringify(bundle)).settings.fonts,fonts);
});
