import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeArchive } from '../src/services/archiveMerge';
import type { ArchiveBundle } from '../src/services/githubPublishing';

const archive = (): ArchiveBundle => ({version:3, entries:[{id:'work',title:'Work',slug:'work',blocks:[{id:'text',type:'text',content:'Original'}]} as any], tags:[], settings:{showWander:true} as any});

test('remote deletions survive an unchanged draft, while edit versus delete conflicts', () => {
  const base=archive(), local=archive(), remote=archive(); remote.entries=[];
  assert.deepEqual(mergeArchive(base,local,remote).entries,[]);
  local.entries[0].title='Edited';
  assert.throws(()=>mergeArchive(base,local,remote),/both your draft and GitHub changed/);
});

test('independent added entries and tags are retained; competing additions conflict', () => {
  const base=archive(), local=archive(), remote=archive();
  local.entries.push({...local.entries[0],id:'local',slug:'local'});
  remote.entries.push({...remote.entries[0],id:'remote',slug:'remote'});
  local.tags.push({id:'local-tag',label:'Local'});
  remote.tags.push({id:'remote-tag',label:'Remote'});
  const merged=mergeArchive(base,local,remote);
  assert.deepEqual(new Set(merged.entries.map(entry=>entry.id)),new Set(['work','local','remote']));
  assert.equal(merged.tags.length,2);
  remote.entries.push({...remote.entries[0],id:'local',slug:'local',title:'Different'});
  assert.throws(()=>mergeArchive(base,local,remote),/both your draft and GitHub changed/);
});

test('competing text or gallery edits stop rather than selecting a side', () => {
  const base=archive(), local=archive(), remote=archive();
  (local.entries[0].blocks![0] as any).content='Local prose';
  (remote.entries[0].blocks![0] as any).content='Remote prose';
  assert.throws(()=>mergeArchive(base,local,remote),/entries\[Work\].blocks/);
  assert.equal((local.entries[0].blocks![0] as any).content,'Local prose');
});
