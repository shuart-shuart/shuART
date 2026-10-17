import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VideoPlayer } from '../src/components/VideoPlayer';
import { loadYoutubeApi, videoTime, youtubeVideoId } from '../src/services/youtubePlayer';

test('YouTube IDs accept provider URLs and reject unrelated or executable sources', () => {
  for (const url of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0']) assert.equal(youtubeVideoId(url), 'dQw4w9WgXcQ');
  for (const url of ['https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com/watch?v=bad']) assert.equal(youtubeVideoId(url), null);
  assert.equal(videoTime(65.8), '1:05');
  assert.equal(videoTime(NaN), '0:00');
});

test('YouTube starts as a click-to-play poster without an iframe; other providers retain their players', () => {
  const block = { id: 'video', type: 'video' as const, provider: 'youtube' as const, originalUrl: 'https://youtu.be/dQw4w9WgXcQ', embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', title: 'Artwork film' };
  const html = renderToStaticMarkup(React.createElement(VideoPlayer, { block }));
  assert.ok(html.includes('aria-label="Play Artwork film"'));
  assert.ok(!html.includes('<iframe'));
  assert.ok(html.includes('href="https://youtu.be/dQw4w9WgXcQ"'));
  const vimeo = renderToStaticMarkup(React.createElement(VideoPlayer, { block: { ...block, provider: 'vimeo', embedUrl: 'https://player.vimeo.com/video/123' } }));
  assert.ok(vimeo.includes('<iframe'));
});

test('YouTube API requests share one script, recover from loading failure, and reuse the loaded API', async () => {
  const root = globalThis as unknown as { window?: unknown; document?: unknown };
  const previous = { window: root.window, document: root.document };
  const scripts: Array<{ src?: string; onerror?: () => void; remove(): void }> = [];
  const host = { setTimeout, YT: undefined as unknown, onYouTubeIframeAPIReady: undefined as (() => void) | undefined };
  root.window = host;
  root.document = { createElement: () => ({ remove() {} }), head: { append: (script: typeof scripts[number]) => scripts.push(script) } };
  try {
    const first = loadYoutubeApi();
    assert.equal(first, loadYoutubeApi());
    const rejected = assert.rejects(first, /could not load/);
    scripts[0].onerror?.();
    await rejected;
    const retry = loadYoutubeApi();
    assert.equal(scripts.length, 2);
    assert.equal(scripts[1].src, 'https://www.youtube.com/iframe_api');
    host.YT = { Player: class {} };
    host.onYouTubeIframeAPIReady?.();
    assert.equal(await retry, host.YT);
    assert.equal(await loadYoutubeApi(), host.YT);
  } finally {
    root.window = previous.window;
    root.document = previous.document;
  }
});
