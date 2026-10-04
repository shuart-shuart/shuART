import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { Entry, SiteSettings, EntryImage } from '../types';

export const DESIGNATED_EDITOR_EMAIL = 'work@anotherunit.xyz';

// Firebase Client Configuration
const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your-api-key'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

export { auth, db, storage };

// Auth helpers
export async function firebaseSignIn(email: string, password?: string): Promise<User | null> {
  if (auth && password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
  return null;
}

export async function firebaseGoogleSignIn(): Promise<User | null> {
  if (auth) {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }
  return null;
}

export async function firebaseSignOut(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToFirebaseAuthState(callback: (user: User | null) => void): () => void {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {};
}

// Storage helper: Upload entry documentation image to Firebase Storage
export async function uploadEntryImageToStorage(
  file: File,
  entryId: string
): Promise<EntryImage> {
  const imageId = 'img-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  
  if (storage) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `entries/${entryId}/${imageId}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: DESIGNATED_EDITOR_EMAIL,
      },
    });
    const downloadUrl = await getDownloadURL(storageRef);
    return {
      id: imageId,
      url: downloadUrl,
      storagePath,
      caption: '',
      alt: file.name.replace(/\.[^/.]+$/, ''),
      credit: '',
    };
  }

  // Fallback for local preview when storage credentials are not yet supplied
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        id: imageId,
        url: e.target?.result as string,
        caption: '',
        alt: file.name.replace(/\.[^/.]+$/, ''),
        credit: '',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Storage helper: Upload entry document (PDF, scan, or original file) to Firebase Storage
export async function uploadEntryFileToStorage(
  file: File,
  entryId: string,
  subFolder: 'images' | 'documents' | 'pages' = 'documents'
): Promise<{ id: string; url: string; storagePath?: string; fileName: string; fileSize: string }> {
  const fileId = 'file-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const sizeFormatted = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(file.size / 1024)} KB`;

  if (storage) {
    const fileExt = file.name.split('.').pop() || 'dat';
    const storagePath = `entries/${entryId}/${subFolder}/${fileId}.${fileExt}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      contentDisposition: file.name.toLowerCase().endsWith('.pdf') ? 'inline' : undefined,
      customMetadata: {
        originalName: file.name,
        uploadedBy: DESIGNATED_EDITOR_EMAIL,
      },
    });
    const downloadUrl = await getDownloadURL(storageRef);
    return {
      id: fileId,
      url: downloadUrl,
      storagePath,
      fileName: file.name,
      fileSize: sizeFormatted,
    };
  }

  // Fallback for local preview when storage credentials are not yet supplied
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        id: fileId,
        url: e.target?.result as string,
        fileName: file.name,
        fileSize: sizeFormatted,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Firestore operations for Entries
export async function loadEntriesFromFirestore(): Promise<Entry[] | null> {
  if (!db) return null;
  try {
    const snap = await getDocs(collection(db, 'entries'));
    const entries: Entry[] = [];
    snap.forEach((docSnap) => {
      entries.push(docSnap.data() as Entry);
    });
    return entries;
  } catch (err) {
    console.warn('Could not fetch from Firestore, falling back to local storage:', err);
    return null;
  }
}

export async function persistEntryToFirestore(entry: Entry): Promise<boolean> {
  if (!db) return false;
  try {
    const entryRef = doc(db, 'entries', entry.id);
    await setDoc(entryRef, entry, { merge: true });
    return true;
  } catch (err) {
    console.error('Error writing entry to Firestore:', err);
    return false;
  }
}

export async function removeEntryFromFirestore(entryId: string): Promise<boolean> {
  if (!db) return false;
  try {
    const entryRef = doc(db, 'entries', entryId);
    await deleteDoc(entryRef);
    return true;
  } catch (err) {
    console.error('Error deleting entry from Firestore:', err);
    return false;
  }
}

// Firestore operations for SiteSettings (including "Show Wander")
export async function loadSiteSettingsFromFirestore(): Promise<SiteSettings | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch settings from Firestore:', err);
    return null;
  }
}

export async function persistSiteSettingsToFirestore(settings: SiteSettings): Promise<boolean> {
  if (!db) return false;
  try {
    const settingsRef = doc(db, 'settings', 'site');
    await setDoc(settingsRef, settings, { merge: true });
    return true;
  } catch (err) {
    console.error('Error writing site settings to Firestore:', err);
    return false;
  }
}
