import test from 'node:test';
import assert from 'node:assert/strict';
import { entryTags, tagCounts } from '../src/services/canonicalTags';
import type { Entry, Tag } from '../src/types';
const tags: Tag[] = [{id:'tag-books',label:'books and bookish things'}, {id:'tag-libraries',label:'libraries'}];
test('legacy subjects and unknown IDs never create fallback labels', () => {
  const entry = {tagIds:['tag-books','tag-books','unknown'],subjects:['books and bookish things','legacy']} as Entry;
  assert.deepEqual(entryTags(entry,tags).map(t=>t.id),['tag-books']);
  assert.deepEqual(tagCounts([entry,{tagIds:[],subjects:['libraries']} as Entry],tags),[{id:'tag-books',label:'books and bookish things',count:1}]);
});
test('tag counts count each assigned entry once', () => {
  const entries = [{tagIds:['tag-books','tag-books']},{tagIds:['tag-books','tag-libraries']}] as Entry[];
  assert.deepEqual(tagCounts(entries,tags),[{id:'tag-books',label:'books and bookish things',count:2},{id:'tag-libraries',label:'libraries',count:1}]);
});
