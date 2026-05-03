import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '../../../../infrastructure/services/StorageService';
import { getServerServices } from '../../../../infrastructure/server/services';
import { FirestoreDigitalAccessRepository } from '../../../../infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';

// Helper to verify if a user has purchased a specific asset
async function verifyAssetOwnership(userId: string, assetId: string): Promise<string | null> {
  const services = await getServerServices();
  const digitalAssets = await services.orderService.getDigitalAssets(userId);
  
  for (const group of digitalAssets) {
    const asset = group.assets.find(a => a.id === assetId);
    if (asset) return asset.path;
  }

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const assetPath = await verifyAssetOwnership(userId, assetId);
    
    if (!assetPath) {
      return NextResponse.json({ error: 'Access denied or asset not found' }, { status: 403 });
    }

    // Log the access
    const accessRepo = new FirestoreDigitalAccessRepository();
    try {
      await accessRepo.record({
        id: crypto.randomUUID(),
        userId,
        assetId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logErr) {
      console.error('Failed to log digital access:', logErr);
    }

    const { buffer, mimeType, name } = await StorageService.readFile(assetPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download', details: error.message },
      { status: 500 }
    );
  }
}
