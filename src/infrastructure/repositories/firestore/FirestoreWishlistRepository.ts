/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Wishlist Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query, 
  where, 
  limit, 
  Timestamp,
  arrayUnion,
  arrayRemove,
  getUnifiedDb,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { IWishlistRepository } from '@domain/repositories';
import type { Wishlist, Product } from '@domain/models';
import { mapDoc } from './utils';
import { FirestoreProductRepository } from './FirestoreProductRepository';

export class FirestoreWishlistRepository implements IWishlistRepository {
  private readonly collectionName = 'wishlists';
  private productRepo = new FirestoreProductRepository();

  private mapDocToWishlist(id: string, data: DocumentData): Wishlist {
    return mapDoc<Wishlist>(id, data);
  }

  async getByUserId(userId: string): Promise<Wishlist[]> {
    const q = query(collection(getUnifiedDb(), this.collectionName), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToWishlist(d.id, d.data() as any));
  }

  async getById(id: string): Promise<Wishlist | null> {
    const docSnap = await getDoc(doc(getUnifiedDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToWishlist(docSnap.id, docSnap.data() as any);
  }

  async create(wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wishlist> {
    const id = crypto.randomUUID();
    const now = serverTimestamp();
    const data = {
      ...wishlist,
      itemIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(getUnifiedDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async update(id: string, name: string): Promise<Wishlist> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, id), { 
      name, 
      updatedAt: serverTimestamp() 
    });
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.collectionName, id));
  }

  async addItem(wishlistId: string, productId: string): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, wishlistId), {
      itemIds: arrayUnion(productId),
      updatedAt: serverTimestamp()
    });
  }

  async removeItem(wishlistId: string, productId: string): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.collectionName, wishlistId), {
      itemIds: arrayRemove(productId),
      updatedAt: serverTimestamp()
    });
  }

  async getItems(wishlistId: string): Promise<Product[]> {
    const wishlist = await this.getById(wishlistId);
    if (!wishlist || !wishlist.itemIds || wishlist.itemIds.length === 0) return [];
    
    // Batch get products
    const products = await Promise.all(
      wishlist.itemIds.map((id: string) => this.productRepo.getById(id))
    );
    return products.filter((p: Product | null): p is Product => p !== null);
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlists = await this.getByUserId(userId);
    return wishlists.some(w => w.itemIds?.includes(productId));
  }
}
