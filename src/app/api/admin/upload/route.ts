import { NextRequest } from 'next/server';
import { ImageService, ImageFolder } from '../../../../infrastructure/services/ImageService';
import { StorageService, StorageFolder } from '../../../../infrastructure/services/StorageService';
import { requireAdminSession, jsonError } from '@infrastructure/server/apiGuards';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as StorageFolder) || 'products';

    if (!file) {
      return jsonError(new Error('No file provided'));
    }

    // If it's a digital asset, use the StorageService for private storage with STREAMING
    if (folder === 'digital-assets') {
      const stream = Readable.fromWeb(file.stream() as any);
      const result = await StorageService.saveStream(
        stream,
        folder,
        file.name,
        file.type
      );
      return Response.json(result);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Otherwise, if it's an image, use ImageService for optimization
    if (file.type.startsWith('image/')) {
      // Limit size to 10MB for processed images
      if (file.size > 10 * 1024 * 1024) {
        return jsonError(new Error('Image size exceeds 10MB'));
      }

      const result = await ImageService.processAndSave(
        buffer,
        folder as ImageFolder,
        file.name
      );
      return Response.json(result);
    }

    // Default to raw storage for other public files
    const result = await StorageService.saveFile(
      buffer,
      folder,
      file.name,
      file.type
    );

    return Response.json(result);
  } catch (error: any) {
    return jsonError(error, 'Failed to process upload');
  }
}
