import sanitizeHtml from 'sanitize-html';

const length = /^(?:0|\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw))$/;
const spacing = /^(?:auto|0|\d+(?:\.\d+)?(?:px|em|rem|%))(?:\s+(?:auto|0|\d+(?:\.\d+)?(?:px|em|rem|%))){0,3}$/;
const colour = /^(?:#[a-f\d]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\))$/i;
export function sanitizeContentHtml(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ['div','section','p','br','hr','h2','h3','h4','h5','h6','strong','b','em','i','u','s','span','small','sup','sub','blockquote','ul','ol','li','dl','dt','dd','a','img','figure','figcaption','table','thead','tbody','tfoot','tr','th','td','caption','pre','code','details','summary'],
    allowedAttributes: {'*':['style'], a:['href','title','target','rel'], img:['src','alt','width','height','loading'], th:['colspan','rowspan','scope'], td:['colspan','rowspan'], ol:['start'], details:['open']},
    allowedSchemes: ['http','https','mailto','tel'],
    allowProtocolRelative: false,
    allowedStyles: {'*': {
      color:[colour], 'background-color':[colour], 'font-size':[length], 'line-height':[/^\d+(?:\.\d+)?$/,length],
      'font-weight':[/^(?:normal|bold|[1-9]00)$/], 'font-style':[/^(?:normal|italic)$/],
      'text-align':[/^(?:left|right|center|justify)$/], 'text-decoration':[/^(?:none|underline|line-through)$/],
      display:[/^(?:block|inline|inline-block|flex|grid)$/], 'flex-direction':[/^(?:row|column)$/], 'flex-wrap':[/^(?:wrap|nowrap)$/],
      'grid-template-columns':[/^(?:\d+(?:\.\d+)?fr\s*)+$/], gap:[length],
      width:[length], 'max-width':[length], height:[length], 'max-height':[length],
      margin:[spacing], padding:[spacing], 'margin-top':[length], 'margin-bottom':[length],
    }},
    transformTags: {a: (tagName, attribs) => ({tagName, attribs:{...attribs, ...(attribs.target === '_blank' ? {rel:'noopener noreferrer'} : {})}})},
  });
}
export function htmlContentToText(content: string): string {
  const separated = sanitizeContentHtml(content).replace(/<\/(?:p|div|li|h[2-6]|tr|blockquote|section|pre)>|<br\s*\/?\s*>/gi, '\n');
  return sanitizeHtml(separated, {allowedTags:[],allowedAttributes:{}}).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}
