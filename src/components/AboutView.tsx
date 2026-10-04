import React from 'react';
import { ViewMode } from '../types';

interface AboutViewProps {
  onNavigateView: (view: ViewMode) => void;
}

export const AboutView: React.FC<AboutViewProps> = () => {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-14 animate-fadeIn">
      <article className="space-y-12">
        {/* Page Title & Artist Name */}
        <header className="space-y-3 mb-10">
          <h1 className="font-editorial text-3xl sm:text-5xl text-black font-normal tracking-tight">
            About
          </h1>
          <p className="font-editorial text-2xl sm:text-3xl text-black/80 font-light leading-snug">
            Hong Shu-ying <span className="font-normal text-black/90 whitespace-nowrap">方舒颖</span>
          </p>
        </header>

        {/* Main Biography Prose — 60-70 characters wide reading column */}
        <section className="max-w-[65ch] text-[15px] sm:text-base text-black/85 leading-[1.8] sm:leading-[1.85] space-y-6">
          <p>
            Hong Shu-ying 方舒颖’s practice works across text, paper studies, transcription, instructional scores, and library interventions. Her work is situated within the daily rhythms of reading, handwriting, repetition, and the relational protocols of attention.
          </p>

          <p>
            Rather than presenting a closed catalogue of finished monuments, this site functions as an evolving index. Developing ideas, found images, and working notes are catalogued alongside completed works, allowing connections between conceptual terms (such as <em>copying</em> or <em>scores</em>) and collective projects (such as <em>述书 / SS: between books & libraries</em> and the <em>Part Time Book Club</em>) to remain visible and active.
          </p>
        </section>

        {/* Taxonomy & Navigation logic */}
        <section className="my-14 pt-10 border-t border-black/10 space-y-6 max-w-4xl">
          <h2 className="font-editorial text-2xl text-black font-normal">
            Structure of the Index
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[14px] leading-relaxed">
            <div className="space-y-1.5">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                Works & Studies
              </h3>
              <p className="text-black/70">
                Artwork installations, paper studies, transcriptions, and printed multiples. Developing studies are explicitly distinguished from finalized editions.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                述书 / SS
              </h3>
              <p className="text-black/70">
                A dedicated project framework engaging books, independent collections, librarians, and periodic reading groups.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                Terms & Methods
              </h3>
              <p className="text-black/70">
                Conceptual references and working methods—such as copying, scores, and transcription cadence—that cut across multiple projects.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-mono-quiet text-xs uppercase tracking-wider text-black">
                Backlinks & Cross-References
              </h3>
              <p className="text-black/70">
                Bi-directional connections show which entries cite or refer to one another, enabling wandering through the archive.
              </p>
            </div>
          </div>
        </section>

        {/* Practice Notes & Colophon */}
        <section className="my-14 pt-10 border-t border-black/10 space-y-6 max-w-[65ch]">
          <h2 className="font-editorial text-2xl text-black font-normal">
            Colophon & Site Notes
          </h2>
          <div className="space-y-4 text-[14px] text-black/75 leading-relaxed">
            <p>
              This website preserves the quiet, direct tone and black typography of{' '}
              <a
                href="https://hongshuying.art/Index.html"
                target="_blank"
                rel="noreferrer"
                className="text-black underline underline-offset-4 hover:text-black/70"
              >
                hongshuying.art
              </a>
              , with improved responsiveness across mobile screens and desktop reading environments.
            </p>
            <p className="text-xs font-mono-quiet text-black/60">
              *Sample entries are currently set up with explicit placeholders for dates, mediums, and documentation for review by Hong Shu-ying. No exhibitions, photographs, or completed artworks have been fabricated.*
            </p>
          </div>
        </section>

        {/* Contact (Public only, all editor links removed) */}
        <section className="my-14 pt-10 border-t border-black/10 text-sm">
          <div className="space-y-1">
            <div className="font-mono-quiet text-xs uppercase tracking-wider text-black/40">
              Contact
            </div>
            <div className="font-editorial text-lg text-black">
              <a href="mailto:work@anotherunit.xyz" className="hover:underline">
                work@anotherunit.xyz
              </a>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};
