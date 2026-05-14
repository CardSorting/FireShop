
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/infrastructure/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * [LAYER: API]
 * Reviews API: Fetch and create reviews for a specific product.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Fetch reviews from Firestore
    let snapshot;
    let isFallback = false;
    try {
      snapshot = await adminDb
        .collection('reviews')
        .where('productId', '==', productId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (err: any) {
      // Fallback for missing index: query without ordering and sort in-memory
      if (err?.code === 400 || String(err).includes('index')) {
        console.warn('Reviews query failed (missing index), falling back to in-memory sort');
        isFallback = true;
        snapshot = await adminDb
          .collection('reviews')
          .where('productId', '==', productId)
          .where('status', '==', 'published')
          .get();
      } else {
        throw err;
      }
    }

    interface Review {
      id: string;
      createdAt: string;
      [key: string]: any;
    }

    let reviews: Review[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        replies: (data.replies || []).map((reply: any) => ({
          ...reply,
          createdAt: reply.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }))
      };
    });

    // Manual sort if we hit the fallback
    if (isFallback) {
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ reviews: [] }); // Return empty array on error to avoid breaking UI
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const now = Timestamp.now();

    const reviewData = {
      ...body,
      productId,
      status: 'published', // Auto-publish for now
      helpfulCount: 0,
      createdAt: now,
      updatedAt: now,
      replies: []
    };

    const docRef = await adminDb.collection('reviews').add(reviewData);

    return NextResponse.json({
      ...reviewData,
      id: docRef.id,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString()
    });
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { reviewId, action } = await request.json();

    if (action === 'vote_helpful') {
      const reviewRef = adminDb.collection('reviews').doc(reviewId);
      const doc = await reviewRef.get();
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      await reviewRef.update({
        helpfulCount: (doc.data()?.helpfulCount || 0) + 1,
        updatedAt: Timestamp.now()
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
