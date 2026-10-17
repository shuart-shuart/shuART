import React, { lazy, Suspense } from 'react';
import type { DocumentReaderBlock } from '../types';
import { renderFormattedText } from '../services/formatting';
const Reader = lazy(() => import('./DocumentReader').then(module => ({ default: module.DocumentReader })));
export function DocumentReader({ block }: { block: DocumentReaderBlock }) {
  return <Suspense fallback={<section className="py-6 space-y-2 text-sm text-black/65"><p role="status">Loading document…</p>{block.description && <p>{renderFormattedText(block.description)}</p>}</section>}><Reader block={block} /></Suspense>;
}
