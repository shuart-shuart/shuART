import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { videoAspectRatio } from '../src/services/videoAspectRatio';
import { VideoPlayer } from '../src/components/VideoPlayer';

test('video frames follow source proportions, detect Shorts and safely fall back', () => {
  const block = {id:'film',type:'video' as const,provider:'youtube' as const,originalUrl:'https://youtube.com/shorts/lfX28ldLIBY',embedUrl:'https://www.youtube-nocookie.com/embed/lfX28ldLIBY'};
  assert.equal(videoAspectRatio(block),9/16);
  assert.equal(videoAspectRatio({...block,aspectRatio:'1440:1080'}),4/3);
  assert.equal(videoAspectRatio({...block,aspectRatio:'1/1'}),1);
  assert.equal(videoAspectRatio({...block,originalUrl:'https://example.org/shorts/anything',aspectRatio:'0:0'}),16/9);
  const html=renderToStaticMarkup(React.createElement(VideoPlayer,{block}));
  assert.ok(html.includes('aspect-ratio:0.5625'));
  assert.ok(!html.includes('Open video'));
  assert.ok(!html.includes('<figcaption'));
  const withCaption=renderToStaticMarkup(React.createElement(VideoPlayer,{block:{...block,caption:'Film excerpt'}}));
  assert.match(withCaption,/<figcaption[^>]*text-center/);
});
