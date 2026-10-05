import { AboutContent, FooterContent, IndexContent } from '../types';

export const DEFAULT_ABOUT: AboutContent = {
  "title": "About",
  "artistName": "Hong Shu-ying 方舒颖",
  "biography": "Hong Shu-ying 方舒颖’s practice works across text, paper studies, transcription, instructional scores, and library interventions. Her work is situated within the daily rhythms of reading, handwriting, repetition, and the relational protocols of attention.\n\nRather than presenting a closed catalogue of finished monuments, this site functions as an evolving index. Developing ideas, found images, and working notes are catalogued alongside completed works, allowing connections between conceptual terms (such as [title]copying[/title] or [title]scores[/title]) and collective projects (such as 述书 / SS: between books & libraries and the Part Time Book Club) to remain visible and active.",
  "sections": [
    {
      "id": "structure",
      "title": "Structure of the Index",
      "text": "",
      "items": [
        {
          "id": "item-0",
          "title": "Works & Studies",
          "text": "Artwork installations, paper studies, transcriptions, and printed multiples. Developing studies are explicitly distinguished from finalized editions."
        },
        {
          "id": "item-1",
          "title": "述书 / SS",
          "text": "A dedicated project framework engaging books, independent collections, librarians, and periodic reading groups."
        },
        {
          "id": "item-2",
          "title": "Terms & Methods",
          "text": "Conceptual references and working methods—such as copying, scores, and transcription cadence—that cut across multiple projects."
        },
        {
          "id": "item-3",
          "title": "Backlinks & Cross-References",
          "text": "Bi-directional connections show which entries cite or refer to one another, enabling wandering through the archive."
        }
      ]
    },
    {
      "id": "colophon",
      "title": "Colophon & Site Notes",
      "text": "This website preserves the quiet, direct tone and black typography of [hongshuying.art](https://hongshuying.art/Index.html), with improved responsiveness across mobile screens and desktop reading environments.\n\nSample entries are currently set up with explicit placeholders for dates, mediums, and documentation for review by Hong Shu-ying. No exhibitions, photographs, or completed artworks have been fabricated.",
      "items": []
    }
  ],
  "contactTitle": "Contact",
  "contactText": "[work@anotherunit.xyz](mailto:work@anotherunit.xyz)"
};

export const DEFAULT_FOOTER: FooterContent = {
  "artistName": "Hong Shu-ying 方舒颖",
  "description": "Archive, instructional scores, transcription, and library inquiries.",
  "links": [
    {
      "id": "email",
      "label": "work@anotherunit.xyz",
      "url": "mailto:work@anotherunit.xyz"
    },
    {
      "id": "instagram",
      "label": "Instagram",
      "url": "https://www.instagram.com"
    },
    {
      "id": "bio",
      "label": "CV & Bio",
      "url": "#about"
    },
    {
      "id": "website",
      "label": "hongshuying.art",
      "url": "https://hongshuying.art"
    }
  ]
};

export const DEFAULT_INDEX: IndexContent = {
  "title": "Index",
  "description": "Rather than presenting a closed catalogue of finished monuments, this site functions as an evolving index. Developing ideas, found images, and working notes are catalogued alongside completed works, allowing connections between the various fragments to remain visible and active."
};
