import test from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoDwell } from '../src/services/videoDwell';

test('video dwell waits for half visibility and 500 ms without scrolling, cancels offscreen and in background, and cleans up', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const root = globalThis as unknown as Record<string, unknown>;
  const previous = { window: root.window, document: root.document, IntersectionObserver: root.IntersectionObserver };
  const events = new Map<string, () => void>();
  let callback: (entries: unknown[]) => void = () => {};
  let disconnected = false;
  const element = {} as Element;
  const calls: string[] = [];
  const doc = { visibilityState: 'visible', addEventListener: (name: string, fn: () => void) => events.set(name, fn), removeEventListener: (name: string) => events.delete(name) };
  root.window = { addEventListener: (name: string, fn: () => void) => events.set(name, fn), removeEventListener: (name: string) => events.delete(name) };
  root.document = doc;
  root.IntersectionObserver = class {
    constructor(fn: typeof callback) { callback = fn; }
    observe() {}
    disconnect() { disconnected = true; }
  };
  try {
    const dispose = observeVideoDwell(element, { onEnter: () => calls.push('enter'), onWaiting: () => calls.push('wait'), onDwell: () => calls.push('play'), onLeave: () => calls.push('pause') });
    const intersect = (ratio: number) => callback([{ target: element, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
    intersect(0.49); t.mock.timers.tick(600);
    assert.equal(calls.length, 0);
    intersect(0.5); t.mock.timers.tick(499);
    assert.ok(!calls.includes('play'));
    events.get('scroll')?.(); t.mock.timers.tick(499);
    assert.ok(!calls.includes('play'));
    t.mock.timers.tick(1);
    assert.equal(calls.at(-1), 'play');
    intersect(0.2);
    assert.equal(calls.at(-1), 'pause');
    intersect(1); t.mock.timers.tick(200); intersect(0); t.mock.timers.tick(600);
    assert.equal(calls.filter(x => x === 'play').length, 1);
    intersect(1); doc.visibilityState = 'hidden'; events.get('visibilitychange')?.(); t.mock.timers.tick(600);
    assert.equal(calls.filter(x => x === 'play').length, 1);
    doc.visibilityState = 'visible'; events.get('visibilitychange')?.(); t.mock.timers.tick(500);
    assert.equal(calls.filter(x => x === 'play').length, 2);
    events.get('scroll')?.(); dispose(); t.mock.timers.tick(600);
    assert.equal(calls.filter(x => x === 'play').length, 2);
    assert.ok(disconnected);
    assert.equal(events.size, 0);
  } finally { Object.assign(root, previous); }
});
