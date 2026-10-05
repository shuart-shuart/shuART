import { DEFAULT_ABOUT, DEFAULT_FOOTER, DEFAULT_INDEX } from '../../data/siteContent';
import { EditorSiteContentSection } from './EditorSiteContentSection';
import { footerLinkHref } from '../Footer';
import React, { useState, useEffect } from 'react';
import { SiteSettings, TypographyCombo, NavItemConfig, Entry } from '../../types';
import { DESIGNATED_EDITOR_EMAIL } from '../../services/mediaUploads';

interface EditorSettingsSectionProps {
  siteSettings: SiteSettings;
  entries: Entry[];
  onUpdateSiteSettings: (settings: SiteSettings) => Promise<void> | void;
}

export const EditorSettingsSection: React.FC<EditorSettingsSectionProps> = ({
  siteSettings,
  entries,
  onUpdateSiteSettings,
}) => {
  const [typography, setTypography] = useState<TypographyCombo>(siteSettings.typography || 'a');
  const [showWander, setShowWander] = useState<boolean>(siteSettings.showWander ?? true);
  const [showAbout, setShowAbout] = useState<boolean>(() => {
    const aboutItem = siteSettings.navOrder?.find((n) => n.id === 'about');
    return aboutItem ? aboutItem.visible : true;
  });

  const [index, setIndex] = useState(() => siteSettings.index ?? DEFAULT_INDEX);
  const [about, setAbout] = useState(() => siteSettings.about ?? DEFAULT_ABOUT);
  const [footer, setFooter] = useState(() => siteSettings.footer ?? DEFAULT_FOOTER);

  useEffect(() => {
    setIndex(siteSettings.index ?? DEFAULT_INDEX);
    setAbout(siteSettings.about ?? DEFAULT_ABOUT);
    setFooter(siteSettings.footer ?? DEFAULT_FOOTER);
    setTypography(siteSettings.typography || 'a');
    setShowWander(siteSettings.showWander ?? true);
    setShowAbout(siteSettings.navOrder?.find(item => item.id === 'about')?.visible ?? true);
  }, [siteSettings]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sampleEntry = entries.find((e) => e.status === 'published') || entries[0];

  const handleSaveAllSettings = async () => {
    const invalidLink = footer.links.find(link => link.url.trim() && !footerLinkHref(link.url));
    if (invalidLink) {
      setSaveMessage(`Please enter a valid destination for footer link “${invalidLink.label || 'Untitled'}”.`);
      return;
    }
    setIsSaving(true);

    const updatedNavOrder: NavItemConfig[] = [
      { id: 'index', label: 'Index', view: 'index', visible: true },
      { id: 'about', label: 'About', view: 'about', visible: showAbout },
      { id: 'wander', label: 'Wander', view: 'wander', visible: showWander },
    ];

    const updated: SiteSettings = {
      ...siteSettings,
      index,
      about,
      footer,
      showWander,
      typography,
      navOrder: updatedNavOrder,
      updatedAt: new Date().toISOString(),
      updatedBy: DESIGNATED_EDITOR_EMAIL,
    };

    try {
      await onUpdateSiteSettings(updated);
      setSaveMessage('Draft saved. Click Publish to GitHub in the editor header to make these changes public.');
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      setSaveMessage(`Error saving settings: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn font-sans max-w-4xl">
      {saveMessage && (
        <div className="p-3 bg-black text-white text-xs font-mono-quiet flex justify-between items-center">
          <span>{saveMessage}</span>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-white/60 hover:text-white ml-4 text-[11px]"
          >
            [Close ×]
          </button>
        </div>
      )}

      {/* Settings Header */}
      <div className="border-b border-black/10 pb-4 flex justify-between items-baseline">
        <div>
          <h2 className="font-editorial text-2xl text-black">
            Site Settings & Editorial Configuration
          </h2>
          <p className="text-xs text-black/60 font-mono-quiet">
            Manage About content, footer links, navigation, and typography.
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 transition-colors disabled:opacity-50 shrink-0"
        >
          {isSaving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      <p className="text-xs text-black/60">Save these settings to your draft, then use Publish to GitHub in the editor header.</p>
      <EditorSiteContentSection index={index} onIndexChange={setIndex} about={about} footer={footer} entries={entries} onAboutChange={setAbout} onFooterChange={setFooter} />

      {/* 1. Public Navigation Visibility */}
      <section className="p-6 border border-black/15 bg-white space-y-4">
        <div>
          <h3 className="font-editorial text-lg text-black font-medium">
            1. Public Navigation Items
          </h3>
          <p className="text-xs text-black/60 font-mono-quiet">
            Controls which quiet text links appear beside Hong Shu-ying 方舒颖 in public site header.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Index (Fixed) */}
          <div className="flex items-center justify-between p-3 border border-black/10 bg-black/[0.015]">
            <div>
              <div className="text-sm font-medium text-black">Index</div>
              <div className="text-xs text-black/50 font-mono-quiet">
                Main archive browsing page with type filters & search. The artist name also links here.
              </div>
            </div>
            <span className="text-xs font-mono-quiet text-black/40 italic">
              Always visible (Core home)
            </span>
          </div>

          {/* About */}
          <label className="flex items-center justify-between p-3 border border-black/10 hover:bg-black/[0.01] cursor-pointer">
            <div>
              <div className="text-sm font-medium text-black">About</div>
              <div className="text-xs text-black/50 font-mono-quiet">
                Artist bio, background, research inquiry, and contact links.
              </div>
            </div>
            <input
              type="checkbox"
              checked={showAbout}
              onChange={(e) => setShowAbout(e.target.checked)}
              className="rounded-none border-black/30 text-black focus:ring-0"
            />
          </label>

          {/* Wander */}
          <label className="flex items-center justify-between p-3 border border-black/10 hover:bg-black/[0.01] cursor-pointer">
            <div>
              <div className="text-sm font-medium text-black">Wander (Optional)</div>
              <div className="text-xs text-black/50 font-mono-quiet">
                Quiet exploration link that opens a random published archive entry.
              </div>
            </div>
            <input
              type="checkbox"
              checked={showWander}
              onChange={(e) => setShowWander(e.target.checked)}
              className="rounded-none border-black/30 text-black focus:ring-0"
            />
          </label>
        </div>
      </section>

      {/* 2. Typography Selection */}
      <section className="p-6 border border-black/15 bg-white space-y-6">
        <div>
          <h3 className="font-editorial text-lg text-black font-medium">
            2. Typography System (A / C)
          </h3>
          <p className="text-xs text-black/60 font-mono-quiet">
            Select the global typographic voice for titles, lead text, and reading rhythms across the site.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Combo A */}
          <div
            onClick={() => setTypography('a')}
            className={`p-5 border cursor-pointer transition-all ${
              typography === 'a'
                ? 'border-black bg-black/[0.02] ring-1 ring-black'
                : 'border-black/20 hover:border-black/60'
            }`}
          >
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-editorial text-lg text-black font-medium">
                Combination A (Serif Archive)
              </span>
              {typography === 'a' && (
                <span className="text-xs font-mono-quiet text-black font-semibold">Active ✓</span>
              )}
            </div>
            <p className="text-xs text-black/60 font-sans leading-relaxed mb-4">
              Editorial serif headings paired with clean, quiet sans body and subdued mono metadata. Emphasizes bookish contemplation, transcription, and library stillness.
            </p>
            <div className="p-3 bg-white border border-black/10 font-combo-a space-y-1 text-left">
              <div className="font-editorial text-lg text-black">Instructional Scores</div>
              <div className="text-xs text-black/70 font-sans">
                Silent reading protocols enacted across public libraries.
              </div>
              <div className="text-[10px] font-mono-quiet text-black/40">2023 · PUBLICATION · REF 04</div>
            </div>
          </div>

          {/* Combo C */}
          <div
            onClick={() => setTypography('c')}
            className={`p-5 border cursor-pointer transition-all ${
              typography === 'c'
                ? 'border-black bg-black/[0.02] ring-1 ring-black'
                : 'border-black/20 hover:border-black/60'
            }`}
          >
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-editorial text-lg text-black font-medium">
                Combination C (Structural Modern)
              </span>
              {typography === 'c' && (
                <span className="text-xs font-mono-quiet text-black font-semibold">Active ✓</span>
              )}
            </div>
            <p className="text-xs text-black/60 font-sans leading-relaxed mb-4">
              Refined editorial serif titles with heightened typographic contrast and geometric mono rhythms. Suitable for architectural scores and line notations.
            </p>
            <div className="p-3 bg-white border border-black/10 font-combo-c space-y-1 text-left">
              <div className="font-editorial text-lg text-black">Instructional Scores</div>
              <div className="text-xs text-black/70 font-sans">
                Silent reading protocols enacted across public libraries.
              </div>
              <div className="text-[10px] font-mono-quiet text-black/40">2023 · PUBLICATION · REF 04</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Wander Visibility & Route Protection */}
      <section className="p-6 border border-black/15 bg-white space-y-4">
        <div>
          <h3 className="font-editorial text-lg text-black font-medium">
            3. Wander Exploration Setting
          </h3>
          <p className="text-xs text-black/60 font-mono-quiet">
            Controls the visibility of the Wander text link and direct access to #wander.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 border border-black/10 bg-black/[0.015]">
          <input
            type="checkbox"
            id="toggleWanderMain"
            checked={showWander}
            onChange={(e) => setShowWander(e.target.checked)}
            className="rounded-none border-black/30 text-black focus:ring-0 mt-0.5"
          />
          <label htmlFor="toggleWanderMain" className="text-xs font-sans text-black/85 cursor-pointer leading-relaxed">
            <strong>Enable Wander for public visitors</strong>
            <p className="text-black/60 font-mono-quiet text-[11px] pt-1">
              When checked, the quiet "Wander" link appears in the public header and footer. Clicking it randomly jumps to a published archive entry. When unchecked, the link is completely hidden and direct public access to #wander is blocked.
            </p>
          </label>
        </div>
      </section>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="px-6 py-2.5 bg-black text-white text-xs font-mono-quiet hover:bg-black/85 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving Changes…' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};
