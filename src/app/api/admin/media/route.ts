import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
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

    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error('Failed to list media:', error);
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const filePath = path.join(process.cwd(), 'public', url);
    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
