import React, { useState } from 'react';
import {
  ContentBlock,
  TextBlock,
  ImageGalleryBlock,
  DocumentReaderBlock,
  VideoBlock,
  DocumentPage,
  EntryImage,
  Entry,
} from '../../types';
import { parseVideoUrl } from '../../services/videoEmbed';
import { uploadEntryImageToStorage, uploadEntryFileToStorage } from '../../services/mediaUploads';
import { FormattedField } from './FormattedField';

interface BlockEditorItemProps {
  block: ContentBlock;
  index: number;
  totalBlocks: number;
  entryId: string;
  allEntries?: Entry[];
  onUpdateBlock: (updated: ContentBlock) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onRemoveBlock: (index: number) => void;
}

export const BlockEditorItem: React.FC<BlockEditorItemProps> = ({
  block,
  index,
  totalBlocks,
  entryId,
  allEntries = [],
  onUpdateBlock,
  onMoveBlock,
  onRemoveBlock,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);

  // ---------------- Handlers for Text Block ----------------
  const handleTextChange = (content: string) => {
    onUpdateBlock({
      ...block,
      content,
    } as TextBlock);
  };

  // ---------------- Handlers for Gallery Block ----------------
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressMsg(`Uploading ${files.length} image(s)…`);

    const galleryBlock = block as ImageGalleryBlock;
    const newImages: EntryImage[] = [...(galleryBlock.images || [])];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressMsg(`Uploading image ${i + 1} of ${files.length} (${file.name})…`);
        const uploaded = await uploadEntryImageToStorage(file, entryId);
        newImages.push(uploaded);
      }
      onUpdateBlock({
        ...galleryBlock,
        images: newImages,
      });
      setUploadProgressMsg(null);
    } catch (err: any) {
      setUploadError('Failed to upload image: ' + (err.message || String(err)));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const moveGalleryImage = (imgIdx: number, dir: 'up' | 'down') => {
    const galleryBlock = block as ImageGalleryBlock;
    const imgs = [...galleryBlock.images];
    const targetIdx = dir === 'up' ? imgIdx - 1 : imgIdx + 1;
    if (targetIdx < 0 || targetIdx >= imgs.length) return;
    const temp = imgs[imgIdx];
    imgs[imgIdx] = imgs[targetIdx];
    imgs[targetIdx] = temp;
    onUpdateBlock({ ...galleryBlock, images: imgs });
  };

  const removeGalleryImage = (imgIdx: number) => {
    const galleryBlock = block as ImageGalleryBlock;
    const imgs = galleryBlock.images.filter((_, i) => i !== imgIdx);
    onUpdateBlock({ ...galleryBlock, images: imgs });
  };

  const updateGalleryImage = (imgIdx: number, field: keyof EntryImage, val: string) => {
    const galleryBlock = block as ImageGalleryBlock;
    const imgs = galleryBlock.images.map((img, i) => (i === imgIdx ? { ...img, [field]: val } : img));
    onUpdateBlock({ ...galleryBlock, images: imgs });
  };

  // ---------------- Handlers for Document Reader Block ----------------
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressMsg(`Uploading PDF "${file.name}"…`);

    const docBlock = block as DocumentReaderBlock;

    try {
      const uploaded = await uploadEntryFileToStorage(file, entryId, 'documents');
      onUpdateBlock({
        ...docBlock,
        pdfUrl: uploaded.url,
        pdfStoragePath: uploaded.storagePath,
        pdfFileName: file.name,
        pdfFileSize: uploaded.fileSize,
        originalFileUrl: uploaded.url,
        originalFileName: file.name,
        allowDownload: docBlock.allowDownload !== undefined ? docBlock.allowDownload : true,
        title: docBlock.title || file.name.replace(/\.[^/.]+$/, ''),
      });
      setUploadProgressMsg(null);
    } catch (err: any) {
      setUploadError('PDF upload error: ' + (err.message || String(err)));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleOriginalDownloadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressMsg(`Uploading downloadable file "${file.name}"…`);

    const docBlock = block as DocumentReaderBlock;

    try {
      const uploaded = await uploadEntryFileToStorage(file, entryId, 'documents');
      onUpdateBlock({
        ...docBlock,
        originalFileUrl: uploaded.url,
        originalFileName: file.name,
        pdfFileSize: uploaded.fileSize,
        allowDownload: true, // Automatically enable download for the uploaded file
      });
      setUploadProgressMsg(null);
    } catch (err: any) {
      setUploadError('Download file upload error: ' + (err.message || String(err)));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handlePageImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgressMsg(`Uploading ${files.length} page scan(s)…`);

    const docBlock = block as DocumentReaderBlock;
    const currentPages = [...(docBlock.pages || [])];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressMsg(`Uploading page scan ${i + 1} of ${files.length}…`);
        const uploaded = await uploadEntryFileToStorage(file, entryId, 'pages');
        currentPages.push({
          id: uploaded.id,
          url: uploaded.url,
          pageNumber: currentPages.length + 1,
          caption: '',
          storagePath: uploaded.storagePath,
        });
      }
      onUpdateBlock({
        ...docBlock,
        pages: currentPages,
      });
      setUploadProgressMsg(null);
    } catch (err: any) {
      setUploadError('Page upload error: ' + (err.message || String(err)));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const moveDocumentPage = (pageIdx: number, dir: 'up' | 'down') => {
    const docBlock = block as DocumentReaderBlock;
    const pgs = [...(docBlock.pages || [])];
    const targetIdx = dir === 'up' ? pageIdx - 1 : pageIdx + 1;
    if (targetIdx < 0 || targetIdx >= pgs.length) return;
    const temp = pgs[pageIdx];
    pgs[pageIdx] = pgs[targetIdx];
    pgs[targetIdx] = temp;
    // Update sequential page numbers
    pgs.forEach((p, i) => {
      p.pageNumber = i + 1;
    });
    onUpdateBlock({ ...docBlock, pages: pgs });
  };

  const removeDocumentPage = (pageIdx: number) => {
    const docBlock = block as DocumentReaderBlock;
    const pgs = (docBlock.pages || []).filter((_, i) => i !== pageIdx);
    pgs.forEach((p, i) => {
      p.pageNumber = i + 1;
    });
    onUpdateBlock({ ...docBlock, pages: pgs });
  };

  const updateDocumentPageCaption = (pageIdx: number, caption: string) => {
    const docBlock = block as DocumentReaderBlock;
    const pgs = (docBlock.pages || []).map((p, i) => (i === pageIdx ? { ...p, caption } : p));
    onUpdateBlock({ ...docBlock, pages: pgs });
  };

  // ---------------- Handlers for Video Block ----------------
  const handleVideoUrlChange = (url: string) => {
    const videoBlock = block as VideoBlock;
    const parsed = parseVideoUrl(url);

    if (parsed) {
      setUploadError(null);
      onUpdateBlock({
        ...videoBlock,
        originalUrl: url,
        embedUrl: parsed.embedUrl,
        provider: parsed.provider,
      });
    } else {
      onUpdateBlock({
        ...videoBlock,
        originalUrl: url,
      });
      if (url.trim()) {
        setUploadError(
          'Please enter a supported video URL from Vimeo, YouTube, or Google Drive. Raw HTML embed tags are not accepted.'
        );
      } else {
        setUploadError(null);
      }
    }
  };

  return (
    <div className="border border-black/20 bg-white p-5 space-y-4 font-sans relative shadow-2xs">
      {/* Block Header with Type Badge, Reorder, Remove */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono-quiet text-[11px] uppercase tracking-wider px-2 py-0.5 bg-black text-white font-medium">
            Block {index + 1}: {block.type.replace('_', ' ')}
          </span>
          <span className="text-xs font-mono-quiet text-black/50">
            {block.type === 'text' && 'Prose & [[wikilinks]]'}
            {block.type === 'image_gallery' && `${(block as ImageGalleryBlock).images?.length || 0} images`}
            {block.type === 'document_reader' &&
              ((block as DocumentReaderBlock).sourceType === 'pdf'
                ? 'PDF Document'
                : `${(block as DocumentReaderBlock).pages?.length || 0} pages`)}
            {block.type === 'video' && ((block as VideoBlock).provider ? `${(block as VideoBlock).provider}` : 'Video embed')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono-quiet text-xs">
          <button
            type="button"
            onClick={() => onMoveBlock(index, 'up')}
            disabled={index === 0}
            className="px-2 py-0.5 border border-black/20 disabled:text-black/20 hover:border-black"
            title="Move block up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveBlock(index, 'down')}
            disabled={index === totalBlocks - 1}
            className="px-2 py-0.5 border border-black/20 disabled:text-black/20 hover:border-black"
            title="Move block down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemoveBlock(index)}
            className="px-2.5 py-0.5 border border-red-300 text-red-700 hover:bg-red-50 text-[11px]"
            title="Remove block"
          >
            × Remove
          </button>
        </div>
      </div>

      {/* Progress & Error Notices */}
      {isUploading && (
        <div className="p-2.5 bg-black/[0.03] border border-black/10 text-xs font-mono-quiet text-black animate-pulse">
          {uploadProgressMsg || 'Uploading…'}
        </div>
      )}
      {uploadError && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-xs font-mono-quiet text-red-800">
          {uploadError}
        </div>
      )}

      {/* ---------------- 1. TEXT BLOCK EDITOR ---------------- */}
      {block.type === 'text' && (
        <FormattedField
          label="Text Content (Paragraphs, bullet points, and [[Wiki Links]])"
          helperText="Select text to apply Title Style or insert Hyperlinks (external URLs or internal entry links)."
          value={(block as TextBlock).content}
          onChange={handleTextChange}
          placeholder="Write entry commentary, transcription notes, or project score instructions here. Use [[Target Entry Title]] or [text](url) to create connections."
          multiline
          rows={6}
          allEntries={allEntries}
        />
      )}

      {/* ---------------- 2. IMAGE GALLERY BLOCK EDITOR ---------------- */}
      {block.type === 'image_gallery' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-quiet text-black/60">
                Gallery Title (Optional)
              </label>
              <input
                type="text"
                value={(block as ImageGalleryBlock).title || ''}
                onChange={(e) => onUpdateBlock({ ...block, title: e.target.value } as ImageGalleryBlock)}
                placeholder="e.g. Installation documentation or Paper studies"
                className="w-full p-2 border border-black/25 text-xs font-sans focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono-quiet text-black/60">
                Display Layout
              </label>
              <select
                value={(block as ImageGalleryBlock).layout || 'stacked'}
                onChange={(e) =>
                  onUpdateBlock({
                    ...block,
                    layout: e.target.value as 'stacked' | 'grid' | 'carousel',
                  } as ImageGalleryBlock)
                }
                className="w-full p-2 border border-black/25 text-xs font-mono-quiet bg-white focus:outline-none focus:border-black"
              >
                <option value="stacked">Stacked (Single-column vertical)</option>
                <option value="grid">Grid (Two-column layout)</option>
              </select>
            </div>
          </div>

          {/* Upload Button */}
          <div>
            <label className="inline-flex items-center px-4 py-2 border border-black text-xs font-mono-quiet cursor-pointer hover:bg-black hover:text-white transition-colors">
              <span>+ Upload Documentation Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleGalleryUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Images List */}
          {(block as ImageGalleryBlock).images?.length > 0 ? (
            <div className="space-y-3 pt-2">
              {(block as ImageGalleryBlock).images.map((img, imgIdx) => (
                <div key={img.id || imgIdx} className="flex gap-4 p-3 border border-black/15 bg-black/[0.015] items-start">
                  <img
                    src={img.url}
                    alt={img.alt || 'Gallery thumbnail'}
                    className="w-20 h-20 object-cover border border-black/10 shrink-0 bg-white"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono-quiet">
                      <span className="text-black/50 text-[10px]">Image {imgIdx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(imgIdx, 'up')}
                          disabled={imgIdx === 0}
                          className="px-1.5 py-0.5 border border-black/20 disabled:opacity-20 text-[10px]"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(imgIdx, 'down')}
                          disabled={imgIdx === (block as ImageGalleryBlock).images.length - 1}
                          className="px-1.5 py-0.5 border border-black/20 disabled:opacity-20 text-[10px]"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(imgIdx)}
                          className="px-1.5 py-0.5 border border-red-200 text-red-700 text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <FormattedField
                      label="Caption"
                      placeholder="Caption (select text for Title Style or Hyperlink)…"
                      value={img.caption || ''}
                      onChange={(val) => updateGalleryImage(imgIdx, 'caption', val)}
                      allEntries={allEntries}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono-quiet text-black/50">Alt text</label>
                        <input
                          type="text"
                          placeholder="Alt description for accessibility…"
                          value={img.alt || ''}
                          onChange={(e) => updateGalleryImage(imgIdx, 'alt', e.target.value)}
                          className="w-full p-1.5 border border-black/15 text-[11px] bg-white focus:outline-none"
                        />
                      </div>
                      <FormattedField
                        label="Photo credit"
                        placeholder="Photo credit…"
                        value={img.credit || ''}
                        onChange={(val) => updateGalleryImage(imgIdx, 'credit', val)}
                        allEntries={allEntries}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs font-editorial italic text-black/40 py-2">
              No images in this gallery yet. Click upload above to add documentation.
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. DOCUMENT READER BLOCK EDITOR ---------------- */}
      {block.type === 'document_reader' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono-quiet text-black/60">
                Document Title *
              </label>
              <input
                type="text"
                value={(block as DocumentReaderBlock).title}
                onChange={(e) =>
                  onUpdateBlock({ ...block, title: e.target.value } as DocumentReaderBlock)
                }
                placeholder="e.g. Part Time Book Club Issue 01"
                className="w-full p-2 border border-black/25 text-xs font-sans focus:outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono-quiet text-black/60">
                Source Type
              </label>
              <select
                value={(block as DocumentReaderBlock).sourceType}
                onChange={(e) =>
                  onUpdateBlock({
                    ...block,
                    sourceType: e.target.value as 'pdf' | 'page_images',
                  } as DocumentReaderBlock)
                }
                className="w-full p-2 border border-black/25 text-xs font-mono-quiet bg-white focus:outline-none focus:border-black"
              >
                <option value="pdf">PDF Document (Facsimile with selectable text)</option>
                <option value="page_images">Ordered Page Images (Zine / Scans)</option>
              </select>
            </div>
          </div>

          {/* Sub-form 3A: PDF Document Upload */}
          {(block as DocumentReaderBlock).sourceType === 'pdf' && (
            <div className="p-4 border border-black/15 bg-black/[0.015] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="inline-flex items-center px-4 py-2 border border-black text-xs font-mono-quiet cursor-pointer hover:bg-black hover:text-white transition-colors">
                  <span>Upload PDF File (up to 50MB)</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handlePdfUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {(block as DocumentReaderBlock).pdfUrl && (
                  <div className="text-xs font-mono-quiet text-black/70">
                    File: <span className="font-medium text-black">{(block as DocumentReaderBlock).pdfFileName || 'document.pdf'}</span>
                    {(block as DocumentReaderBlock).pdfFileSize && (
                      <span className="text-black/40 ml-1.5">({(block as DocumentReaderBlock).pdfFileSize})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Direct PDF URL input for existing/external files */}
              <div>
                <label className="block text-[11px] font-mono-quiet text-black/60">
                  Or Direct PDF URL:
                </label>
                <input
                  type="text"
                  value={(block as DocumentReaderBlock).pdfUrl || ''}
                  onChange={(e) =>
                    onUpdateBlock({
                      ...block,
                      pdfUrl: e.target.value,
                      originalFileUrl: (block as DocumentReaderBlock).originalFileUrl || e.target.value,
                    } as DocumentReaderBlock)
                  }
                  placeholder="https://.../document.pdf"
                  className="w-full p-1.5 border border-black/20 text-xs font-mono-quiet bg-white"
                />
              </div>
            </div>
          )}

          {/* Sub-form 3B: Page Images Upload */}
          {(block as DocumentReaderBlock).sourceType === 'page_images' && (
            <div className="p-4 border border-black/15 bg-black/[0.015] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-quiet text-black/60">
                    Page Presentation Mode *
                  </label>
                  <select
                    value={(block as DocumentReaderBlock).pageType || 'individual_pages'}
                    onChange={(e) =>
                      onUpdateBlock({
                        ...block,
                        pageType: e.target.value as 'individual_pages' | 'already_composed_spreads',
                      } as DocumentReaderBlock)
                    }
                    className="w-full p-2 border border-black/25 text-xs font-mono-quiet bg-white focus:outline-none focus:border-black"
                  >
                    <option value="individual_pages">
                      Individual Pages (allows Single or Paired Spread views)
                    </option>
                    <option value="already_composed_spreads">
                      Already-Composed Spreads (displays pre-composed spreads intact)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-quiet text-black/60">
                    Upload Pages / Spreads
                  </label>
                  <label className="inline-flex items-center px-4 py-2 border border-black text-xs font-mono-quiet cursor-pointer hover:bg-black hover:text-white transition-colors">
                    <span>+ Upload Page Scans</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePageImagesUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Ordered Page Scans List */}
              {((block as DocumentReaderBlock).pages || []).length > 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono-quiet text-black/50">
                    Pages list ({((block as DocumentReaderBlock).pages || []).length} pages). Drag or use arrows to reorder:
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-black/10 p-2 bg-white">
                    {((block as DocumentReaderBlock).pages || []).map((page, pIdx) => (
                      <div key={page.id || pIdx} className="flex items-center gap-3 p-2 border border-black/10 bg-black/[0.01]">
                        <img
                          src={page.url}
                          alt={`Page ${pIdx + 1}`}
                          className="w-12 h-14 object-contain border border-black/15 bg-white shrink-0"
                        />
                        <div className="flex-1 text-xs font-mono-quiet space-y-1">
                          <span className="font-bold text-black mr-2">Page #{pIdx + 1}</span>
                          <FormattedField
                            placeholder="Optional page caption or folio title (supports Title Style & Hyperlinks)…"
                            value={page.caption || ''}
                            onChange={(val) => updateDocumentPageCaption(pIdx, val)}
                            allEntries={allEntries}
                          />
                        </div>
                        <div className="flex items-center gap-1 font-mono-quiet text-xs shrink-0">
                          <button
                            type="button"
                            onClick={() => moveDocumentPage(pIdx, 'up')}
                            disabled={pIdx === 0}
                            className="px-1.5 py-0.5 border border-black/20 disabled:opacity-20"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDocumentPage(pIdx, 'down')}
                            disabled={pIdx === ((block as DocumentReaderBlock).pages || []).length - 1}
                            className="px-1.5 py-0.5 border border-black/20 disabled:opacity-20"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDocumentPage(pIdx)}
                            className="px-1.5 py-0.5 border border-red-200 text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-editorial italic text-black/40 py-2">
                  No page images uploaded yet. Upload individual pages or book spreads above.
                </div>
              )}
            </div>
          )}

          {/* Sub-form 3C: Dedicated Download File Function (Toggled on/off depending on uploaded files) */}
          <div className="p-4 border border-black/20 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-quiet font-bold uppercase tracking-wider text-black">
                    Download File Function
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono-quiet font-medium ${
                      ((block as DocumentReaderBlock).allowDownload ?? true)
                        ? 'bg-black text-white'
                        : 'bg-black/10 text-black/60'
                    }`}
                  >
                    {((block as DocumentReaderBlock).allowDownload ?? true)
                      ? 'DOWNLOAD ENABLED'
                      : 'DOWNLOAD DISABLED (VIEW-ONLY)'}
                  </span>
                </div>
                <p className="text-[11px] font-mono-quiet text-black/60 mt-0.5">
                  Toggle whether visitors can download the uploaded document file, or keep it view-only in the reader.
                </p>
              </div>

              {/* Download toggle button */}
              <button
                type="button"
                onClick={() => {
                  const current = (block as DocumentReaderBlock).allowDownload ?? true;
                  onUpdateBlock({
                    ...block,
                    allowDownload: !current,
                  } as DocumentReaderBlock);
                }}
                className={`px-3 py-1.5 text-xs font-mono-quiet border transition-colors flex items-center gap-2 cursor-pointer ${
                  ((block as DocumentReaderBlock).allowDownload ?? true)
                    ? 'border-black bg-black text-white hover:bg-black/85'
                    : 'border-black/30 text-black/70 hover:border-black hover:text-black bg-black/[0.02]'
                }`}
                title="Toggle file download capability for readers"
              >
                <span>
                  {((block as DocumentReaderBlock).allowDownload ?? true)
                    ? '✓ Download File: Enabled'
                    : '✕ Download File: Disabled'}
                </span>
              </button>
            </div>

            {/* State details & file association */}
            {((block as DocumentReaderBlock).allowDownload ?? true) ? (
              <div className="space-y-3">
                {/* Active download status */}
                {((block as DocumentReaderBlock).originalFileUrl || (block as DocumentReaderBlock).pdfUrl) ? (
                  <div className="p-3 bg-black/[0.02] border border-black/15 text-xs font-mono-quiet space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-black/60 text-[11px]">Active Downloadable File:</span>
                      <span className="font-semibold text-black">
                        {(block as DocumentReaderBlock).originalFileName ||
                          (block as DocumentReaderBlock).pdfFileName ||
                          'document.pdf'}
                      </span>
                    </div>
                    {((block as DocumentReaderBlock).pdfFileSize) && (
                      <div className="text-[11px] text-black/50">
                        File Size: {(block as DocumentReaderBlock).pdfFileSize}
                      </div>
                    )}
                    <div className="text-[11px] text-green-800 flex items-center gap-1 pt-1">
                      <span>✓</span>
                      <span>
                        The “↓ Download” button is active in the public reader for visitors to download this file.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono-quiet">
                    <span className="font-medium">File Needed:</span> Download is toggled ON, but no file is attached yet.
                    Upload a file or provide a link below to make it available to visitors.
                  </div>
                )}

                {/* For Page Images, offer companion file upload */}
                {(block as DocumentReaderBlock).sourceType === 'page_images' && (
                  <div className="p-3 border border-black/10 bg-black/[0.01] space-y-2">
                    <label className="block text-[11px] font-mono-quiet text-black/70 font-medium">
                      Upload Companion Download File (PDF or Archive for this zine/book):
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center px-3 py-1.5 border border-black text-xs font-mono-quiet cursor-pointer hover:bg-black hover:text-white transition-colors">
                        <span>+ Upload Downloadable File</span>
                        <input
                          type="file"
                          onChange={handleOriginalDownloadUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                      {(block as DocumentReaderBlock).originalFileName && (
                        <span className="text-xs font-mono-quiet text-black/70">
                          Attached: <strong>{(block as DocumentReaderBlock).originalFileName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional external/direct download link override */}
                <div>
                  <label className="block text-[11px] font-mono-quiet text-black/60">
                    Custom Download Link / URL (Optional):
                  </label>
                  <input
                    type="text"
                    value={(block as DocumentReaderBlock).originalFileUrl || ''}
                    onChange={(e) =>
                      onUpdateBlock({
                        ...block,
                        originalFileUrl: e.target.value,
                      } as DocumentReaderBlock)
                    }
                    placeholder="https://.../download.pdf"
                    className="w-full p-1.5 border border-black/20 text-xs font-mono-quiet bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black/[0.02] border border-black/15 text-xs font-mono-quiet text-black/70 space-y-1">
                <div className="font-semibold text-black">
                  View-Only Protection Enabled
                </div>
                <p className="text-[11px]">
                  The download button is hidden in the public reader. Readers can only inspect the facsimile online and cannot download the original file.
                </p>
              </div>
            )}
          </div>

          {/* Description / Colophon field */}
          <div>
            <label className="block text-[11px] font-mono-quiet text-black/60">
              Document Colophon / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={(block as DocumentReaderBlock).description || ''}
              onChange={(e) =>
                onUpdateBlock({ ...block, description: e.target.value } as DocumentReaderBlock)
              }
              placeholder="e.g. Risograph-printed edition of 100, 24 pages, published by 述书 / SS."
              className="w-full p-2 border border-black/25 text-xs font-sans focus:outline-none focus:border-black"
            />
          </div>
        </div>
      )}

      {/* ---------------- 4. VIDEO EMBED BLOCK EDITOR ---------------- */}
      {block.type === 'video' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono-quiet text-black/60">
              Video URL (Vimeo, YouTube, or Google Drive) *
            </label>
            <input
              type="text"
              value={(block as VideoBlock).originalUrl || ''}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="e.g. https://vimeo.com/... or https://youtu.be/... or https://drive.google.com/file/d/.../view"
              className="w-full p-2 border border-black/25 text-xs font-mono-quiet bg-white focus:outline-none focus:border-black"
              required
            />
            <p className="text-[10px] font-mono-quiet text-black/40 pt-1">
              Supports: YouTube (watch, youtu.be, shorts), Vimeo, and Google Drive links. Arbitrary HTML embed code is rejected for security.
            </p>
          </div>

          <div className="space-y-3">
            <FormattedField
              label="Video Title (Optional)"
              value={(block as VideoBlock).title || ''}
              onChange={(val) => onUpdateBlock({ ...block, title: val } as VideoBlock)}
              placeholder="Video title…"
              allEntries={allEntries}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormattedField
                label="Caption (Optional)"
                value={(block as VideoBlock).caption || ''}
                onChange={(val) => onUpdateBlock({ ...block, caption: val } as VideoBlock)}
                placeholder="Brief caption…"
                allEntries={allEntries}
              />
              <FormattedField
                label="Credit / Camera (Optional)"
                value={(block as VideoBlock).credit || ''}
                onChange={(val) => onUpdateBlock({ ...block, credit: val } as VideoBlock)}
                placeholder="Documentation credit…"
                allEntries={allEntries}
              />
            </div>
          </div>

          {/* Embed Preview */}
          {(block as VideoBlock).embedUrl && (
            <div className="p-3 border border-black/15 bg-black/[0.015] space-y-2">
              <div className="text-[10px] font-mono-quiet uppercase text-black/40 tracking-wider flex items-center justify-between">
                <span>Embed Preview ({(block as VideoBlock).provider})</span>
                <span className="text-emerald-700">Valid URL</span>
              </div>
              <div className="relative aspect-video max-w-md bg-black/5 border border-black/10 overflow-hidden">
                <iframe
                  src={(block as VideoBlock).embedUrl}
                  title="Editor preview"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {(block as VideoBlock).provider === 'google_drive' && (
                <p className="text-[10px] font-mono-quiet text-black/50">
                  Note: Remember to configure Google Drive permissions to "Anyone with the link can view".
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
