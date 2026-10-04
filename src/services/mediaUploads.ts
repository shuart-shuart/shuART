import type { EntryImage } from '../types';
import { stageMediaFile } from './githubPublishing';
export const DESIGNATED_EDITOR_EMAIL = 'work@anotherunit.xyz';

export async function uploadEntryImageToStorage(file: File, entryId: string): Promise<EntryImage> {
  return { id: crypto.randomUUID(), url: await stageMediaFile(file), caption: '', alt: file.name.replace(/\.[^/.]+$/, ''), credit: '' };
}
export async function uploadEntryFileToStorage(file: File, entryId: string, subFolder: 'images' | 'documents' | 'pages' = 'documents'): Promise<{ id: string; url: string; fileName: string; fileSize: string; storagePath?: string }> {
  return { id: crypto.randomUUID(), url: await stageMediaFile(file), fileName: file.name,
    fileSize: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB` };
}
