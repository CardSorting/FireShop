import sharp from 'sharp';
import { StorageService } from './StorageService';

export type ImageFolder = 'products' | 'collections' | 'general';

export interface ProcessedImage {
  path: string;
  width: number;
  height: number;
  size: number;
}

export class ImageService {
  private static readonly MAX_WIDTH = 1200;
  private static readonly QUALITY = 80;

  /**
   * Processes a raw image buffer, converts to WebP, resizes, and saves to Firebase Storage.
   */
  static async processAndSave(
    buffer: Buffer,
    folder: ImageFolder = 'products',
    filename?: string
  ): Promise<ProcessedImage> {
    const name = filename 
      ? `${filename.split('.')[0]}.webp` 
      : `image-${Date.now()}.webp`;
    
    // Process with Sharp
    const pipeline = sharp(buffer)
      .resize({
        width: this.MAX_WIDTH,
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: this.QUALITY })
      .rotate(); // Auto-rotate based on EXIF

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    // Save to Firebase Storage via StorageService
    const result = await StorageService.saveFile(data, folder, name, 'image/webp');

    return {
      path: result.path,
      width: info.width,
      height: info.height,
      size: info.size,
    };
  }

  /**
   * Deletes an image from storage
   */
  static async delete(path: string): Promise<void> {
    await StorageService.deleteFile(path);
  }
}
