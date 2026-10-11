import { useEffect, useRef } from 'react';

// Keep stacked sticky sections aligned when navigation wraps or fonts load.
export function useStickyHeight<T extends HTMLElement>(property: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue(property);
    const measure = () => root.style.setProperty(property, `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined;
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      if (previous) root.style.setProperty(property, previous);
      else root.style.removeProperty(property);
    };
  }, [property]);
  return ref;
}
