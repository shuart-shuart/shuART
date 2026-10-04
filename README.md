# shuART

Hong Shu-ying’s art archive, built with React, Vite and Tailwind CSS.

## Development

Use Node.js 24 and Bun 1.3.0.

```sh
bun install --frozen-lockfile
bun run dev
bun run build
```

## Publishing

In repository **Settings → Pages**, set **Source** to **GitHub Actions**.
Every push to `main` builds `dist/` and publishes it to
https://shuart-shuart.github.io/shuART/. Pull requests build without publishing.
Vite’s `/shuART/` base keeps assets inside the project’s Pages path.

## Editing with ChatGPT

This repository is the source of truth for code changes. Ask ChatGPT to inspect
`shuart-shuart/shuART`, make the requested changes, verify the build and commit
them. Changes on `main` trigger deployment; the Actions tab shows build results.

- `src/data/initialEntries.ts`: starter entries and content blocks.
- `src/data/canonicalTags.ts`: canonical vocabulary and tags.
- `src/components/`: archive views, entry display and editor.
- `src/index.css`: global styling.
- `public/`: PDFs and other bundled files. Use deployment-aware URLs when rendering.

Existing browser-local content can override starter entries. Export any local
editor work before changing storage or moving devices. Source edits to existing
starter entries may require verification in a fresh browser profile.

## Shared content editing

Without Firebase configuration, the site uses browser-local storage. Changes
made in that mode are only saved in that browser and do not update the public
archive for other visitors. Repository content changes publish through GitHub.

For shared editor saves, configure the six `VITE_FIREBASE_*` repository Actions
secrets listed in `.env.example`, deploy the included Firebase rules, enable the
required authentication provider, and authorize `shuart-shuart.github.io` in
Firebase Authentication. Redeploy after changing build-time configuration.
Never include service-account credentials or private API keys in browser code.

The current entries include demonstration material. Verify texts, dates, credits
and images before treating them as the final portfolio content.
