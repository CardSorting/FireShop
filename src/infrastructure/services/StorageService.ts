/**
 * [LAYER: INFRASTRUCTURE]
 * Storage Service using Firebase Storage.
 */
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  getBytes,
  listAll
} from 'firebase/storage';
import { getStorage } from '../firebase/firebase';
import { randomUUID } from 'node:crypto';
import { logger } from '@utils/logger';

export type StorageFolder = 'products' | 'collections' | 'general' | 'digital-assets';

const MAX_STORED_FILE_BYTES = 100 * 1024 * 1024;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export interface StoredFile {
  id: string;
  name: string;
  path: string; // This will be the public download URL
  size: number;
  mimeType: string;
}

export class StorageService {
  /**
   * Saves a file to Firebase Storage.
   */
  static async saveFile(
    buffer: Buffer | Uint8Array,
    folder: StorageFolder,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    if (buffer.byteLength > MAX_STORED_FILE_BYTES) {
      throw new Error('File exceeds maximum allowed size.');
    }

    const id = randomUUID();
    const name = `${id.slice(0, 8)}-${filename}`;
    const storagePath = `${folder}/${name}`;
    
    const storageRef = ref(getStorage(), storagePath);
    
    const metadata = {
      contentType: mimeType,
      customMetadata: {
        originalName: filename,
        id: id
      }
    };

    const snapshot = await uploadBytes(storageRef, buffer, metadata);
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      id,
      name: filename,
      path: folder === 'digital-assets' ? storagePath : downloadUrl,
      size: snapshot.metadata.size,
      mimeType: snapshot.metadata.contentType || mimeType
    };
  }

  /**
   * Saves a stream to Firebase Storage.
   * Note: Client SDK uploadBytes doesn't support Node streams directly.
   * We convert to buffer first or use admin SDK. 
   * For this migration, we'll convert to Buffer for simplicity in the client SDK.
   */
  static async saveStream(
    stream: ReadableStream | AsyncIterable<any>,
    folder: StorageFolder,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    // Convert stream to Buffer
    const chunks = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    return this.saveFile(buffer, folder, filename, mimeType);
  }

  /**
   * Reads a file from Firebase Storage.
   * Returns a Buffer.
   */
  static async readFile(storedPath: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
    let storageRef;
    if (storedPath.startsWith('http')) {
      const url = new URL(storedPath);
      const allowedDomains = ['firebasestorage.googleapis.com', 'shopmore-1e34b.firebasestorage.app'];
      if (!allowedDomains.some(d => url.hostname.endsWith(d))) {
        logger.warn(`[Forensic] Rejected asset read from untrusted external domain: ${url.hostname}`);
        throw new Error('Untrusted asset source.');
      }

      const encodedPath = url.pathname.split('/o/')[1]?.split('/')[0];
      if (!encodedPath) throw new Error('Invalid Firebase Storage URL.');
      const objectPath = decodeURIComponent(encodedPath);
      storageRef = ref(getStorage(), objectPath);
      const arrayBuffer = await getBytes(storageRef, MAX_DOWNLOAD_BYTES);
      const buffer = Buffer.from(arrayBuffer);
      const name = objectPath.split('/').pop() || 'file';
      return { buffer, mimeType: 'application/octet-stream', name };
    } else {
      storageRef = ref(getStorage(), storedPath);
      const arrayBuffer = await getBytes(storageRef, MAX_DOWNLOAD_BYTES);
      const buffer = Buffer.from(arrayBuffer);
      const name = storedPath.split('/').pop() || 'file';
      return { buffer, mimeType: 'application/octet-stream', name };
    }
  }

  /**
   * Deletes a file from Firebase Storage.
   */
  static async deleteFile(storedPath: string): Promise<void> {
    try {
      // If it's a URL, we need to extract the path or use the URL
      // firebase/storage deleteObject accepts a reference
      let storageRef;
      if (storedPath.startsWith('http')) {
         // This is tricky with download URLs. 
         // Ideally we should store the getStorage() path in the DB too.
         // For now, we'll try to extract the path from the URL if possible or just log.
         console.warn('Deleting by URL is not directly supported without path extraction.');
         return;
      } else {
        storageRef = ref(getStorage(), storedPath);
      }
      
      await deleteObject(storageRef);
    } catch (e) {
      console.error(`Failed to delete file at ${storedPath}:`, e);
    }
  }
}
