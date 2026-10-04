import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { publicAssetUrl } from '../services/publicAssetUrl';
import { DocumentReaderBlock, DocumentPage } from '../types';

// Ensure PDF.js worker is registered
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = publicAssetUrl('/pdf.worker.min.mjs');
}

interface DocumentReaderProps {
  block: DocumentReaderBlock;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({ block }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Determine if mobile screen
  const isMobileInitial = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const isPdf = block.sourceType === 'pdf';
  const isPrecomposedSpread = block.sourceType === 'page_images' && block.pageType === 'already_composed_spreads';

  // View mode for individual pages or PDF: 'single' or 'spread'
  const [viewMode, setViewMode] = useState<'single' | 'spread'>(
    isPrecomposedSpread ? 'spread' : isMobileInitial ? 'single' : 'spread'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  // Download capability toggle: controlled from editor
  const isDownloadAllowed = Boolean(block.allowDownload ?? true);
  const downloadUrl = publicAssetUrl(block.originalFileUrl || block.pdfUrl);
  const downloadFileName = block.originalFileName || block.pdfFileName || 'document.pdf';

  // ---------------- PDF.js In-Memory Document State ----------------
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(isPdf);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [renderedPdfPages, setRenderedPdfPages] = useState<{ [pageNum: number]: string }>({});

  const pdfUrl = publicAssetUrl(block.pdfUrl || block.originalFileUrl);

  // Load PDF document using PDF.js without ever triggering browser file downloads
  const loadPdfDocument = useCallback(async () => {
    if (!isPdf || !pdfUrl) return;
    setPdfLoading(true);
    setPdfError(null);
    setCurrentIndex(0);

    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = publicAssetUrl('/pdf.worker.min.mjs');
      }

      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        withCredentials: false,
      });

      const loadedDoc = await loadingTask.promise;
      setPdfDoc(loadedDoc);
      setPdfLoading(false);
    } catch (err: any) {
      console.error('PDF.js loading error:', err);
      setPdfError(err?.message || 'Could not load PDF document. Please verify the file URL and network connection.');
      setPdfLoading(false);
    }
  }, [isPdf, pdfUrl]);

  useEffect(() => {
    if (isPdf) {
      loadPdfDocument();
    }
  }, [isPdf, loadPdfDocument]);

  // Progressive page renderer for PDF
  const renderPdfPage = useCallback(
    async (doc: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> => {
      const page = await doc.getPage(pageNumber);
      // High-resolution scale (2.0) for sharp typography rendering
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D context not available');

      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/png');
    },
    []
  );

  // Trigger page rendering as navigation advances
  useEffect(() => {
    if (!isPdf || !pdfDoc) return;

    const neededPages: number[] = [];
    if (viewMode === 'spread') {
      const left = currentIndex * 2 + 1;
      const right = left + 1 <= pdfDoc.numPages ? left + 1 : null;
      if (left <= pdfDoc.numPages && !renderedPdfPages[left]) neededPages.push(left);
      if (right && !renderedPdfPages[right]) neededPages.push(right);
      // Pre-render next spread
      if (left + 2 <= pdfDoc.numPages && !renderedPdfPages[left + 2]) neededPages.push(left + 2);
    } else {
      const cur = currentIndex + 1;
      if (cur <= pdfDoc.numPages && !renderedPdfPages[cur]) neededPages.push(cur);
      // Pre-render next page
      if (cur + 1 <= pdfDoc.numPages && !renderedPdfPages[cur + 1]) neededPages.push(cur + 1);
    }

    neededPages.forEach((pNum) => {
      renderPdfPage(pdfDoc, pNum).then((dataUrl) => {
        setRenderedPdfPages((prev) => ({ ...prev, [pNum]: dataUrl }));
      });
    });
  }, [isPdf, pdfDoc, currentIndex, viewMode, renderedPdfPages, renderPdfPage]);

  // Progressively render all thumbnails when drawer is opened
  useEffect(() => {
    if (!isPdf || !pdfDoc || !showThumbnails) return;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      if (!renderedPdfPages[i]) {
        renderPdfPage(pdfDoc, i).then((dataUrl) => {
          setRenderedPdfPages((prev) => ({ ...prev, [i]: dataUrl }));
        });
      }
    }
  }, [isPdf, pdfDoc, showThumbnails, renderedPdfPages, renderPdfPage]);

  // Unified pages array: works for both PDF.js pages and uploaded image sets
  const effectivePages: DocumentPage[] = isPdf
    ? pdfDoc
      ? Array.from({ length: pdfDoc.numPages }).map((_, i) => ({
          id: `pdf-p-${i + 1}`,
          pageNumber: i + 1,
          url: renderedPdfPages[i + 1] || '',
          caption: `Page ${i + 1} of ${pdfDoc.numPages}`,
        }))
      : []
    : block.pages || [];

  // Total pages count calculation
  const totalPages = isPdf
    ? pdfDoc ? pdfDoc.numPages : 1
    : isPrecomposedSpread
    ? effectivePages.length * 2
    : effectivePages.length;

  // Total step count for navigation
  const stepCount = isPrecomposedSpread
    ? effectivePages.length
    : viewMode === 'spread'
    ? Math.max(1, Math.ceil(effectivePages.length / 2))
    : Math.max(1, effectivePages.length);

  // Compute active page indices
  const leftPageIndex = isPrecomposedSpread
    ? currentIndex
    : viewMode === 'spread'
    ? currentIndex * 2
    : currentIndex;

  const rightPageIndex =
    viewMode === 'spread' && !isPrecomposedSpread
      ? leftPageIndex + 1 < effectivePages.length
        ? leftPageIndex + 1
        : null
      : null;

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(stepCount - 1, prev + 1));
  }, [stepCount]);

  // Touch swipe support for smooth mobile folio turning
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Process when container or child is focused or in fullscreen
      if (document.activeElement && containerRef.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Zoom controls: Keep zoom available for reading detail
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Jump to specific page
  const jumpToPage = (pageIdx: number) => {
    if (isPrecomposedSpread) {
      setCurrentIndex(pageIdx);
    } else if (viewMode === 'spread') {
      setCurrentIndex(Math.floor(pageIdx / 2));
    } else {
      setCurrentIndex(pageIdx);
    }
  };

  // Page label calculation:
  // "Use “p. 3 / 24” for a single page and “pp. 4–5 / 24” for a spread, where 24 is the total number of pages."
  let pageLabel = '';
  if (isPrecomposedSpread) {
    const startPage = currentIndex * 2 + 1;
    const endPage = Math.min(totalPages, currentIndex * 2 + 2);
    pageLabel = `pp. ${startPage}–${endPage} / ${totalPages}`;
  } else if (viewMode === 'spread') {
    if (rightPageIndex !== null) {
      pageLabel = `pp. ${leftPageIndex + 1}–${rightPageIndex + 1} / ${totalPages}`;
    } else {
      pageLabel = `p. ${leftPageIndex + 1} / ${totalPages}`;
    }
  } else {
    pageLabel = `p. ${currentIndex + 1} / ${totalPages}`;
  }

  // Active page end index for progress bar
  const currentProgressPage = isPrecomposedSpread
    ? Math.min(totalPages, (currentIndex + 1) * 2)
    : viewMode === 'spread'
    ? (rightPageIndex !== null ? rightPageIndex + 1 : leftPageIndex + 1)
    : currentIndex + 1;

  const progressPercentage = totalPages > 0
    ? Math.min(100, Math.max(0, (currentProgressPage / totalPages) * 100))
    : 0;

  // Interactive progress bar click handler
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stepCount <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetStep = Math.min(stepCount - 1, Math.floor(ratio * stepCount));
    setCurrentIndex(targetStep);
  };

  return (
    <section
      ref={containerRef}
      tabIndex={0}
      className={`border border-black/20 bg-white font-sans transition-all focus:outline-none flex flex-col justify-between ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-3 sm:p-5 w-screen h-screen'
          : 'my-6 p-3 sm:p-5 w-full h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] min-h-[460px] max-h-[920px]'
      }`}
      aria-label={`Document reader for ${block.title}`}
    >
      {/* 1. Header Toolbar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-2 border-b border-black/10">
        {/* Document Title & Type */}
        <div className="space-y-0.5 min-w-0 pr-2">
          <div className="text-[11px] font-mono-quiet uppercase tracking-wider text-black/40 truncate">
            Document Reader · {isPdf ? 'PDF Facsimile' : isPrecomposedSpread ? 'Pre-composed Spreads' : 'Page Sequence'}
          </div>
          <h4 className="font-editorial text-lg sm:text-2xl text-black font-normal truncate">
            {block.title}
          </h4>
          {block.description && (
            <p className="text-[11px] font-mono-quiet text-black/55 line-clamp-1 pt-0.5" title={block.description}>
              {block.description}
            </p>
          )}
        </div>

        {/* Top Controls: Recognisable Icon Buttons with Accessible Labels */}
        <div className="shrink-0 flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-mono-quiet">
          {/* Segmented View Mode Toggle: Single Page vs Spread Icons (Works for both PDFs and individual page sets) */}
          {!isPrecomposedSpread && (!isPdf || (pdfDoc && pdfDoc.numPages > 1)) && (
            <div className="flex items-center border border-black/25 divide-x divide-black/25 bg-white">
              {/* Single Page Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setViewMode('single');
                  setZoomLevel(1);
                }}
                className={`p-1.5 transition-colors flex items-center justify-center cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-black text-white'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
                aria-label="Single page view"
                title="Single page view"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="5" y="2.5" width="10" height="15" rx="1" />
                  <line x1="7.5" y1="6.5" x2="12.5" y2="6.5" strokeLinecap="round" />
                  <line x1="7.5" y1="10" x2="12.5" y2="10" strokeLinecap="round" />
                  <line x1="7.5" y1="13.5" x2="10.5" y2="13.5" strokeLinecap="round" />
                </svg>
              </button>

              {/* Spread / Facing Pages Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setViewMode('spread');
                  setZoomLevel(1);
                }}
                className={`p-1.5 transition-colors flex items-center justify-center cursor-pointer ${
                  viewMode === 'spread'
                    ? 'bg-black text-white'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
                aria-label="Paired page spread view"
                title="Paired page spread view"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3.5" width="7.5" height="13" rx="1" />
                  <rect x="10.5" y="3.5" width="7.5" height="13" rx="1" />
                  <line x1="10" y1="3.5" x2="10" y2="16.5" strokeLinecap="round" strokeDasharray="1 2" />
                </svg>
              </button>
            </div>
          )}

          {/* Zoom controls: Kept available for reading fine details */}
          <div className="flex items-center border border-black/25 divide-x divide-black/25 bg-white">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              className="px-2 py-1 text-black/70 hover:text-black hover:bg-black/5 disabled:text-black/20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-1 text-[11px] text-black/80 hover:text-black hover:bg-black/5 min-w-[42px] text-center cursor-pointer"
              aria-label="Reset zoom to 100%"
              title="Reset zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="px-2 py-1 text-black/70 hover:text-black hover:bg-black/5 disabled:text-black/20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Thumbnails Icon Toggle */}
          {((!isPdf && effectivePages.length > 1) || (isPdf && pdfDoc && pdfDoc.numPages > 1)) && (
            <button
              type="button"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-1.5 border transition-colors flex items-center justify-center cursor-pointer ${
                showThumbnails
                  ? 'bg-black text-white border-black'
                  : 'border-black/25 text-black/75 hover:text-black hover:border-black hover:bg-black/5'
              }`}
              aria-label={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
              title={showThumbnails ? 'Hide thumbnails' : 'Thumbnails'}
            >
              {/* 2x2 Grid Icon */}
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
                <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" />
                <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" />
                <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" />
              </svg>
            </button>
          )}

          {/* Fullscreen Icon Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-1.5 border transition-colors flex items-center justify-center cursor-pointer ${
              isFullscreen
                ? 'bg-black text-white border-black'
                : 'border-black/25 text-black/75 hover:text-black hover:border-black hover:bg-black/5'
            }`}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              /* Collapse Inward Corners Icon */
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 3.5v3.5H3.5" />
                <path d="M13 3.5v3.5h3.5" />
                <path d="M7 16.5V13H3.5" />
                <path d="M13 16.5V13h3.5" />
              </svg>
            ) : (
              /* Expand Outward Corners Icon */
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.5 7V3.5h3.5" />
                <path d="M16.5 7V3.5H13" />
                <path d="M3.5 13v3.5h3.5" />
                <path d="M16.5 13v3.5H13" />
              </svg>
            )}
          </button>

          {/* Download Original File Button - Explicit user action only, never triggered automatically */}
          {isDownloadAllowed && downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadFileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-black/[0.03] border border-black/25 hover:border-black text-black inline-flex items-center gap-1 transition-colors cursor-pointer"
              title={`Download ${downloadFileName}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 17h12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Download {block.pdfFileSize ? `(${block.pdfFileSize})` : ''}</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. Reader Body / Document Viewing Stage */}
      <div className="flex-1 min-h-0 relative flex flex-col justify-between overflow-hidden">
        {/* PDF Loading / Error State Handling */}
        {isPdf && pdfError ? (
          <div className="flex-1 min-h-0 w-full bg-black/[0.015] border border-black/10 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-3 font-mono-quiet text-xs">
            <div className="text-red-700 font-semibold text-sm">
              Unable to load PDF facsimile
            </div>
            <p className="text-[11px] text-black/60 max-w-md">
              {pdfError}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadPdfDocument()}
                className="px-4 py-2 border border-black bg-black text-white hover:bg-black/85 text-xs font-mono-quiet transition-colors cursor-pointer"
              >
                ↻ Retry Loading
              </button>
            </div>
          </div>
        ) : isPdf && pdfLoading ? (
          <div className="flex-1 min-h-0 w-full bg-black/[0.015] border border-black/10 flex flex-col items-center justify-center p-8 text-center space-y-3 font-mono-quiet text-xs text-black/60">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            <p>Loading PDF facsimile document…</p>
          </div>
        ) : (
          /* Main Stage: Proportions strictly preserved without cropping, fits within available viewport */
          <div
            className="relative w-full flex-1 min-h-0 bg-black/[0.015] border border-black/10 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {effectivePages.length > 0 ? (
              <div
                className={`flex items-center justify-center gap-3 sm:gap-6 w-full h-full max-h-full transition-transform duration-150 ease-out z-10 ${
                  zoomLevel > 1 ? 'overflow-auto cursor-grab' : 'overflow-hidden'
                }`}
                style={{ transform: zoomLevel > 1 ? `scale(${zoomLevel})` : undefined }}
              >
                {/* Left Page (or single page / pre-composed spread) */}
                {effectivePages[leftPageIndex] && (
                  <div
                    onClick={handlePrev}
                    className={`flex flex-col items-center justify-center h-full max-h-full max-w-full space-y-1 ${
                      currentIndex > 0 ? 'cursor-w-resize' : 'cursor-default'
                    }`}
                    title={currentIndex > 0 ? 'Turn page left' : undefined}
                  >
                    {effectivePages[leftPageIndex].url ? (
                      <img
                        src={effectivePages[leftPageIndex].url}
                        alt={effectivePages[leftPageIndex].caption || `Page ${leftPageIndex + 1} of ${block.title}`}
                        className="max-h-full max-w-full w-auto h-auto object-contain shadow-xs border border-black/10 bg-white"
                        loading="lazy"
                      />
                    ) : (
                      /* Placeholder while current page renders in background */
                      <div className="flex flex-col items-center justify-center w-[300px] sm:w-[380px] max-w-full h-full max-h-full border border-black/10 bg-white shadow-xs p-6 space-y-2">
                        <div className="w-5 h-5 border border-black/20 border-t-black rounded-full animate-spin" />
                        <span className="text-[11px] font-mono-quiet text-black/40">
                          Rendering page {leftPageIndex + 1}…
                        </span>
                      </div>
                    )}
                    {effectivePages[leftPageIndex].caption && (
                      <figcaption className="shrink-0 text-[10px] sm:text-[11px] font-mono-quiet text-black/60 text-center max-w-xs sm:max-w-md truncate">
                        {effectivePages[leftPageIndex].caption}
                      </figcaption>
                    )}
                  </div>
                )}

                {/* Right Page (paired spread view only) */}
                {rightPageIndex !== null && effectivePages[rightPageIndex] && (
                  <div
                    onClick={handleNext}
                    className={`flex flex-col items-center justify-center h-full max-h-full max-w-full space-y-1 ${
                      currentIndex < stepCount - 1 ? 'cursor-e-resize' : 'cursor-default'
                    }`}
                    title={currentIndex < stepCount - 1 ? 'Turn page right' : undefined}
                  >
                    {effectivePages[rightPageIndex].url ? (
                      <img
                        src={effectivePages[rightPageIndex].url}
                        alt={effectivePages[rightPageIndex].caption || `Page ${rightPageIndex + 1} of ${block.title}`}
                        className="max-h-full max-w-full w-auto h-auto object-contain shadow-xs border border-black/10 bg-white"
                        loading="lazy"
                      />
                    ) : (
                      /* Placeholder while current page renders in background */
                      <div className="flex flex-col items-center justify-center w-[300px] sm:w-[380px] max-w-full h-full max-h-full border border-black/10 bg-white shadow-xs p-6 space-y-2">
                        <div className="w-5 h-5 border border-black/20 border-t-black rounded-full animate-spin" />
                        <span className="text-[11px] font-mono-quiet text-black/40">
                          Rendering page {rightPageIndex + 1}…
                        </span>
                      </div>
                    )}
                    {effectivePages[rightPageIndex].caption && (
                      <figcaption className="shrink-0 text-[10px] sm:text-[11px] font-mono-quiet text-black/60 text-center max-w-xs sm:max-w-md truncate">
                        {effectivePages[rightPageIndex].caption}
                      </figcaption>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center font-mono-quiet text-xs text-black/40 py-12">
                No document pages available to display.
              </div>
            )}

            {/* Direct Left & Right Click Margins */}
            {effectivePages.length > 1 && (
              <>
                <div
                  onClick={handlePrev}
                  className={`absolute left-0 top-0 bottom-0 w-1/5 z-20 ${
                    currentIndex > 0 ? 'cursor-w-resize' : 'cursor-default'
                  }`}
                  title={currentIndex > 0 ? 'Turn page left' : undefined}
                />
                <div
                  onClick={handleNext}
                  className={`absolute right-0 top-0 bottom-0 w-1/5 z-20 ${
                    currentIndex < stepCount - 1 ? 'cursor-e-resize' : 'cursor-default'
                  }`}
                  title={currentIndex < stepCount - 1 ? 'Turn page right' : undefined}
                />
              </>
            )}
          </div>
        )}

        {/* Expandable Thumbnails Strip (Compact height so viewport is maintained) */}
        {showThumbnails && effectivePages.length > 0 && (
          <div className="shrink-0 h-24 border border-black/15 bg-black/[0.015] p-2 space-y-1 mt-2 overflow-hidden flex flex-col justify-between">
            <div className="text-[10px] font-mono-quiet uppercase text-black/40 tracking-wider">
              Document Thumbnails ({effectivePages.length} folios)
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 h-16">
              {effectivePages.map((page, idx) => {
                const isCurrent =
                  isPrecomposedSpread
                    ? idx === currentIndex
                    : viewMode === 'spread'
                    ? idx === leftPageIndex || idx === rightPageIndex
                    : idx === currentIndex;

                return (
                  <button
                    key={page.id || idx}
                    type="button"
                    onClick={() => jumpToPage(idx)}
                    className={`shrink-0 flex flex-col items-center p-1 border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-black/15 bg-white text-black/70 hover:border-black/50'
                    }`}
                    title={`Go to page ${idx + 1}`}
                  >
                    {page.url ? (
                      <img
                        src={page.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-9 w-7 object-contain bg-white"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-9 w-7 bg-black/[0.04] border border-black/10 flex items-center justify-center text-[9px] font-mono-quiet text-black/40">
                        {idx + 1}
                      </div>
                    )}
                    <span className="text-[9px] font-mono-quiet mt-0.5">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer: Counter → Progress Bar → Instruction */}
      <div className="shrink-0 pt-2.5 sm:pt-3 mt-2 border-t border-black/10 text-xs font-mono-quiet text-black">
        {/* On desktop and tablet, sits on one line. On mobile or large text, wraps into compact two-row layout */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2">
          {/* Page Counter (Left) */}
          <div className="order-1 shrink-0 font-medium text-black">
            {pageLabel}
          </div>

          {/* Progress Bar (Center: flexes to use remaining width) */}
          {effectivePages.length > 1 && (
            <div
              onClick={handleProgressBarClick}
              className="order-3 sm:order-2 w-full sm:w-auto flex-1 min-w-[80px] sm:min-w-[120px] h-5 flex items-center cursor-pointer group select-none"
              title="Click to jump across pages"
              role="progressbar"
              aria-valuenow={Math.round(progressPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Document reading progress"
            >
              <div className="w-full h-1 bg-black/10 group-hover:bg-black/20 rounded-full overflow-hidden relative transition-colors">
                <div
                  className="h-full bg-black transition-all duration-150 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Existing "Click pages..." instruction (Right) */}
          {effectivePages.length > 1 && (
            <div className="order-2 sm:order-3 shrink-0 text-[10px] sm:text-xs text-black/40 text-right whitespace-nowrap">
              Click pages or use ← / → keyboard keys
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
