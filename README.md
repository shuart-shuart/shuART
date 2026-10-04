# shuART

Hong Shu-ying’s art archive, built with React, Vite and Tailwind CSS.

## Development

Use Node.js 24 and Bun 1.4.2.

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run test
```

## Publishing

Repository **Settings → Pages → Source** must be **GitHub Actions**.
Pushes to `main` build `dist/` and publish https://shuart-shuart.github.io/shuART/.
Pull requests build without deploying.

The source of truth for entries, tags, About, footer and site settings is
`src/data/archive.json`. Both the website editor and ChatGPT must edit this file.
The older `initialEntries.ts`, `canonicalTags.ts` and `siteContent.ts` remain
available as historical/sample defaults; changing them does not publish archive
content. Website uploads are committed to `public/media/` with deduplicated filenames.

## GitHub editor

1. Open https://shuart-shuart.github.io/shuART/#editor.
2. Create a fine-grained GitHub personal access token, restricted to resource
   owner `shuart-shuart`, repository `shuART`, with **Contents: Read and write**.
   Use a short expiry. No Workflows or account permissions are required.
3. Enter the token in the editor’s connection form, never in ChatGPT or source.
   It is sent only to `api.github.com` and kept in memory. It is not saved to
   local storage, cookies, session storage or the repository. Refreshing the page
   or disconnecting requires reconnecting.
4. Edit and save entries/settings to your browser draft.
5. Click **Publish to GitHub**. Text and new media are committed together.
   A commit success means GitHub accepted it; the site updates after Actions
   finishes. Use **Deployment status** to check progress.

Public visitors load the compiled repository archive, never your browser draft.
Drafts persist locally across refreshes and are available after reconnecting.
The editor refuses to publish if archive content changed since the draft began.
Export a backup, reload repository content, and reapply your changes to resolve
that conflict. Unrelated code changes are preserved. Ref updates never use force.
If branch protection prevents direct commits, publishing fails safely and keeps
the local draft; this version does not create pull requests.

This is a public repository. Only entries marked Published are committed;
draft entries and review notes stay in the browser and export backup. They do
not sync between devices through GitHub. Publish only content intended for the
public. Deleted published content remains in Git history. Historical versions
of this repository already contain sample draft/review content; this migration
does not rewrite that history. Unreferenced media files are retained rather than automatically deleted.

Media uploads support JPEG, PNG, WebP, GIF, AVIF and PDF, up to 2 MB per file.
Videos should use external links. New media is staged as embedded browser draft
content; browser storage limits can be reached with several uploads. Export a
backup and reduce media size if a draft save reports storage is full. Media files
are committed only on Publish. Files are served from GitHub raw URLs so editor
previews can load them immediately after the commit.

## Migration and backups

`5OctBackUp` preserves the repository at commit
`2f061dc5da65bb02756e94f753196772b7beb197` before this migration.
Firebase reads, writes, authentication and uploads have been disconnected from
the runtime. Existing Firebase content is not automatically imported or deleted.
If content only exists in Firebase, export it from the previous version before
retiring the Firebase project. Old browser v2 drafts are also left untouched.
Use **Import previous browser draft** to recover v2 edits from this device.
A legacy JSON backup can be imported in the Entries tab: entries and settings
are restored, and tags are restored when present. Exported v3 backups include
entries, tags and settings. Imported content remains local until Publish.

The token connection avoids a separate server. A future GitHub OAuth login would
require an authentication service; no OAuth server is deployed by this version.
