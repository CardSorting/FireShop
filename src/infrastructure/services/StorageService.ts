import { writeFile, mkdir, unlink, readFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type StorageFolder = 'products' | 'collections' | 'general' | 'digital-assets';

export interface StoredFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  private static readonly PUBLIC_ROOT = join(process.cwd(), 'public', 'storage');
  private static readonly PRIVATE_ROOT = join(process.cwd(), 'storage', 'private');

  /**
   * Saves a file to local storage. 
   * If folder is 'digital-assets', it saves to a private (non-public) directory.
   */
  static async saveFile(
    buffer: Buffer,
    folder: StorageFolder,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    const id = randomUUID();
    const extension = filename.split('.').pop() || '';
    const name = `${id.slice(0, 8)}-${filename}`;
    
    const isPrivate = folder === 'digital-assets';
    const baseDir = isPrivate ? this.PRIVATE_ROOT : this.PUBLIC_ROOT;
    const targetDir = join(baseDir, folder);
    const targetPath = join(targetDir, name);
    
    // Relative path for database storage
    // Private files use a special 'private://' prefix or just the path relative to private root
    const storedPath = isPrivate ? `private://${folder}/${name}` : `/storage/${folder}/${name}`;

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, buffer);

    const fileStat = await stat(targetPath);

    return {
      id,
      name: filename,
      path: storedPath,
      size: fileStat.size,
      mimeType
    };
  }

  /**
   * Saves a stream to local storage for high-performance large file handling.
   */
  static async saveStream(
    stream: ReadableStream | AsyncIterable<any>,
    folder: StorageFolder,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    const id = randomUUID();
    const name = `${id.slice(0, 8)}-${filename}`;
    
    const isPrivate = folder === 'digital-assets';
    const baseDir = isPrivate ? this.PRIVATE_ROOT : this.PUBLIC_ROOT;
    const targetDir = join(baseDir, folder);
    const targetPath = join(targetDir, name);
    
    const storedPath = isPrivate ? `private://${folder}/${name}` : `/storage/${folder}/${name}`;

    await mkdir(targetDir, { recursive: true });
    
    await pipeline(stream as any, createWriteStream(targetPath));

    const fileStat = await stat(targetPath);

    return {
      id,
      name: filename,
      path: storedPath,
      size: fileStat.size,
      mimeType
    };
  }

  /**
   * Reads a file from storage.
   */
  static async readFile(storedPath: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
    let localPath: string;
    
    if (storedPath.startsWith('private://')) {
      const relative = storedPath.replace('private://', '');
      localPath = join(this.PRIVATE_ROOT, relative);
    } else {
      localPath = join(process.cwd(), 'public', storedPath);
    }

    const buffer = await readFile(localPath);
    const name = join(localPath).split('/').pop() || 'file';
    
    // In a real app we might store mimeType in DB, but for simplicity we'll infer or assume
    return { buffer, mimeType: 'application/octet-stream', name };
  }

  /**
   * Deletes a file from storage.
   */
  static async deleteFile(storedPath: string): Promise<void> {
    let localPath: string;
    
    if (storedPath.startsWith('private://')) {
      const relative = storedPath.replace('private://', '');
      localPath = join(this.PRIVATE_ROOT, relative);
    } else {
      localPath = join(process.cwd(), 'public', storedPath);
    }

    try {
      await unlink(localPath);
    } catch (e) {
      console.error(`Failed to delete file at ${localPath}:`, e);
    }
  }
}
