import { Entry, ContentBlock, EntryImage } from '../types';

/**
 * Ensures an entry always returns an ordered sequence of ContentBlocks.
 * Migrates legacy fullText and images into equivalent blocks if no blocks are defined.
 */
export function getEntryBlocks(entry: Entry): ContentBlock[] {
  if (entry.blocks && entry.blocks.length > 0) {
    return entry.blocks;
  }

  const blocks: ContentBlock[] = [];

  // 1. Migrate fullText into text block
  if (entry.fullText && entry.fullText.trim()) {
    blocks.push({
      id: `text-${entry.id}-${Date.now()}-1`,
      type: 'text',
      content: entry.fullText,
    });
  }

  // 2. Migrate images into image_gallery block
  if (entry.images && entry.images.length > 0) {
    blocks.push({
      id: `gallery-${entry.id}-${Date.now()}-2`,
      type: 'image_gallery',
      images: entry.images,
      layout: 'stacked',
    });
  }

  return blocks;
}

/**
 * Synchronises legacy fields (fullText, images) when saving blocks on an entry
 * so that full-text search, previews, and index cards remain consistent.
 */
export function syncEntryFromBlocks(entry: Entry, blocks: ContentBlock[]): Entry {
  // Aggregate text from all text blocks
  const textParts: string[] = [];
  const galleryImages: EntryImage[] = [];

  blocks.forEach((block) => {
    if (block.type === 'text') {
      if (block.content) textParts.push(block.content);
    } else if (block.type === 'image_gallery') {
      if (block.title) textParts.push(block.title);
      if (block.images && block.images.length > 0) {
        galleryImages.push(...block.images);
        block.images.forEach((img) => {
          if (img.caption) textParts.push(img.caption);
          if (img.alt) textParts.push(img.alt);
        });
      }
    } else if (block.type === 'document_reader') {
      if (block.title) textParts.push(block.title);
      if (block.description) textParts.push(block.description);
      if (block.pages) {
        block.pages.forEach((p) => {
          if (p.caption) textParts.push(p.caption);
        });
      }
    } else if (block.type === 'video') {
      if (block.title) textParts.push(block.title);
      if (block.caption) textParts.push(block.caption);
      if (block.credit) textParts.push(block.credit);
    }
  });

  return {
    ...entry,
    blocks,
    fullText: textParts.length > 0 ? textParts.join('\n\n') : entry.fullText || '',
    images: galleryImages.length > 0 ? galleryImages : entry.images || [],
    updatedAt: new Date().toISOString(),
  };
}
