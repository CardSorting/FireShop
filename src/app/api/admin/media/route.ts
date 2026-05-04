import { NextRequest } from 'next/server';
import { requireAdminSession, jsonError, readJsonObject } from '@infrastructure/server/apiGuards';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await requireAdminSession();
    const storagePath = path.join(process.cwd(), 'public', 'storage');
    
    // Ensure directories exist
    await fs.mkdir(path.join(storagePath, 'products'), { recursive: true });
    await fs.mkdir(path.join(storagePath, 'collections'), { recursive: true });

    const folders = ['products', 'collections'];
    const allFiles: any[] = [];

    for (const folder of folders) {
      const folderPath = path.join(storagePath, folder);
      const files = await fs.readdir(folderPath);

      for (const file of files) {
        if (file === '.gitkeep') continue;
        
        const filePath = path.join(folderPath, file);
        const stats = await fs.stat(filePath);

        allFiles.push({
          id: file,
          name: file,
          url: `/storage/${folder}/${file}`,
          folder,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        });
      }
    }

    // Sort by newest first
    allFiles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return Response.json({ files: allFiles });
  } catch (error) {
    return jsonError(error, 'Failed to list media');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminSession();
    const body = await readJsonObject(req);
    const { url } = body;
    
    if (!url || typeof url !== 'string') return jsonError(new Error('URL required'));

    // Security: Prevent path traversal by ensuring the URL starts with /storage/ and contains no ..
    if (!url.startsWith('/storage/') || url.includes('..')) {
      return jsonError(new Error('Invalid storage path'));
    }

    const filePath = path.join(process.cwd(), 'public', url);
    await fs.unlink(filePath);

    return Response.json({ success: true });
  } catch (error) {
    return jsonError(error, 'Failed to delete media');
  }
}
