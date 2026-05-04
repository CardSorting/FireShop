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
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  arrayUnion,
  arrayRemove,
  type DocumentData
} from 'firebase/firestore';
import { getDb } from '../../firebase/firebase';
import type { IWishlistRepository } from '@domain/repositories';
import type { Wishlist, Product } from '@domain/models';
import { FirestoreProductRepository } from './FirestoreProductRepository';

export class FirestoreWishlistRepository implements IWishlistRepository {
  private readonly collectionName = 'wishlists';
  private productRepo = new FirestoreProductRepository();

  private mapDocToWishlist(id: string, data: DocumentData): Wishlist {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Wishlist;
  }

  async getByUserId(userId: string): Promise<Wishlist[]> {
    const q = query(collection(getDb(), this.collectionName), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => this.mapDocToWishlist(d.id, d.data()));
  }

  async getById(id: string): Promise<Wishlist | null> {
    const docSnap = await getDoc(doc(getDb(), this.collectionName, id));
    if (!docSnap.exists()) return null;
    return this.mapDocToWishlist(docSnap.id, docSnap.data());
  }

  async create(wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wishlist> {
    const id = crypto.randomUUID();
    const now = Timestamp.now();
    const data = {
      ...wishlist,
      itemIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(getDb(), this.collectionName, id), data);
    return (await this.getById(id))!;
  }

  async update(id: string, name: string): Promise<Wishlist> {
    await updateDoc(doc(getDb(), this.collectionName, id), { name, updatedAt: Timestamp.now() });
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getDb(), this.collectionName, id));
  }

  async addItem(wishlistId: string, productId: string): Promise<void> {
    await updateDoc(doc(getDb(), this.collectionName, wishlistId), {
      itemIds: arrayUnion(productId),
      updatedAt: Timestamp.now()
    });
  }

  async removeItem(wishlistId: string, productId: string): Promise<void> {
    await updateDoc(doc(getDb(), this.collectionName, wishlistId), {
      itemIds: arrayRemove(productId),
      updatedAt: Timestamp.now()
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
