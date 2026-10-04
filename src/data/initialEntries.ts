import { Entry } from '../types';
import { SAMPLE_ZINE_PAGES, SAMPLE_BOOK_SPREADS } from './sampleDocumentPages';

export const INITIAL_ENTRIES: Entry[] = [
  {
    "id": "instructional-scores-pdf",
    "slug": "instructional-scores-pdf",
    "title": "Instructional Scores for Reading Rooms (Score Sheet No. 4)",
    "titleZh": "阅览室指令乐谱（第4号乐谱）",
    "type": "publication",
    "status": "published",
    "date": "2023",
    "datePlaceholder": false,
    "medium": "Printed facsimile booklet, A4, 16 pages, thread sewn",
    "dimensions": "21 × 29.7 cm",
    "shortDescription": "A multi-page instructional score and performance facsimile for silent reading rooms, published in edition with selectable text and downloadable PDF.",
    "fullText": "A published multi-page score containing typographic choreographies, silent reading rules, and transcription constraints for public libraries.\n    \nDesigned to be opened upon communal library desks. Readers follow pacing notations, intervals of quiet turning, and ink depletion markings.",
    "subjects": [
      "score",
      "pdf",
      "document reader",
      "reading",
      "libraries",
      "transcription"
    ],
    "relatedEntryIds": [
      "scores",
      "ss-between-books-and-libraries",
      "part-time-book-club-zine"
    ],
    "collections": [
      "ss",
      "works"
    ],
    "images": [],
    "isDevelopingWork": false,
    "notesForArtist": "Multi-page PDF test entry. Features progressive rendering, page zoom, text selection, and direct PDF download.",
    "blocks": [
      {
        "id": "block-pdf-text-intro",
        "type": "text",
        "content": "“Instructional Scores for Reading Rooms (Score Sheet No. 4)” compiles sixteen instructional protocols enacted across public reading rooms.\n        \nRather than conventional musical notation, the score uses typographic line lengths, caesura gaps, and margins to pace the reader's breath and page turnover.\n\nUse the embedded PDF reader below to page through the facsimile with selectable text, zoom into fine typographic details, or download the original PDF file."
      },
      {
        "id": "block-pdf-reader",
        "type": "document_reader",
        "title": "Instructional Scores for Reading Rooms (Score Sheet No. 4) — PDF Facsimile",
        "sourceType": "pdf",
        "pdfUrl": "/instructional-scores-reading-rooms-no4.pdf",
        "pdfFileName": "instructional-scores-reading-rooms-no4.pdf",
        "pdfFileSize": "993 KB",
        "originalFileUrl": "/instructional-scores-reading-rooms-no4.pdf",
        "originalFileName": "instructional-scores-reading-rooms-no4.pdf",
        "allowDownload": true,
        "description": "Archival PDF facsimile (14 pages). Typeset score sheet with selectable text, paired spread views, zoom, and progress indicator."
      },
      {
        "id": "block-pdf-text-colophon",
        "type": "text",
        "content": "Performance parameters:\n- To be read in silent public libraries without audio amplification.\n- Readers may enact Score No. 4 individually or in pairs across facing tables.\n- Consult related publication [[part-time-book-club-zine]] and research project [[ss-between-books-and-libraries]]."
      }
    ],
    "createdAt": "2026-02-12T09:00:00Z",
    "updatedAt": "2026-03-10T14:00:00Z",
    "tagIds": [
      "tag-score",
      "tag-pdf",
      "tag-document-reader",
      "tag-reading",
      "tag-libraries",
      "tag-transcription"
    ],
    "associatedProjectIds": [
      "ss-between-books-and-libraries"
    ]
  },
  {
    "id": "part-time-book-club-zine",
    "slug": "part-time-book-club-zine",
    "title": "Part Time Book Club: Issue 01 (Reading Transcript Zine)",
    "titleZh": "兼职读书会 第一期：阅读室听记",
    "type": "publication",
    "status": "published",
    "date": "2022",
    "datePlaceholder": false,
    "medium": "Risograph printed zine, black soy ink on 80gsm book paper, 6 pages",
    "dimensions": "14.8 × 21 cm (A5)",
    "shortDescription": "A 6-page transcribed reading transcript zine documenting the first collective reading session of the Part Time Book Club, presented with single and paired-spread viewing.",
    "fullText": "Issue 01 of the Part Time Book Club zine collects transcriptions, reading protocols, and reader marginalia from the October 2022 reading session in Shanghai.",
    "subjects": [
      "zine",
      "reading",
      "transcription",
      "publishing",
      "ss",
      "document reader"
    ],
    "relatedEntryIds": [
      "part-time-book-club",
      "ss-between-books-and-libraries",
      "facsimile-inscriptions-spreads"
    ],
    "collections": [
      "ss"
    ],
    "images": [],
    "isDevelopingWork": false,
    "ssCategory": "book",
    "notesForArtist": "Image-based zine test entry. Features single-page and paired-page (spread) viewing, thumbnails strip, zoom, and fullscreen.",
    "blocks": [
      {
        "id": "block-zine-text-1",
        "type": "text",
        "content": "The Part Time Book Club zine is printed in small batches on risograph duplicators and distributed directly to session attendees.\n        \nIssue 01 establishes the foundational methodology of [[part-time-book-club]]: reading silently together, slowing transcription speed to match the hand, and sharing an unpressured collective environment.\n\nBelow is the complete 6-page document reader. On desktop, you can switch between **Single Page** and **Paired Page (Spread)** viewing; on mobile devices, it automatically defaults to a clean single-page presentation."
      },
      {
        "id": "block-zine-reader",
        "type": "document_reader",
        "title": "Part Time Book Club: Issue 01 — Full Zine Reader",
        "sourceType": "page_images",
        "pageType": "individual_pages",
        "pages": SAMPLE_ZINE_PAGES,
        "originalFileUrl": "https://hongshuying.art/downloads/ptbc-issue-01-complete.pdf",
        "originalFileName": "ptbc-issue-01-complete.pdf",
        "allowDownload": true,
        "description": "Complete 6-page sequence. Toggle between Single and Spread views; expand thumbnails along the bottom to jump between folios."
      },
      {
        "id": "block-zine-text-2",
        "type": "text",
        "content": "Colophon:\n- Risograph printed in Singapore in an edition of 120 numbered copies.\n- Typeset in Newsreader and IBM Plex Mono.\n- Bound with single saddle stitch. Copies catalogued in [[ss-between-books-and-libraries]]."
      }
    ],
    "createdAt": "2026-02-14T10:00:00Z",
    "updatedAt": "2026-03-10T15:00:00Z",
    "tagIds": [
      "tag-zine",
      "tag-reading",
      "tag-transcription",
      "tag-publishing",
      "tag-ss",
      "tag-document-reader"
    ],
    "associatedProjectIds": [
      "ss-between-books-and-libraries",
      "part-time-book-club"
    ]
  },
  {
    "id": "facsimile-inscriptions-spreads",
    "slug": "facsimile-inscriptions-spreads",
    "title": "述书: Facsimile of Library Inscriptions (Pre-composed Spreads)",
    "titleZh": "述书：图书馆题记影印（整版跨页）",
    "type": "publication",
    "status": "published",
    "date": "2023–ongoing",
    "datePlaceholder": false,
    "medium": "Exposed thread binding, archival offset reproduction on warm matte paper",
    "dimensions": "28 × 21 cm (open spread 56 × 21 cm)",
    "shortDescription": "A volume of archival book spread scans documenting marginal inscriptions across independent libraries, presented in their original pre-composed two-page spreads without gutter cropping.",
    "fullText": "Archival facsimile volume containing two-page spread plates of annotated volumes and reader inscriptions.",
    "subjects": [
      "book spreads",
      "facsimile",
      "inscriptions",
      "libraries",
      "ss",
      "archiving"
    ],
    "relatedEntryIds": [
      "ss-between-books-and-libraries",
      "copying",
      "part-time-book-club-zine"
    ],
    "collections": [
      "ss"
    ],
    "images": [],
    "isDevelopingWork": false,
    "ssCategory": "book",
    "notesForArtist": "Pre-composed spreads test entry. Each spread is displayed intact without splitting or gutter distortions, preserving original proportions.",
    "blocks": [
      {
        "id": "block-spreads-text-intro",
        "type": "text",
        "content": "When documenting bound volumes, splitting facing pages into isolated vertical slices damages the spatial relationship between marginal notes and facing texts.\n        \nIn this volume, each scan represents an **already-composed two-page spread** (open folio). The document reader displays each spread intact, allowing you to pan, zoom, and inspect marginal inscriptions across the central gutter."
      },
      {
        "id": "block-spreads-reader",
        "type": "document_reader",
        "title": "述书: Facsimile of Library Inscriptions — Pre-composed Spreads Viewer",
        "sourceType": "page_images",
        "pageType": "already_composed_spreads",
        "pages": SAMPLE_BOOK_SPREADS,
        "originalFileUrl": "https://hongshuying.art/downloads/ss-inscriptions-spreads-facsimile.pdf",
        "originalFileName": "ss-inscriptions-spreads-facsimile.pdf",
        "allowDownload": true,
        "description": "Four pre-composed archival spreads (pp. 2–9). Proportions are strictly preserved to maintain legibility of handwritten annotations."
      },
      {
        "id": "block-spreads-text-notes",
        "type": "text",
        "content": "Surveyed repositories:\n- Workers' Reading Room archival collection (Shanghai)\n- Independent Art Book Archive (Singapore)\n- Private donated library of Liu Z. (Suzhou)\n- Recorded under the research framework of [[ss-between-books-and-libraries]]."
      }
    ],
    "createdAt": "2026-02-18T14:00:00Z",
    "updatedAt": "2026-03-10T16:00:00Z",
    "tagIds": [
      "tag-book-spreads",
      "tag-facsimile",
      "tag-inscriptions",
      "tag-libraries",
      "tag-ss",
      "tag-archiving"
    ],
    "associatedProjectIds": [
      "ss-between-books-and-libraries"
    ]
  },
  {
    "id": "transcription-cadence-video-studies",
    "slug": "transcription-cadence-video-studies",
    "title": "Transcription Cadence & Reading Protocols: Video Studies",
    "titleZh": "抄写节奏与阅读礼仪：影像研究",
    "type": "work",
    "status": "published",
    "date": "2023",
    "datePlaceholder": false,
    "medium": "Three-channel digital video suite, sound, color",
    "dimensions": "Duration variable (16:9)",
    "shortDescription": "A three-part moving image suite examining handwriting duration, library navigation, and transcription rhythm across YouTube, Vimeo, and Google Drive video providers.",
    "fullText": "Three video studies investigating transcription cadence, the tempo of ink depletion, and quiet movements within independent library reading spaces.",
    "subjects": [
      "video",
      "cadence",
      "transcription",
      "handwriting",
      "vimeo",
      "youtube",
      "google drive"
    ],
    "relatedEntryIds": [
      "script-notes",
      "mofang-yaoxiang-ruge",
      "scores"
    ],
    "collections": [
      "works"
    ],
    "images": [],
    "isDevelopingWork": false,
    "notesForArtist": "Three video providers test entry. Demonstrates YouTube, Vimeo, and Google Drive responsive embeds without autoplay, with credits and fallback links.",
    "blocks": [
      {
        "id": "block-video-text-intro",
        "type": "text",
        "content": "This entry tests and demonstrates the three supported embedded video providers: **YouTube**, **Vimeo**, and **Google Drive**.\n        \nEach video is displayed in a responsive 16:9 container with zero autoplay, fallback external links, and optional captions and credits. For Google Drive files, clear guidance is provided regarding permissions."
      },
      {
        "id": "block-video-youtube",
        "type": "video",
        "provider": "youtube",
        "originalUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "embedUrl": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&modestbranding=1",
        "title": "Video Study 1: The Continuous Stroke (YouTube Embed)",
        "caption": "Uninterrupted documentation of ink flowing from brush to Xuan paper during transcription practice.",
        "credit": "Camera & sound: Studio recording, 2023."
      },
      {
        "id": "block-video-vimeo",
        "type": "video",
        "provider": "vimeo",
        "originalUrl": "https://vimeo.com/76979871",
        "embedUrl": "https://player.vimeo.com/video/76979871?autoplay=0&dnt=1",
        "title": "Video Study 2: Silent Shelving Cadence (Vimeo Embed)",
        "caption": "Observing the spatial rhythm of placing catalogued books back into high wooden shelves in an independent archive.",
        "credit": "Filmed on location at the Sub-library Reading Room."
      },
      {
        "id": "block-video-drive",
        "type": "video",
        "provider": "google_drive",
        "originalUrl": "https://drive.google.com/file/d/1u3s8_f3K7Y-example_test_file_id/view?usp=sharing",
        "embedUrl": "https://drive.google.com/file/d/1u3s8_f3K7Y-example_test_file_id/preview",
        "title": "Video Study 3: Archival Rehearsal Monitor (Google Drive Embed)",
        "caption": "Overhead studio camera recording reading pacing rehearsals and participant gestures.",
        "credit": "Studio master tape record."
      },
      {
        "id": "block-video-text-conclusion",
        "type": "text",
        "content": "All videos respect user bandwidth and browser autoplay policies.\n        \nLinks dialogue directly with [[script-notes]], [[mofang-yaoxiang-ruge]], and the scores documented in [[scores]]."
      }
    ],
    "createdAt": "2026-02-20T11:00:00Z",
    "updatedAt": "2026-03-10T17:00:00Z",
    "tagIds": [
      "tag-transcription",
      "tag-video",
      "tag-cadence",
      "tag-handwriting",
      "tag-vimeo",
      "tag-youtube",
      "tag-google-drive"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "script-notes",
    "slug": "script-notes",
    "title": "笔迹 script/notes",
    "titleZh": "笔迹",
    "type": "note",
    "status": "published",
    "date": "c. 2022–present [placeholder]",
    "datePlaceholder": true,
    "medium": "Ink and pencil on loose paper, working notebooks [placeholder]",
    "dimensions": "Variable [placeholder]",
    "shortDescription": "Working fragments, notations, and studies on handwriting, stroke gestures, and the physical tempo of writing.",
    "fullText": "A continuing series of working notes, marginalia, and transcribed fragments examining the hand as a recording device.\n\nLooking at how [[copying]] transforms involuntary motor habit into conscious gesture. Rather than preparing for a singular completed object, these pages register transcription rhythm, line pauses, and the ink's gradual depletion.\n\n*Note for artist review: Dimensions, precise dates, and exhibition history are left open as placeholders until verified.*",
    "subjects": [
      "handwriting",
      "transcription",
      "paper",
      "script",
      "working notes"
    ],
    "relatedEntryIds": [
      "copying",
      "scores",
      "parallel-on-paper"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-sn-1",
        "type": "text",
        "content": "A continuing series of working notes, marginalia, and transcribed fragments examining the hand as a recording device.\n\nLooking at how [[copying]] transforms involuntary motor habit into conscious gesture. Rather than preparing for a singular completed object, these pages register transcription rhythm, line pauses, and the ink's gradual depletion.\n\n*Note for artist review: Dimensions, precise dates, and exhibition history are left open as placeholders until verified.*"
      }
    ],
    "isDevelopingWork": true,
    "notesForArtist": "Placeholder entry. Review dates, medium description, and attach high-resolution scans when available.",
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-handwriting",
      "tag-paper",
      "tag-script",
      "tag-transcription",
      "tag-working-notes"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "thank-you-for-your-time",
    "slug": "thank-you-for-your-time",
    "title": "thank you for your time",
    "titleZh": "",
    "type": "work",
    "status": "published",
    "date": "[placeholder date for review]",
    "datePlaceholder": true,
    "medium": "[placeholder for artist review]",
    "dimensions": "[placeholder for artist review]",
    "shortDescription": "A work considering spent attention, conversational formula, and the temporal transactions of social exchange.",
    "fullText": "Taking the ubiquitous closing phrase of institutional correspondence and daily courtesy—\"thank you for your time\"—as both subject and boundary.\n\nInvestigates duration, interpersonal indebtedness, and the formal protocols of polite departure. Closely dialogues with [[scores]] and structured encounters.\n\n*Placeholder entry: Specific medium, installation form, and documentation to be confirmed by Hong Shu-ying.*",
    "subjects": [
      "duration",
      "time",
      "language",
      "courtesy",
      "scores"
    ],
    "relatedEntryIds": [
      "scores",
      "copying"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-ty-1",
        "type": "text",
        "content": "Taking the ubiquitous closing phrase of institutional correspondence and daily courtesy—\"thank you for your time\"—as both subject and boundary.\n\nInvestigates duration, interpersonal indebtedness, and the formal protocols of polite departure. Closely dialogues with [[scores]] and structured encounters.\n\n*Placeholder entry: Specific medium, installation form, and documentation to be confirmed by Hong Shu-ying.*"
      }
    ],
    "isDevelopingWork": false,
    "notesForArtist": "Review entry details: clarify if performance, printed text, video, or participatory work.",
    "createdAt": "2026-01-15T11:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-duration",
      "tag-language",
      "tag-courtesy",
      "tag-time",
      "tag-score"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "mofang-yaoxiang-ruge",
    "slug": "mofang-yaoxiang-ruge",
    "title": "模仿要像：如歌",
    "titleZh": "模仿要像：如歌",
    "type": "work",
    "status": "published",
    "date": "[placeholder date for review]",
    "datePlaceholder": true,
    "medium": "[placeholder for artist review]",
    "dimensions": "[placeholder for artist review]",
    "shortDescription": "An inquiry into pedagogical repetition, musical cadence (cantabile), and the fidelity demanded by imitation.",
    "fullText": "Exploring the pedagogical mandate \"模仿要像\" (to imitate faithfully / to look exactly like the model) paired with the musical directive \"如歌\" (cantabile / song-like, expressive and flowing).\n\nConsiders the tension between mechanical precision and affective expression in classical training, bodily discipline, and voice. Directly connected to [[copying]] and graphic [[scores]].\n\n*Placeholder entry: Pending verification of medium and year of execution.*",
    "subjects": [
      "pedagogy",
      "voice",
      "imitation",
      "cantabile",
      "discipline"
    ],
    "relatedEntryIds": [
      "copying",
      "scores",
      "script-notes"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-mf-1",
        "type": "text",
        "content": "Exploring the pedagogical mandate \"模仿要像\" (to imitate faithfully / to look exactly like the model) paired with the musical directive \"如歌\" (cantabile / song-like, expressive and flowing).\n\nConsiders the tension between mechanical precision and affective expression in classical training, bodily discipline, and voice. Directly connected to [[copying]] and graphic [[scores]].\n\n*Placeholder entry: Pending verification of medium and year of execution.*"
      }
    ],
    "isDevelopingWork": true,
    "notesForArtist": "Review entry details: clarify if audio, video, score, or installation.",
    "createdAt": "2026-01-20T09:30:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-pedagogy",
      "tag-voice",
      "tag-imitation",
      "tag-cantabile",
      "tag-discipline"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "ss-between-books-and-libraries",
    "slug": "ss-between-books-and-libraries",
    "title": "述书 / SS: between books & libraries",
    "titleZh": "述书",
    "type": "project",
    "status": "published",
    "date": "Ongoing project",
    "datePlaceholder": false,
    "medium": "Research, publishing, reading sessions, library interventions",
    "dimensions": "Variable",
    "shortDescription": "A long-term project traversing books, public and independent libraries, reader communities, personal collections, and reading sessions.",
    "fullText": "“述书 / SS: between books & libraries” is an ongoing framework within Hong Shu-ying's practice. \n\nThe name draws upon *Shu Shu* (述书)—recounting, narrating, or commenting on books—while positioning the work in the interval between books as bound objects and libraries as collective spatial institutions.\n\nIt encompasses:\n- **Books**: Printed matter, artists' publications, annotated volumes, and marginalia.\n- **Libraries**: Independent archives, institutional collections, public reading rooms, and personal shelves.\n- **People & Conversations**: Readers, custodians, transcribers, and librarians.\n- **Programmes**: Reading groups, including the [[part-time-book-club]], translation circles, and collective reading aloud.\n\nRather than remaining an isolated project, SS branches into works, notes on [[copying]], and transcribed [[script-notes]].",
    "subjects": [
      "libraries",
      "publishing",
      "reading",
      "archiving",
      "conversation",
      "pedagogy"
    ],
    "relatedEntryIds": [
      "part-time-book-club",
      "copying",
      "script-notes",
      "part-time-book-club-zine",
      "instructional-scores-pdf"
    ],
    "collections": [
      "ss"
    ],
    "images": [],
    "blocks": [
      {
        "id": "block-ss-1",
        "type": "text",
        "content": "“述书 / SS: between books & libraries” is an ongoing framework within Hong Shu-ying's practice. \n\nThe name draws upon *Shu Shu* (述书)—recounting, narrating, or commenting on books—while positioning the work in the interval between books as bound objects and libraries as collective spatial institutions.\n\nIt encompasses:\n- **Books**: Printed matter, artists' publications, annotated volumes, and marginalia.\n- **Libraries**: Independent archives, institutional collections, public reading rooms, and personal shelves.\n- **People & Conversations**: Readers, custodians, transcribers, and librarians.\n- **Programmes**: Reading groups, including the [[part-time-book-club]], translation circles, and collective reading aloud.\n\nRather than remaining an isolated project, SS branches into works, notes on [[copying]], and transcribed [[script-notes]]."
      }
    ],
    "isDevelopingWork": false,
    "ssCategory": "overview",
    "notesForArtist": "Core project framework. Sub-entries (books, libraries, people, programmes) are tagged with collection: \"ss\".",
    "createdAt": "2026-01-01T08:00:00Z",
    "updatedAt": "2026-03-05T14:00:00Z",
    "tagIds": [
      "tag-libraries",
      "tag-publishing",
      "tag-reading",
      "tag-archiving",
      "tag-conversation",
      "tag-pedagogy"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "part-time-book-club",
    "slug": "part-time-book-club",
    "title": "Part Time Book Club",
    "titleZh": "业余读书会",
    "type": "project",
    "status": "published",
    "date": "[placeholder date / ongoing]",
    "datePlaceholder": true,
    "medium": "Collective reading sessions, shared marginalia, reading lists",
    "dimensions": "Discursive / variable",
    "shortDescription": "Informal, periodic gatherings around reading, printed matter, and shared marginalia, developed within 述书 / SS.",
    "fullText": "An informal reading collective convened on a \"part-time\" basis, resisting the professionalization of reading and creating non-coercive spaces for close study.\n\nParticipants bring books, unread essays, or fragments to read alongside one another. The club explores reading as a physical, shared occupation rather than an isolated intellectual test.\n\nOrganized as part of [[ss-between-books-and-libraries]] and informed by practices of [[scores]] and collective recitation.\n\n*Note for artist review: Dates, frequency, and meeting locations kept open as placeholders.*",
    "subjects": [
      "reading",
      "collective study",
      "books",
      "libraries",
      "conversation"
    ],
    "relatedEntryIds": [
      "ss-between-books-and-libraries",
      "scores",
      "part-time-book-club-zine"
    ],
    "collections": [
      "ss"
    ],
    "images": [],
    "blocks": [
      {
        "id": "block-ptbc-1",
        "type": "text",
        "content": "An informal reading collective convened on a \"part-time\" basis, resisting the professionalization of reading and creating non-coercive spaces for close study.\n\nParticipants bring books, unread essays, or fragments to read alongside one another. The club explores reading as a physical, shared occupation rather than an isolated intellectual test.\n\nOrganized as part of [[ss-between-books-and-libraries]] and informed by practices of [[scores]] and collective recitation.\n\nSee published transcript: [[part-time-book-club-zine]].\n\n*Note for artist review: Dates, frequency, and meeting locations kept open as placeholders.*"
      }
    ],
    "isDevelopingWork": false,
    "ssCategory": "programme",
    "notesForArtist": "Review list of readings and past sessions to record as linked notes or publications.",
    "createdAt": "2026-01-25T14:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-reading",
      "tag-collective-study",
      "tag-books",
      "tag-libraries",
      "tag-conversation"
    ],
    "associatedProjectIds": [
      "ss-between-books-and-libraries"
    ]
  },
  {
    "id": "parallel-on-paper",
    "slug": "parallel-on-paper",
    "title": "| | on paper",
    "titleZh": "",
    "type": "work",
    "status": "published",
    "date": "[placeholder date for review]",
    "datePlaceholder": true,
    "medium": "Graphite, ink, or embossed lines on paper [placeholder]",
    "dimensions": "[placeholder for artist review]",
    "shortDescription": "Marks, spacing, and parallel pauses registered across paper sheets.",
    "fullText": "A series of paper studies investigating two parallel vertical bars \"| |\"—reading them as architectural columns, caesurae in poetic meter, pause symbols, or parallel coordinates on the plane.\n\nThe work questions the threshold where minimal notation shifts from punctuation into structural space.\n\nDirectly related to [[script-notes]] and the rhythmic notation of [[scores]].\n\n*Placeholder entry: Awaiting review of paper types, dimensions, and photographic documentation.*",
    "subjects": [
      "paper",
      "measurement",
      "silence",
      "drawing",
      "notation"
    ],
    "relatedEntryIds": [
      "script-notes",
      "scores"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-pop-1",
        "type": "text",
        "content": "A series of paper studies investigating two parallel vertical bars \"| |\"—reading them as architectural columns, caesurae in poetic meter, pause symbols, or parallel coordinates on the plane.\n\nThe work questions the threshold where minimal notation shifts from punctuation into structural space.\n\nDirectly related to [[script-notes]] and the rhythmic notation of [[scores]].\n\n*Placeholder entry: Awaiting review of paper types, dimensions, and photographic documentation.*"
      }
    ],
    "isDevelopingWork": true,
    "notesForArtist": "Developing study. Keep marked as developing work until finalized.",
    "createdAt": "2026-02-01T16:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-paper",
      "tag-measurement",
      "tag-silence",
      "tag-drawing",
      "tag-notation"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "scores",
    "slug": "scores",
    "title": "scores",
    "titleZh": "谱",
    "type": "note",
    "status": "published",
    "date": "Method / concept",
    "datePlaceholder": false,
    "medium": "Conceptual term / notation framework",
    "dimensions": "",
    "shortDescription": "Instructional diagrams, reading sequences, and choreographies for voice, eyes, or hand.",
    "fullText": "The score (谱, pu) functions in this practice not merely as musical notation, but as an open script for action, observation, and time-keeping.\n\nA score can be:\n- A typographic layout directing the eye's wandering speed\n- An invitation for two strangers to share silence\n- A sequence of physical constraints for transcription\n\nEntries engaging with scores include [[thank-you-for-your-time]], [[mofang-yaoxiang-ruge]], and [[instructional-scores-pdf]].",
    "subjects": [
      "score",
      "notation",
      "instruction",
      "choreography",
      "time"
    ],
    "relatedEntryIds": [
      "thank-you-for-your-time",
      "mofang-yaoxiang-ruge",
      "instructional-scores-pdf"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-sc-1",
        "type": "text",
        "content": "The score (谱, pu) functions in this practice not merely as musical notation, but as an open script for action, observation, and time-keeping.\n\nA score can be:\n- A typographic layout directing the eye's wandering speed\n- An invitation for two strangers to share silence\n- A sequence of physical constraints for transcription\n\nEntries engaging with scores include [[thank-you-for-your-time]], [[mofang-yaoxiang-ruge]], [[parallel-on-paper]], and [[instructional-scores-pdf]]."
      }
    ],
    "isDevelopingWork": false,
    "notesForArtist": "Term entry: summarizes how score-making operates across various projects.",
    "createdAt": "2026-02-05T10:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-score",
      "tag-notation",
      "tag-instruction",
      "tag-choreography",
      "tag-time"
    ],
    "associatedProjectIds": []
  },
  {
    "id": "copying",
    "slug": "copying",
    "title": "copying",
    "titleZh": "摹 / 抄",
    "type": "note",
    "status": "published",
    "date": "Method / concept",
    "datePlaceholder": false,
    "medium": "Methodological framework",
    "dimensions": "",
    "shortDescription": "Copying as an embodied method of close looking, critical proximity, and cognitive transcription rather than mechanical reproduction.",
    "fullText": "Copying (临摹 linmo / 抄录 chaolu) is considered here as an active epistemic tool.\n\nBy tracing another's words, strokes, or cadence, the copyist inhabits the original text from the inside. The divergence—the involuntary tremble, the slight misreading, the fatigue of the wrist—reveals the boundary between the original and the self.\n\nConnects deeply to [[mofang-yaoxiang-ruge]], [[script-notes]], and the archival ethos of [[ss-between-books-and-libraries]].",
    "subjects": [
      "transcription",
      "imitation",
      "transmission",
      "study",
      "pedagogy"
    ],
    "relatedEntryIds": [
      "mofang-yaoxiang-ruge",
      "script-notes",
      "ss-between-books-and-libraries",
      "facsimile-inscriptions-spreads"
    ],
    "collections": [],
    "images": [],
    "blocks": [
      {
        "id": "block-cp-1",
        "type": "text",
        "content": "Copying (临摹 linmo / 抄录 chaolu) is considered here as an active epistemic tool.\n\nBy tracing another's words, strokes, or cadence, the copyist inhabits the original text from the inside. The divergence—the involuntary tremble, the slight misreading, the fatigue of the wrist—reveals the boundary between the original and the self.\n\nConnects deeply to [[mofang-yaoxiang-ruge]], [[script-notes]], and the archival ethos of [[ss-between-books-and-libraries]]."
      }
    ],
    "isDevelopingWork": false,
    "notesForArtist": "Core conceptual term across both individual works and the library archive.",
    "createdAt": "2026-02-10T12:00:00Z",
    "updatedAt": "2026-03-01T12:00:00Z",
    "tagIds": [
      "tag-transcription",
      "tag-imitation",
      "tag-transmission",
      "tag-study",
      "tag-pedagogy"
    ],
    "associatedProjectIds": [
      "ss-between-books-and-libraries"
    ]
  }
];
