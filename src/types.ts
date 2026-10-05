export type EntryType =
  | 'work'
  | 'project'
  | 'publication'
  | 'note';

export type EntryStatus = 'published' | 'draft';

// ---------------- Canonical Tag Definition ----------------
export interface Tag {
  id: string; // Stable canonical tag ID, e.g. "transcription", "score"
  label: string; // Display label
  description?: string; // Optional short definition or scope note
  linkedNoteId?: string; // Optional linked note entry ID
  createdAt?: string;
  updatedAt?: string;
}

export interface EntryImage {
  id: string;
  url: string;
  caption?: string;
  alt?: string;
  credit?: string;
  storagePath?: string;
}

// ---------------- Content Block Definitions ----------------
export type ContentBlockType = 'text' | 'image_gallery' | 'document_reader' | 'video';

export interface TextBlock {
  id: string;
  type: 'text';
  content: string; // Markdown / text with [[wikilinks]]
}

export interface ImageGalleryBlock {
  id: string;
  type: 'image_gallery';
  title?: string;
  images: EntryImage[];
  layout?: 'stacked' | 'grid' | 'carousel';
}

export type DocumentSourceType = 'pdf' | 'page_images';
export type PageImageType = 'individual_pages' | 'already_composed_spreads';

export interface DocumentPage {
  id: string;
  url: string;
  pageNumber: number;
  caption?: string;
  storagePath?: string;
}

export interface DocumentReaderBlock {
  id: string;
  type: 'document_reader';
  title: string;
  sourceType: DocumentSourceType;
  // For PDF:
  pdfUrl?: string;
  pdfStoragePath?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  // For page images:
  pageType?: PageImageType; // 'individual_pages' | 'already_composed_spreads'
  pages?: DocumentPage[];
  // Original uploaded file available for download:
  originalFileUrl?: string;
  originalFileName?: string;
  description?: string;
  // File download toggle:
  allowDownload?: boolean; // Toggled on/off in the editor depending on uploaded files
}

export type VideoProvider = 'youtube' | 'vimeo' | 'google_drive';

export interface VideoBlock {
  id: string;
  type: 'video';
  provider: VideoProvider;
  originalUrl: string;
  embedUrl: string;
  title?: string;
  caption?: string;
  credit?: string;
}

export type ContentBlock =
  | TextBlock
  | ImageGalleryBlock
  | DocumentReaderBlock
  | VideoBlock;

export type CreditRole =
  | 'publisher'
  | 'collaborator'
  | 'editor'
  | 'designer'
  | 'translator'
  | 'printer'
  | 'commissioner'
  | 'custom'
  | string;

export interface EntryCredit {
  id: string;
  role: CreditRole;
  customRole?: string;
  name: string;
  link?: string;
}

export interface PresentationRecord {
  action?: 'launched' | 'commissioned' | 'shown' | 'screened' | 'developed' | 'presented';
  attribution?: 'curated' | 'programmed' | 'organised';
  id: string;
  title: string;
  venue: string;
  location: string;
  date: string;
  curator?: string;
  link?: string;
  note?: string;
}

// ---------------- Entry Model ----------------
export interface Entry {
  id: string; // Stable immutable unique ID
  slug: string; // URL slug, stable across title edits
  title: string;
  titleZh?: string;
  type: EntryType;
  date?: string; // Optional year or date e.g. "2023", "2021–ongoing", "c. 2022 [placeholder]"
  datePlaceholder?: boolean;
  shortDescription: string; // Clear short description used across index, cards, and previews
  fullText: string; // Full body text with markdown & [[wikilinks]]
  medium?: string;
  dimensions?: string;
  credits?: EntryCredit[]; // Repeatable credits: publisher, collaborator, editor, designer, translator, printer, commissioner, custom
  presentationHistory?: PresentationRecord[]; // Repeatable provenance / exhibition / programme records
  images?: EntryImage[]; // Ordered list of images
  blocks?: ContentBlock[]; // Ordered sequence of content blocks
  tagIds: string[]; // Stable canonical tag IDs
  subjects: string[]; // Thematic tag labels for search and display
  associatedProjectIds?: string[]; // Stable IDs of associated project entries
  relatedEntryIds: string[]; // Explicit relationships pointing to entry IDs
  collections?: string[]; // Optional/deprecated collections
  status: EntryStatus; // 'published' | 'draft'
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  isDevelopingWork?: boolean; // When true, clearly marked as developing study / working fragment
  notesForArtist?: string; // Browser draft and backup only; excluded from GitHub publishes
  // Helper for SS category if present
  ssCategory?: 'overview' | 'book' | 'library' | 'person' | 'conversation' | 'programme';
}

export type TypographyCombo = 'a' | 'c';

export interface NavItemConfig {
  id: string; // 'index' | 'about' | 'wander'
  label: string;
  labelZh?: string;
  view: ViewMode;
  visible: boolean;
}

export interface AboutContent {
  title: string;
  artistName: string;
  biography: string;
  sections: { id: string; title: string; text: string; items: { id: string; title: string; text: string }[] }[];
  contactTitle: string;
  contactText: string;
}

export interface FooterContent {
  artistName: string;
  description: string;
  links: { id: string; label: string; url: string }[];
}

export interface IndexContent {
  title: string;
  description: string;
}

export interface SiteSettings {
  index?: IndexContent;
  about?: AboutContent;
  footer?: FooterContent;
  showWander: boolean;
  typography: TypographyCombo;
  navOrder?: NavItemConfig[];
  updatedAt: string;
  updatedBy?: string;
}

export interface BacklinkInfo {
  id: string;
  slug: string;
  title: string;
  titleZh?: string;
  type: EntryType;
  contextExcerpt?: string;
}

export type ViewMode = 'index' | 'about' | 'entry' | 'tag' | 'editor' | 'wander';
