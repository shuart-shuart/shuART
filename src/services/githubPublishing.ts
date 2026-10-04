import legacyMediaUrls from '../data/legacyMediaUrls.json';
import type { Entry, SiteSettings, Tag } from '../types';

export interface ArchiveBundle { version: number; entries: Entry[]; tags: Tag[]; settings: SiteSettings; }
export const REPOSITORY = 'shuart-shuart/shuART';
export const CONTENT_PATH = 'src/data/archive.json';
export const DRAFT_BASE_KEY = 'shuart_github_draft_base_v3';
const API = `https://api.github.com/repos/${REPOSITORY}`;
let sessionToken = '';
let publishing = false;
export const isGitHubConnected = () => Boolean(sessionToken);
export function disconnectGitHub() { sessionToken = ''; }

async function request(path: string, method = 'GET', body?: unknown) {
  if (!sessionToken) throw new Error('Connect GitHub before publishing.');
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${sessionToken}`, 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    if (response.status === 401) { disconnectGitHub(); throw new Error('GitHub token expired or was rejected. Reconnect to continue.'); }
    if (response.status === 403) throw new Error('GitHub refused this operation. Check token expiry, repository access and Contents: read and write permission, or retry after the rate limit resets.');
    if (response.status === 409 || response.status === 422) throw new Error('GitHub changed during publishing or branch rules blocked the commit. Your local draft is retained; check the repository before retrying.');
    throw new Error(`GitHub request failed (${response.status}). Your local draft is retained.`);
  }
  return response.status === 204 ? null : response.json();
}

function decodeUtf8(base64: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\s/g, '')), c => c.charCodeAt(0)));
}
export function validateArchive(value: unknown): asserts value is ArchiveBundle {
  const bundle = value as ArchiveBundle;
  if (!bundle || !Array.isArray(bundle.entries) || !Array.isArray(bundle.tags) || !bundle.settings || typeof bundle.settings !== 'object') throw new Error('Invalid archive: entries, tags and settings are required.');
  const about = bundle.settings.about;
  if (about && (['title','artistName','biography','contactTitle','contactText'].some(key => typeof (about as any)[key] !== 'string') || !Array.isArray(about.sections) || about.sections.some(section => !section || typeof section.id !== 'string' || typeof section.title !== 'string' || typeof section.text !== 'string' || !Array.isArray(section.items) || section.items.some(item => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.text !== 'string')))) throw new Error('Invalid About page settings.');
  const footer = bundle.settings.footer;
  if (footer && (typeof footer.artistName !== 'string' || typeof footer.description !== 'string' || !Array.isArray(footer.links) || footer.links.some(link => !link || typeof link.id !== 'string' || typeof link.label !== 'string' || typeof link.url !== 'string'))) throw new Error('Invalid footer settings.');
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const entry of bundle.entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.slug !== 'string' || !entry.slug || typeof entry.title !== 'string' || typeof entry.shortDescription !== 'string' || typeof entry.fullText !== 'string' || !Array.isArray(entry.tagIds) || !Array.isArray(entry.subjects) || !Array.isArray(entry.relatedEntryIds) || !['published', 'draft'].includes(entry.status) || !['work','project','publication','note'].includes(entry.type) || ids.has(entry.id) || slugs.has(entry.slug)) throw new Error('Invalid archive entry or duplicate entry ID/slug.');
    ids.add(entry.id); slugs.add(entry.slug);
  }
  if (bundle.tags.some(tag => !tag || typeof tag.id !== 'string' || typeof tag.label !== 'string') || new Set(bundle.tags.map(tag => tag.id)).size !== bundle.tags.length) throw new Error('Invalid or duplicate archive tags.');
}

export async function readRepositoryArchive(ref = 'main'): Promise<{ bundle: ArchiveBundle; sha: string }> {
  const file = await request(`/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref)}`);
  if (!file.content || file.encoding !== 'base64') throw new Error('The archive file could not be read.');
  const bundle = JSON.parse(decodeUtf8(file.content));
  validateArchive(bundle);
  return { bundle, sha: file.sha };
}
export async function connectGitHub(token: string) {
  disconnectGitHub();
  if (!token.trim().startsWith('github_pat_')) throw new Error('Use a fine-grained GitHub personal access token restricted to this repository.');
  sessionToken = token.trim();
  try {
    const repo = await request('');
    if (!repo.permissions?.push) throw new Error('This GitHub account cannot write to shuART.');
    return await readRepositoryArchive();
  } catch (error) { disconnectGitHub(); throw error; }
}

const MEDIA_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'application/pdf': 'pdf' };
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export async function stageMediaFile(file: File): Promise<string> {
  const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
  if (!MEDIA_TYPES[type]) throw new Error('Upload a JPEG, PNG, WebP, GIF, AVIF or PDF. Link videos externally.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Please reduce this file to 2 MB or less before uploading.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:;base64,/, `data:${type};base64,`));
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareArchiveMedia(bundle: ArchiveBundle): Promise<{ bundle: ArchiveBundle; media: {path: string; base64: string}[] }> {
  validateArchive(bundle);
  const publicBundle: ArchiveBundle = { ...bundle, entries: bundle.entries.filter(entry => entry.status === 'published').map(({ notesForArtist, ...entry }) => entry) };
  const media = new Map<string, {path: string; base64: string}>();
  let total = 0;
  async function visit(value: any): Promise<any> {
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(legacyMediaUrls, value)) return (legacyMediaUrls as Record<string,string>)[value];
    if (typeof value === 'string' && value.startsWith('data:')) {
      const match = value.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
      if (!match || !MEDIA_TYPES[match[1]]) throw new Error('Unsupported embedded media. Upload images or PDFs and link videos externally.');
      const base64 = match[2].replace(/\s/g, '');
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)); } catch { throw new Error('An embedded media file is corrupted.'); }
      if (bytes.length > MAX_UPLOAD_BYTES) throw new Error('An embedded file exceeds the 2 MB upload limit.');
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>))).map(b => b.toString(16).padStart(2, '0')).join('');
      const path = `public/media/${hash}.${MEDIA_TYPES[match[1]]}`;
      if (!media.has(path)) { total += bytes.length; media.set(path, {path, base64}); }
      if (total > 20 * 1024 * 1024) throw new Error('Publish fewer than 20 MB of new media at a time.');
      return `https://raw.githubusercontent.com/${REPOSITORY}/main/${path}`;
    }
    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [key, child] of Object.entries(value)) result[key] = await visit(child);
      return result;
    }
    return value;
  }
  return { bundle: await visit(publicBundle), media: [...media.values()] };
}

export async function publishArchive(bundle: ArchiveBundle, expectedContentSha: string) {
  if (publishing) throw new Error('A publish is already running.');
  if (!expectedContentSha) throw new Error('Missing draft baseline. Reload the repository content before publishing.');
  publishing = true;
  try {
    const head = await request('/git/ref/heads/main');
    const parentSha = head.object.sha;
    const current = await readRepositoryArchive(parentSha);
    if (current.sha !== expectedContentSha) throw new Error('The archive changed in GitHub since this draft began. Export your draft, then reload repository content and reapply your changes. Publishing stopped to avoid overwriting newer content.');
    const prepared = await prepareArchiveMedia(bundle);
    const publishedEntries = new Map(prepared.bundle.entries.map(entry => [entry.id, entry]));
    const localBundle: ArchiveBundle = { ...bundle, entries: bundle.entries.map(entry => {
      const published = publishedEntries.get(entry.id);
      return published ? { ...published, ...(entry.notesForArtist !== undefined ? { notesForArtist: entry.notesForArtist } : {}) } : entry;
    }) };
    const content = JSON.stringify(prepared.bundle, null, 2) + '\n';
    if (new TextEncoder().encode(content).length > 900 * 1024) throw new Error('Archive text exceeds the 900 KB editor limit. Split the archive before publishing.');
    if (!prepared.media.length && JSON.stringify(current.bundle) === JSON.stringify(prepared.bundle)) return { bundle: localBundle, contentSha: current.sha, commitSha: parentSha, changed: false };
    const parent = await request(`/git/commits/${parentSha}`);
    const elements: {path: string; mode: string; type: string; sha: string}[] = [];
    for (const file of prepared.media) {
      const blob = await request('/git/blobs', 'POST', { content: file.base64, encoding: 'base64' });
      elements.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
    }
    const archiveBlob = await request('/git/blobs', 'POST', { content, encoding: 'utf-8' });
    elements.push({path:CONTENT_PATH,mode:'100644',type:'blob',sha:archiveBlob.sha});
    const tree = await request('/git/trees', 'POST', {base_tree:parent.tree.sha,tree:elements});
    const commit = await request('/git/commits', 'POST', {message:'Publish archive content from website editor',tree:tree.sha,parents:[parentSha]});
    await request('/git/refs/heads/main','PATCH',{sha:commit.sha,force:false});
    return { bundle:localBundle, contentSha:archiveBlob.sha, commitSha:commit.sha, changed:true };
  } finally { publishing = false; }
}
