import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '../../../../infrastructure/services/StorageService';
import { getServerServices } from '../../../../infrastructure/server/services';
import { FirestoreDigitalAccessRepository } from '../../../../infrastructure/repositories/firestore/FirestoreDigitalAccessRepository';
import { jsonError, requireSessionUser } from '@infrastructure/server/apiGuards';

// Helper to verify if a user has purchased a specific asset
async function verifyAssetOwnership(userId: string, assetId: string): Promise<string | null> {
  const services = await getServerServices();
  const digitalAssets = await services.orderService.getDigitalAssets(userId);
  
  for (const group of digitalAssets) {
    if (!group.assets) continue;
    const asset = group.assets.find((a: any) => a.id === assetId);
    if (asset) return asset.url;
  }

  return null;
}

function safeDownloadName(name: string): string {
  const sanitized = name.replace(/[\r\n"]/g, '').trim();
  return sanitized || 'download';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    const user = await requireSessionUser();

    const assetPath = await verifyAssetOwnership(user.id, assetId);
    
    if (!assetPath) {
      return NextResponse.json({ error: 'Access denied or asset not found' }, { status: 403 });
    }

    // Log the access
    const accessRepo = new FirestoreDigitalAccessRepository();
    try {
      await accessRepo.record({
        id: crypto.randomUUID(),
        userId: user.id,
        assetId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logErr) {
      console.error('Failed to log digital access:', logErr);
    }

    const signedUrl = await StorageService.getSignedUrl(assetPath, 5);

    return NextResponse.redirect(signedUrl, {
      status: 307, // Temporary Redirect
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return jsonError(error, 'Failed to process download');
  }
}
