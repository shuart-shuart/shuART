import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ABOUT, DEFAULT_FOOTER } from '../src/data/siteContent';
import { ArchiveBundle, CONTENT_PATH, connectGitHub, disconnectGitHub, isGitHubConnected, prepareArchiveMedia, publishArchive, readRepositoryArchive } from '../src/services/githubPublishing';
import { PUBLISHED_ARCHIVE, beginGitHubEditorSession, fetchEntries, fetchSiteSettings, getDraftArchive, replaceGitHubDraft, saveDraftArchive, saveEntry, saveTag, deleteEntryById } from '../src/services/storage';

const bundle = (): ArchiveBundle => ({
  version: 3,
  entries: [0,1].map(index => ({ id: `entry-${index}`, slug: `entry-${index}`, title: `Entry ${index}`, type: 'work', status: 'published', shortDescription: '', fullText: '', tagIds: [], subjects: [], relatedEntryIds: [], createdAt: '2026-10-05', updatedAt: '2026-10-05' })),
  tags: [{ id: 'tag-copying', label: 'copying' }],
  settings: { showWander: true, typography: 'a', updatedAt: '2026-10-05', about: structuredClone(DEFAULT_ABOUT), footer: structuredClone(DEFAULT_FOOTER) },
});
let calls: { path: string; method: string; body: any }[] = [];
let contentSha = 'content-old';
let rejectRef = false;
let unauthorized = false;
let remote = bundle();
function setup() {
  disconnectGitHub(); calls = []; contentSha = 'content-old'; rejectRef = false; unauthorized = false; remote = bundle();
  const memory = new Map<string,string>();
  Object.defineProperty(globalThis, 'localStorage', {configurable:true,value:{getItem:(k:string)=>memory.get(k) ?? null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}});
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, 'https://api.github.com');
    const path = url.pathname.replace('/repos/shuart-shuart/shuART', '');
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({path,method,body});
    if (unauthorized) return Response.json({}, {status:401});
    if (!path) return Response.json({permissions:{push:true}});
    if (path === `/contents/${CONTENT_PATH}`) return Response.json({sha:contentSha,encoding:'base64',content:Buffer.from(JSON.stringify(remote)).toString('base64')});
    if (path === '/git/ref/heads/main') return Response.json({object:{sha:'head-latest'}});
    if (path === '/git/commits/head-latest') return Response.json({tree:{sha:'tree-original'}});
    if (path === '/git/blobs') return Response.json({sha:body.encoding === 'utf-8' ? 'archive-new' : 'media-new'});
    if (path === '/git/trees') return Response.json({sha:'tree-new'});
    if (path === '/git/commits') return Response.json({sha:'commit-new'});
    if (path === '/git/refs/heads/main') return Response.json({}, {status:rejectRef ? 422 : 200});
    throw new Error(`Unexpected mock API path: ${path}`);
  }) as typeof fetch;
  return memory;
}
const connect = () => connectGitHub('github_pat_test_not_a_real_credential');

test('connection validates repository; token is never persisted; disconnect revokes session', async () => {
  const memory = setup();
  assert.equal(isGitHubConnected(),false);
  await assert.rejects(connectGitHub('classic-token'), /fine-grained/);
  const snapshot = await connect();
  assert.equal(snapshot.sha,'content-old');
  assert.equal(isGitHubConnected(),true);
  assert.equal(memory.size,0);
  disconnectGitHub();
  await assert.rejects(readRepositoryArchive(), /Connect GitHub/);
});

test('publishes unicode text and deduplicated media atomically on latest code tree', async () => {
  setup(); await connect(); calls = [];
  const draft = bundle();
  draft.entries[0].title = '测试 🎵';
  const embedded = 'data:image/png;base64,' + Buffer.from('sample-media').toString('base64');
  draft.entries[0].images = [{id:'a',url:embedded}];
  draft.entries[1].images = [{id:'b',url:embedded}];
  const result = await publishArchive(draft,'content-old');
  assert.equal(result.commitSha,'commit-new');
  assert.equal(result.contentSha,'archive-new');
  assert.equal(result.changed,true);
  assert.equal(draft.entries[0].images![0].url,embedded, 'input draft remains intact');
  assert.match(result.bundle.entries[0].images![0].url, /^https:\/\/raw.githubusercontent.com\/shuart-shuart\/shuART\/main\/public\/media\/[a-f0-9]{64}\.png$/);
  assert.equal(result.bundle.entries[0].images![0].url,result.bundle.entries[1].images![0].url);
  const blobs = calls.filter(c=>c.path==='/git/blobs');
  assert.equal(blobs.length,2);
  assert.match(blobs.find(c=>c.body.encoding==='utf-8')!.body.content,/测试 🎵/);
  assert.doesNotMatch(blobs.find(c=>c.body.encoding==='utf-8')!.body.content,/data:image/);
  const tree = calls.find(c=>c.path==='/git/trees')!;
  assert.equal(tree.body.base_tree,'tree-original');
  assert.equal(tree.body.tree.length,2);
  const commit = calls.find(c=>c.path==='/git/commits')!;
  assert.deepEqual(commit.body.parents,['head-latest']);
  assert.equal(calls.at(-1)!.path,'/git/refs/heads/main');
  assert.equal(calls.at(-1)!.body.force,false);
});

test('changed content stops before any writes; unchanged content creates no commit', async () => {
  setup(); await connect(); contentSha='someone-else-updated'; calls=[];
  await assert.rejects(publishArchive(bundle(),'content-old'),/archive changed/);
  assert.equal(calls.some(c=>c.method!=='GET'),false);
  contentSha='content-old'; calls=[];
  const result=await publishArchive(bundle(),'content-old');
  assert.equal(result.changed,false);
  assert.equal(calls.some(c=>c.method!=='GET'),false);
});

test('ref rejection never forces an update and does not modify caller draft', async () => {
  setup(); await connect(); rejectRef=true;
  const draft=bundle(); draft.entries[0].title='new';
  await assert.rejects(publishArchive(draft,'content-old'),/changed during publishing|branch rules/);
  assert.equal(draft.entries[0].title,'new');
  assert.equal(calls.at(-1)!.body.force,false);
});

test('rejects unsupported or oversized media and invalid duplicate entries', async () => {
  setup();
  const draft=bundle(); draft.entries[0].images=[{id:'a',url:'data:image/svg+xml;base64,PHN2Zz4='}];
  await assert.rejects(prepareArchiveMedia(draft),/Unsupported/);
  draft.entries[0].images![0].url='data:application/pdf;base64,'+Buffer.alloc(2*1024*1024+1).toString('base64');
  await assert.rejects(prepareArchiveMedia(draft),/2 MB/);
  draft.entries[0].images=[]; draft.entries.push(draft.entries[0]);
  await assert.rejects(prepareArchiveMedia(draft),/duplicate/);
});

test('public readers ignore local drafts; reconnect retains drafts and their baseline', async () => {
  const memory=setup();
  const draft=bundle(); draft.entries[0].title='LOCAL ONLY'; draft.settings.about!.biography='LOCAL BIO';
  saveDraftArchive(draft);
  assert.deepEqual(await fetchEntries(),PUBLISHED_ARCHIVE.entries);
  assert.deepEqual(await fetchSiteSettings(),PUBLISHED_ARCHIVE.settings);
  await connect(); beginGitHubEditorSession(remote,'content-old');
  const editing=getDraftArchive(); editing.entries[0].title='KEPT DRAFT'; saveDraftArchive(editing);
  disconnectGitHub(); await connect();
  const restored=beginGitHubEditorSession(remote,'new-remote-sha');
  assert.equal(restored.entries[0].title,'KEPT DRAFT');
  assert.equal(memory.get('shuart_github_draft_base_v3'),'content-old');
  assert.equal([...memory.values()].some(value=>value.includes('github_pat_')),false);
});

test('empty entries and tags stay empty; saving after deletion does not resurrect examples', async () => {
  setup(); await connect(); beginGitHubEditorSession(remote,'content-old');
  const empty={...bundle(),entries:[],tags:[]}; replaceGitHubDraft(empty,'content-old');
  assert.equal(getDraftArchive().entries.length,0);
  const entry=bundle().entries[0];
  const updated=await saveEntry(entry,[]);
  assert.deepEqual(updated.map(e=>e.id),[entry.id]);
  await deleteEntryById(entry.id,updated);
  assert.equal(getDraftArchive().entries.length,0);
  const tag=bundle().tags[0];
  const tags=await saveTag(tag,[]);
  assert.deepEqual(tags.map(t=>t.id),[tag.id]);
});

test('expired token clears session without leaking API error details', async () => {
  setup(); await connect(); unauthorized=true;
  await assert.rejects(readRepositoryArchive(),/expired or was rejected/);
  assert.equal(isGitHubConnected(),false);
});

test('legacy browser edits can migrate without changing the published archive', async () => {
  const memory=setup();
  const legacy=bundle(); legacy.settings.about!.title='My edited About';
  memory.set('hongshuying_archive_entries_v2', JSON.stringify(legacy.entries));
  memory.set('hongshuying_archive_settings_v2', JSON.stringify(legacy.settings));
  const { getLegacyBrowserArchive } = await import('../src/services/storage');
  const imported=getLegacyBrowserArchive()!;
  assert.equal(imported.settings.about!.title,'My edited About');
  assert.deepEqual(await fetchSiteSettings(),PUBLISHED_ARCHIVE.settings);
  assert.ok(memory.get('hongshuying_archive_settings_v2'));
});

test('only known legacy SVG previews are mapped to existing repository assets', async () => {
  setup();
  const { default: urls }=await import('../src/data/legacyMediaUrls.json');
  const [embedded,url]=Object.entries(urls)[0];
  const draft=bundle(); draft.entries[0].images=[{id:'legacy',url:embedded}];
  const prepared=await prepareArchiveMedia(draft);
  assert.equal(prepared.bundle.entries[0].images![0].url,url);
  assert.equal(prepared.media.length,0);
});

test('publication excludes drafts, review notes and media that belongs only to drafts', async () => {
  setup(); await connect();
  const draft=bundle();
  draft.entries[0].notesForArtist='CONFIDENTIAL REVIEW';
  draft.entries[1].status='draft'; draft.entries[1].fullText='PRIVATE DRAFT';
  draft.entries[1].images=[{id:'private-image',url:'data:image/png;base64,cHJpdmF0ZQ=='}];
  const prepared=await prepareArchiveMedia(draft);
  assert.equal(prepared.bundle.entries.length,1);
  assert.equal(prepared.bundle.entries[0].notesForArtist,undefined);
  assert.equal(prepared.media.length,0);
  assert.doesNotMatch(JSON.stringify(prepared.bundle),/CONFIDENTIAL REVIEW|PRIVATE DRAFT/);
  const result=await publishArchive(draft,'content-old');
  assert.equal(result.bundle.entries.length,2,'local drafts are retained after publish');
  assert.equal(result.bundle.entries[0].notesForArtist,'CONFIDENTIAL REVIEW');
  assert.equal(result.bundle.entries[1].fullText,'PRIVATE DRAFT');
  const archiveBlob=calls.find(c=>c.path==='/git/blobs'&&c.body.encoding==='utf-8')!;
  assert.doesNotMatch(archiveBlob.body.content,/CONFIDENTIAL REVIEW|PRIVATE DRAFT/);
});
