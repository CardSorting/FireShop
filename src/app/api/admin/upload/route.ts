import { NextRequest } from 'next/server';
import { ImageService, ImageFolder } from '../../../../infrastructure/services/ImageService';
import { StorageService, StorageFolder } from '../../../../infrastructure/services/StorageService';
import { requireAdminSession, jsonError } from '@infrastructure/server/apiGuards';
import { Readable } from 'node:stream';

function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and other dangerous symbols
  const base = filename.split(/[/\\]/).pop() || 'upload';
  return base.replace(/[^a-zA-Z0-9.-]/g, '_');
}

const ALLOWED_EXTENSIONS = new Set(['pdf', 'zip', 'txt', 'csv', 'json', 'mp4', 'mov', 'webp', 'jpg', 'jpeg', 'png', 'svg', 'gif']);
const ALLOWED_FOLDERS = new Set<StorageFolder>(['products', 'collections', 'general', 'digital-assets']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PUBLIC_FILE_BYTES = 25 * 1024 * 1024;
const MAX_DIGITAL_ASSET_BYTES = 100 * 1024 * 1024;

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as StorageFolder) || 'products';

    if (!file) {
      return jsonError(new Error('No file provided'));
    }
    if (!ALLOWED_FOLDERS.has(folder)) {
      return jsonError(new Error('Invalid upload folder.'));
    }

    const cleanName = sanitizeFilename(file.name);
    const ext = cleanName.split('.').pop()?.toLowerCase() || '';

    // Production Hardening: PREVENT MIME-TYPE SPOOFING
    // Ensure the extension matches the provided mime-type to prevent Stored XSS (e.g. .html as .pdf)
    const mimeMap: Record<string, string[]> = {
      'pdf': ['application/pdf'],
      'zip': ['application/zip', 'application/x-zip-compressed'],
      'webp': ['image/webp'],
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'svg': ['image/svg+xml'],
      'mp4': ['video/mp4'],
      'mov': ['video/quicktime'],
      'csv': ['text/csv'],
      'json': ['application/json'],
      'txt': ['text/plain']
    };

    if (mimeMap[ext] && !mimeMap[ext].includes(file.type)) {
       return jsonError(new Error(`Security mismatch: Extension .${ext} does not match file type ${file.type}`));
    }

    // Production Hardening: Restrict non-image file extensions to prevent malicious uploads (e.g., .html, .php, .js)
    if (!file.type.startsWith('image/') && !ALLOWED_EXTENSIONS.has(ext)) {
      return jsonError(new Error(`File extension .${ext} is not allowed for security reasons.`));
    }

    // If it's a digital asset, use the StorageService for private storage with STREAMING
    if (folder === 'digital-assets') {
      if (file.size > MAX_DIGITAL_ASSET_BYTES) {
        return jsonError(new Error('Digital asset size exceeds 100MB'));
      }
      const stream = Readable.fromWeb(file.stream() as any);
      const result = await StorageService.saveStream(
        stream,
        folder,
        cleanName,
        file.type
      );
      return Response.json(result);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Otherwise, if it's an image, use ImageService for optimization
    if (file.type.startsWith('image/')) {
      // Limit size to 10MB for processed images
      if (file.size > MAX_IMAGE_BYTES) {
        return jsonError(new Error('Image size exceeds 10MB'));
      }

      const result = await ImageService.processAndSave(
        buffer,
        folder as ImageFolder,
        cleanName
      );
      return Response.json(result);
    }

    // Default to raw storage for other public files
    if (file.size > MAX_PUBLIC_FILE_BYTES) {
      return jsonError(new Error('File size exceeds 25MB'));
    }
    const result = await StorageService.saveFile(
      buffer,
      folder,
      cleanName,
      file.type
    );

    return Response.json(result);
  } catch (error: any) {
    return jsonError(error, 'Failed to process upload');
  }
}
