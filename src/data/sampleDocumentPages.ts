import { DocumentPage } from '../types';

function createSvgPageUrl(
  title: string,
  pageNo: string,
  heading: string,
  bodyLines: string[],
  annotation?: string,
  isSpread = false
): string {
  const width = isSpread ? 1200 : 700;
  const height = 900;
  const cx = width / 2;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      .serif { font-family: 'Newsreader', Georgia, 'Songti SC', serif; }
      .mono { font-family: 'IBM Plex Mono', Menlo, Monaco, monospace; font-size: 11px; fill: #666666; letter-spacing: 0.05em; }
      .title { font-family: 'Newsreader', Georgia, 'Songti SC', serif; font-size: 26px; fill: #111111; font-weight: normal; }
      .heading { font-family: 'Newsreader', Georgia, 'Songti SC', serif; font-size: 19px; fill: #222222; font-style: italic; }
      .body { font-family: 'Source Sans 3', -apple-system, sans-serif; font-size: 14px; fill: #333333; line-height: 1.8; }
      .annotation { font-family: 'IBM Plex Mono', Menlo, monospace; font-size: 11px; fill: #888888; font-style: italic; }
    </style>
  </defs>

  <!-- Page Background with subtle paper tone -->
  <rect width="${width}" height="${height}" fill="#fcfbf9" stroke="#e5e3dd" stroke-width="1.5" />
  
  ${isSpread ? `<line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="#e0ded8" stroke-width="1" stroke-dasharray="4,4" />` : ''}

  <!-- Header Folio -->
  <text x="60" y="55" class="mono">${title.toUpperCase()}</text>
  <text x="${width - 60}" y="55" text-anchor="end" class="mono">${pageNo}</text>
  <line x1="60" y1="70" x2="${width - 60}" y2="70" stroke="#eeeeee" stroke-width="1" />

  <!-- Main Content -->
  <text x="60" y="130" class="title">${heading}</text>
  
  ${bodyLines
    .map((line, idx) => `<text x="60" y="${180 + idx * 32}" class="body">${line}</text>`)
    .join('')}

  ${annotation ? `
  <rect x="60" y="${height - 130}" width="${width - 120}" height="45" fill="#f5f3ee" stroke="#e8e6df" />
  <text x="75" y="${height - 102}" class="annotation">${annotation}</text>
  ` : ''}

  <!-- Footer Folio -->
  <line x1="60" y1="${height - 60}" x2="${width - 60}" y2="${height - 60}" stroke="#eeeeee" stroke-width="1" />
  <text x="${cx}" y="${height - 35}" text-anchor="middle" class="mono">— ${pageNo} —</text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 6 sequential pages for image-based zine (individual pages)
export const SAMPLE_ZINE_PAGES: DocumentPage[] = [
  {
    id: 'zine-p1',
    pageNumber: 1,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'Cover / p. 1',
      '兼职读书会 第一期：阅读室听记',
      [
        'PART TIME BOOK CLUB — ISSUE NO. 1',
        'Reading Room Transcripts & Working Notations',
        'Published in an edition of 120 copies, risograph printed on 80gsm book paper.',
        'Compiled by Hong Shu-ying 方舒颖 in dialogue with reading group participants.',
        'Convened between 2022 and 2024 across three independent library spaces.',
      ],
      'Folio note: Cover printed with black soy ink on unbleached warm white stock.'
    ),
    caption: 'Cover: Part Time Book Club Issue 01, risograph printed on warm book paper.',
  },
  {
    id: 'zine-p2',
    pageNumber: 2,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'p. 2',
      'Colophon & Reader Protocols',
      [
        '1. Reading is treated as an involuntary physical practice, not an intellectual tournament.',
        '2. Participants read silently together for forty-five minutes before any voice is spoken.',
        '3. Every reader holds a soft graphite pencil; involuntary underlinings are transcribed.',
        '4. Pages copied during the session enter the circulating archive of 述书 / SS.',
      ],
      'Protocol registered on 14 October 2022 at the Sub-library Reading Room.'
    ),
    caption: 'Page 2: Reading protocols and collective quietude constraints.',
  },
  {
    id: 'zine-p3',
    pageNumber: 3,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'p. 3',
      'Transcript: The Wrist as Timekeeper',
      [
        '“The copyist does not summarize; she endures the length of every sentence.”',
        'In copying an existing book by hand, the eye is forced to travel at the speed of the wrist.',
        'Speed is reduced from four hundred words per minute to twenty-two.',
        'What was once transparent prose turns opaque: commas become physical breathing gates.',
      ],
      'Transcribed by H.S. from participant recording tape 03-A.'
    ),
    caption: 'Page 3: Transcript excerpt on handwriting duration versus reading velocity.',
  },
  {
    id: 'zine-p4',
    pageNumber: 4,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'p. 4',
      'Score for Three Minutes of Shared Silence',
      [
        '[ 0:00 ] Two readers sit across from each other with open volumes.',
        '[ 0:45 ] Neither reader looks directly at the other; eyes wander across lines.',
        '[ 1:30 ] Turn one page simultaneously when the clock second hand reaches 12.',
        '[ 2:15 ] Listen to paper friction and page rustle across the timber desk.',
        '[ 3:00 ] Close volumes gently in unison without speaking.',
      ],
      'Instruction score performed during session 04.'
    ),
    caption: 'Page 4: Instructional score for two concurrent readers sharing silence.',
  },
  {
    id: 'zine-p5',
    pageNumber: 5,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'p. 5',
      'Marginalia & Reader Stamps',
      [
        'Marginal inscriptions recorded during November meeting:',
        '“This sentence has been read by three previous people; each left an indent in the margin.”',
        '“A book left unread in a library decays differently than one handled daily.”',
        'Library collection stamp: 述书 / SS Archive — Specimen 014.',
      ],
      'Reader marginalia transcript verified against original library specimens.'
    ),
    caption: 'Page 5: Transcribed reader marginalia and library seal impressions.',
  },
  {
    id: 'zine-p6',
    pageNumber: 6,
    url: createSvgPageUrl(
      'Part Time Book Club · Issue 01',
      'Back Cover / p. 6',
      'Colophon & Next Session Announcement',
      [
        'Part Time Book Club is an initiative of 述书 / SS: between books & libraries.',
        'Printed in Singapore & Shanghai on risograph machines.',
        'Next session: "Scores for Library Relocation" — Date announced through private index.',
        'Contact & correspondence: work@anotherunit.xyz',
      ],
      'End of Issue 01 · Distributed by hand to participants.'
    ),
    caption: 'Back Cover: Colophon, publication credits, and next session notes.',
  },
];

// 4 pre-composed spreads for facsimile inscriptions volume (already-composed spreads)
export const SAMPLE_BOOK_SPREADS: DocumentPage[] = [
  {
    id: 'spread-1',
    pageNumber: 1,
    url: createSvgPageUrl(
      '述书: Facsimile of Library Inscriptions · Pre-composed Spread 01',
      'pp. 2–3 (Spread 1)',
      'Opening Spread: Table of Inscriptions & Archive Index',
      [
        '[Left Page: pp. 2] Register of Independent Library Inscriptions (1998–2023)',
        'Survey of hand-written dedications, shelf signatures, and reader annotations.',
        'Photographed in ambient daylight at 1:1 scale to preserve ink discoloration.',
        '—',
        '[Right Page: pp. 3] Methodological Criteria for Facsimile Reproduction',
        'All spreads reproduced intact without gutter trimming or white-balance correction.',
        'Paper wrinkles, insect perforations, and library binder stitches remain visible.',
      ],
      'Spread 01 of 04 · Preserving full 2-page horizontal gutter intact.',
      true
    ),
    caption: 'Spread 01 (pp. 2–3): Table of Inscriptions and facsimile reproduction criteria.',
  },
  {
    id: 'spread-2',
    pageNumber: 2,
    url: createSvgPageUrl(
      '述书: Facsimile of Library Inscriptions · Pre-composed Spread 02',
      'pp. 4–5 (Spread 2)',
      'Spread 02: Inscribed Folio 14 & Parallel Transcription',
      [
        '[Left Page: pp. 4] Facsimile Plate XIV — "To those who read while standing"',
        'Blue ballpoint ink on aged newsprint edition, provenance: Workers\' Reading Room.',
        'Note reads: "Borrowed on rainy afternoon, returned after third reading."',
        '—',
        '[Right Page: pp. 5] Editorial Commentary & Typography Transcription',
        'Typeset in Newsreader serif body to mirror the cadence of the cursive inscription.',
        'Ink depletion occurs on the fourth line where the pen ran dry mid-sentence.',
      ],
      'Spread 02 of 04 · Natural paper fold and gutter shadows preserved.',
      true
    ),
    caption: 'Spread 02 (pp. 4–5): Inscribed Folio 14 facsimile with facing analytical transcript.',
  },
  {
    id: 'spread-3',
    pageNumber: 3,
    url: createSvgPageUrl(
      '述书: Facsimile of Library Inscriptions · Pre-composed Spread 03',
      'pp. 6–7 (Spread 3)',
      'Spread 03: Reader Notation Map & Marginal Concordance',
      [
        '[Left Page: pp. 6] Facsimile Plate XXVIII — Multiple Hands in One Margin',
        'Four distinct handwritings responding to one another across twelve years.',
        'First inscription in pencil (1992); second inscription in fountain pen (2001).',
        '—',
        '[Right Page: pp. 7] Chronological Stratigraphy of the Inscriptions',
        'The margin ceases to be blank border; it becomes a conversational ledger.',
        'Demonstrates how independent libraries function as social memory vessels.',
      ],
      'Spread 03 of 04 · Inscriptions recorded across four reader generations.',
      true
    ),
    caption: 'Spread 03 (pp. 6–7): Reader notation map tracking four distinct hands in the margin.',
  },
  {
    id: 'spread-4',
    pageNumber: 4,
    url: createSvgPageUrl(
      '述书: Facsimile of Library Inscriptions · Pre-composed Spread 04',
      'pp. 8–9 (Spread 4)',
      'Spread 04: Library Stamp Registry & Colophon',
      [
        '[Left Page: pp. 8] Catalog of Archival Rubber Stamps & Deaccession Marks',
        'Red cinnabar paste stamps, purple aniline deaccession markings, and classification codes.',
        'Each mark represents an institutional crossing point from public collection to discard.',
        '—',
        '[Right Page: pp. 9] Printer\'s Colophon & Edition Record',
        'Bound in exposed thread binding with untrimmed fore-edges.',
        'Published as part of 述书 / SS: between books & libraries · Hong Shu-ying 方舒颖.',
      ],
      'Spread 04 of 04 · Final colophon spread with library provenance register.',
      true
    ),
    caption: 'Spread 04 (pp. 8–9): Library stamp registry and printer\'s colophon.',
  },
];
