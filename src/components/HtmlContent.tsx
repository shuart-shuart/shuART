import React, { useMemo } from 'react';
import { sanitizeContentHtml } from '../services/htmlContent';

export function HtmlContent({ content }: { content: string }) {
  const html = useMemo(() => sanitizeContentHtml(content), [content]);
  return <div className="html-content font-sans text-base sm:text-lg leading-[1.65] text-black/90 break-words" dangerouslySetInnerHTML={{__html:html}} />;
}
