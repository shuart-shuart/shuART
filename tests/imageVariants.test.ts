import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/data/imageVariants.json';
import { imageSource, mediaFileName } from '../src/services/imageVariants';

test('owned media uses optimized derivatives and dimensions while outside images remain unchanged', () => {
  const [name, variant] = Object.entries(manifest)[0];
  const raw = `https://raw.githubusercontent.com/shuart-shuart/shuART/main/public/media/${name}`;
  assert.equal(mediaFileName(raw), name);
  assert.equal(mediaFileName(`/media/${name}`), name);
  assert.equal(mediaFileName(`https://other.example/media/${name}`), null);
  const thumbnail = imageSource(raw, true);
  assert.equal(thumbnail.src, variant.thumbnail);
  assert.equal(thumbnail.width, variant.width);
  assert.equal(thumbnail.height, variant.height);
  assert.equal(thumbnail.original, `/media/${name}`);
  assert.equal(imageSource('https://example.org/image.png').src, 'https://example.org/image.png');
});

test('animated artworks keep their motion in gallery display; only index thumbnails are static', () => {
  for (const [name, variant] of Object.entries(manifest)) {
    if (!variant.animated) continue;
    const url = `/media/${name}`;
    assert.equal(imageSource(url).src, url);
    assert.equal(imageSource(url).srcSet, undefined);
    assert.ok(imageSource(url, true).src.includes('/derived-media/'));
  }
});
