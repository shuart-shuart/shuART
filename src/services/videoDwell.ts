interface VideoDwellCallbacks {
  onEnter(): void;
  onWaiting(): void;
  onDwell(): void;
  onLeave(): void;
}

/** Start after half the video stays visible and scrolling settles for 500 ms. */
export function observeVideoDwell(element: Element, callbacks: VideoDwellCallbacks): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  let visible = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    cancel();
    if (!visible || document.visibilityState === 'hidden') return;
    callbacks.onWaiting();
    timer = setTimeout(() => {
      timer = undefined;
      if (visible && document.visibilityState !== 'hidden') callbacks.onDwell();
    }, 500);
  };
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(item => item.target === element);
    if (!entry) return;
    const next = entry.isIntersecting && entry.intersectionRatio >= 0.5;
    if (next === visible) return;
    visible = next;
    if (visible) { callbacks.onEnter(); schedule(); }
    else { cancel(); callbacks.onLeave(); }
  }, { threshold: [0, 0.5] });
  const visibilityChanged = () => {
    if (document.visibilityState === 'hidden') { cancel(); callbacks.onLeave(); }
    else schedule();
  };
  observer.observe(element);
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  document.addEventListener('visibilitychange', visibilityChanged);
  return () => {
    cancel(); observer.disconnect();
    window.removeEventListener('scroll', schedule, true);
    document.removeEventListener('visibilitychange', visibilityChanged);
  };
}
