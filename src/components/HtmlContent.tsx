import React, { useMemo } from 'react';
import { sanitizeContentHtml } from '../services/htmlContent';

export function HtmlContent({ content }: { content: string }) {
  const html = useMemo(() => sanitizeContentHtml(content), [content]);
  return <div className="html-content font-sans body-copy leading-[1.6] text-black/90 break-words" dangerouslySetInnerHTML={{__html:html}} />;
}
