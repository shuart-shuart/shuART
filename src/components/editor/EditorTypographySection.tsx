import React, { useState } from 'react';
import { SiteSettings, TypographyCombo, Entry } from '../../types';
import { DESIGNATED_EDITOR_EMAIL } from '../../services/mediaUploads';

interface EditorTypographySectionProps {
  siteSettings: SiteSettings;
  entries: Entry[];
  onUpdateSiteSettings: (settings: SiteSettings) => Promise<void> | void;
}

export const EditorTypographySection: React.FC<EditorTypographySectionProps> = ({
  siteSettings,
  entries,
  onUpdateSiteSettings,
}) => {
  // Local preview candidate (does not immediately affect public site until saved)
  const [previewCombo, setPreviewCombo] = useState<TypographyCombo>(
    siteSettings.typography || 'a'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const savedCombo = siteSettings.typography || 'a';
  const hasUnsavedChanges = previewCombo !== savedCombo;

  const handleSaveTypography = async () => {
    setIsSaving(true);
    const updatedSettings: SiteSettings = {
      ...siteSettings,
      typography: previewCombo,
      updatedAt: new Date().toISOString(),
      updatedBy: DESIGNATED_EDITOR_EMAIL,
    };

    try {
      await onUpdateSiteSettings(updatedSettings);
      setSaveMessage(
        `Typography saved successfully! Combination ${previewCombo.toUpperCase()} is now active across the site.`
      );
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      setSaveMessage(`Failed to save typography: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Sample entry for content preview
  const sampleEntry = entries.find((e) => e.status === 'published') || entries[0];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Header & Controls bar */}
      <div className="p-6 border border-black/20 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-black/10 pb-4">
          <div>
            <div className="text-xs font-mono-quiet uppercase tracking-wider text-black/40">
              Site Typography Configuration
            </div>
            <h2 className="font-editorial text-2xl text-black">
              Body & Chinese Typeface Pairings
            </h2>
          </div>
          <div className="text-xs font-mono-quiet text-black/60">
            Active on public site:{' '}
            <span className="font-medium text-black uppercase">
              Combination {savedCombo} ({savedCombo === 'a' ? 'Newsreader Serif + Noto Sans SC' : 'Source Sans 3 Humanist Sans + Noto Sans SC'})
            </span>
          </div>
        </div>

        <p className="text-xs text-black/70 max-w-3xl leading-relaxed">
          Both combinations preserve <strong>Noto Sans SC</strong> for Chinese characters and the display serif (<strong>Newsreader</strong>) for major titles. Combination A renders body text in Newsreader serif prose; Combination C renders body text in soft humanist Source Sans 3. Toggle between A and C below to preview how your real site content looks before publishing the change.
        </p>

        {/* Candidate Selector & Save Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono-quiet text-black/50 uppercase text-[11px]">
              Candidate Preview:
            </span>
            <button
              onClick={() => setPreviewCombo('a')}
              className={`px-4 py-2 text-xs font-mono-quiet border transition-colors ${
                previewCombo === 'a'
                  ? 'bg-black text-white border-black font-medium'
                  : 'bg-white text-black/70 border-black/30 hover:border-black'
              }`}
            >
              Combination A · Serif (Newsreader + Noto Sans SC)
            </button>
            <button
              onClick={() => setPreviewCombo('c')}
              className={`px-4 py-2 text-xs font-mono-quiet border transition-colors ${
                previewCombo === 'c'
                  ? 'bg-black text-white border-black font-medium'
                  : 'bg-white text-black/70 border-black/30 hover:border-black'
              }`}
            >
              Combination C · Humanist Sans (Source Sans 3 + Noto Sans SC)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-xs font-mono-quiet text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200">
                Unsaved Preview
              </span>
            )}
            <button
              onClick={handleSaveTypography}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-5 py-2 text-xs font-mono-quiet transition-colors border ${
                hasUnsavedChanges
                  ? 'bg-black text-white border-black hover:bg-black/85 cursor-pointer shadow-sm'
                  : 'bg-black/5 text-black/30 border-black/10 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving…' : 'Save typography'}
            </button>
          </div>
        </div>

        {/* Save/Error Notice */}
        {saveMessage && (
          <div
            className={`p-3 text-xs font-mono-quiet border-l-2 ${
              saveMessage.includes('Failed')
                ? 'bg-red-50 text-red-800 border-red-600'
                : 'bg-emerald-50 text-emerald-900 border-emerald-600'
            }`}
          >
            {saveMessage}
            <span className="block text-[10px] text-black/50 pt-0.5">
              Storage target: GitHub publishing with local drafts
            </span>
          </div>
        )}
      </div>

      {/* Live Preview Box with Actual Site Content */}
      <div className="p-6 sm:p-8 border border-black/20 bg-white space-y-8">
        <div className="border-b border-black/10 pb-3 flex justify-between items-baseline font-mono-quiet text-xs text-black/50">
          <div>
            <span className="uppercase text-[11px] text-black/40">Live Content Preview:</span>{' '}
            <span className="font-medium text-black">
              Combination {previewCombo.toUpperCase()} — {previewCombo === 'a' ? 'English Serif Body' : 'Soft Humanist English Sans Body'}
            </span>
          </div>
          <div className="text-[11px]">
            {hasUnsavedChanges ? 'Showing unsaved candidate' : 'Matches current public site'}
          </div>
        </div>

        {/* Candidate Preview Container */}
        <div className={previewCombo === 'a' ? 'font-combo-a' : 'font-combo-c'}>
          {/* Section 1: Major Title & Subhead */}
          <div className="space-y-2 mb-8">
            <h1 className="font-editorial text-3xl sm:text-4xl text-black font-normal tracking-tight">
              About
            </h1>
            <p className="font-editorial text-2xl text-black/80 font-light">
              Hong Shu-ying <span className="font-normal text-black/90 whitespace-nowrap">方舒颖</span>
            </p>
          </div>

          {/* Section 2: Actual About Biography Prose (Comfortable 65ch width) */}
          <div className="max-w-[65ch] text-[15px] sm:text-base text-black/85 leading-[1.8] sm:leading-[1.85] space-y-4 mb-8">
            <p>
              Hong Shu-ying 方舒颖’s practice works across text, paper studies, transcription, instructional scores, and library interventions. Her work is situated within the daily rhythms of reading, handwriting, repetition, and the relational protocols of attention.
            </p>
            <p>
              Rather than presenting a closed catalogue of finished monuments, this site functions as an evolving index. Developing ideas, found images, and working notes are catalogued alongside completed works, allowing connections between conceptual terms (such as <em>copying</em> or <em>scores</em>) and collective projects (such as <em>述书 / SS: between books & libraries</em> and the <em>Part Time Book Club</em>) to remain visible and active.
            </p>
          </div>

          {/* Section 3: Chinese Glyphs & Mixed Titles Strip */}
          <div className="p-4 bg-black/[0.02] border border-black/10 space-y-3 mb-8">
            <div className="text-[11px] font-mono-quiet uppercase tracking-wider text-black/40">
              Glyph & Mixed Title Rendering:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-black/90">
              <div className="p-2.5 bg-white border border-black/5">
                <span className="text-[10px] font-mono-quiet text-black/40 block">Artist Name:</span>
                <span className="text-base">Hong Shu-ying 方舒颖</span>
              </div>
              <div className="p-2.5 bg-white border border-black/5">
                <span className="text-[10px] font-mono-quiet text-black/40 block">Project Title:</span>
                <span className="text-base">述书 / SS: between books & libraries</span>
              </div>
              <div className="p-2.5 bg-white border border-black/5">
                <span className="text-[10px] font-mono-quiet text-black/40 block">Work Title:</span>
                <span className="text-base">模仿要像：如歌</span>
              </div>
            </div>
          </div>

          {/* Section 4: Sample Entry Card Preview */}
          {sampleEntry && (
            <div className="border border-black/15 p-5 bg-white max-w-xl space-y-2">
              <div className="flex items-baseline justify-between text-xs font-mono-quiet text-black/50">
                <span className="uppercase">{sampleEntry.type} · {sampleEntry.date || 'ongoing'}</span>
                <span>[{sampleEntry.status}]</span>
              </div>
              <h3 className="font-editorial text-xl text-black">
                {sampleEntry.title}
                {sampleEntry.titleZh && <span className="ml-2 font-normal text-black/70">{sampleEntry.titleZh}</span>}
              </h3>
              <p className="text-sm text-black/75 leading-relaxed">
                {sampleEntry.shortDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
