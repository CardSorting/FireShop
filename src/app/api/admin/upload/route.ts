import { NextRequest, NextResponse } from 'next/server';
import { ImageService, ImageFolder } from '../../../../infrastructure/services/ImageService';
import { StorageService, StorageFolder } from '../../../../infrastructure/services/StorageService';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as StorageFolder) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
      return NextResponse.json(result);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Otherwise, if it's an image, use ImageService for optimization
    if (file.type.startsWith('image/')) {
      // Limit size to 10MB for processed images
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size exceeds 10MB' }, { status: 400 });
      }

      const result = await ImageService.processAndSave(
        buffer,
        folder as ImageFolder,
        file.name
      );
      return NextResponse.json(result);
    }

    // Default to raw storage for other public files
    const result = await StorageService.saveFile(
      buffer,
      folder,
      file.name,
      file.type
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: error.message },
      { status: 500 }
    );
  }
}
