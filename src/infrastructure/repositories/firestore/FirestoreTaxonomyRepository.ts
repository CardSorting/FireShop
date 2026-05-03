/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Taxonomy Repository
 */
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { ITaxonomyRepository } from '@domain/repositories';
import type { ProductCategory, ProductType } from '@domain/models';

import { mapDoc } from './utils';

export class FirestoreTaxonomyRepository implements ITaxonomyRepository {
  private readonly categoriesCollection = 'product_categories';
  private readonly typesCollection = 'product_types';

  // Categories
  async getAllCategories(): Promise<ProductCategory[]> {
    const snapshot = await getDocs(collection(db, this.categoriesCollection));
    return snapshot.docs.map(d => mapDoc<ProductCategory>(d.id, d.data()));
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    const docSnap = await getDoc(doc(db, this.categoriesCollection, id));
    if (!docSnap.exists()) return null;
    return mapDoc<ProductCategory>(docSnap.id, docSnap.data());
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    const q = query(collection(db, this.categoriesCollection), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return mapDoc<ProductCategory>(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  async saveCategory(category: ProductCategory): Promise<ProductCategory> {
    const id = category.id || crypto.randomUUID();
    const data = {
      ...category,
      id,
      updatedAt: Timestamp.now(),
      createdAt: category.createdAt ? Timestamp.fromDate(new Date(category.createdAt)) : Timestamp.now()
    };
    await setDoc(doc(db, this.categoriesCollection, id), data);
    return (await this.getCategoryById(id))!;
  }

  async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, this.categoriesCollection, id));
  }

  // Types
  async getAllTypes(): Promise<ProductType[]> {
    const snapshot = await getDocs(collection(db, this.typesCollection));
    return snapshot.docs.map(d => mapDoc<ProductType>(d.id, d.data()));
  }

  async getTypeById(id: string): Promise<ProductType | null> {
    const docSnap = await getDoc(doc(db, this.typesCollection, id));
    if (!docSnap.exists()) return null;
    return mapDoc<ProductType>(docSnap.id, docSnap.data());
  }

  async saveType(type: ProductType): Promise<ProductType> {
    const id = type.id || crypto.randomUUID();
    const data = {
      ...type,
      id,
      updatedAt: Timestamp.now(),
      createdAt: type.createdAt ? Timestamp.fromDate(new Date(type.createdAt)) : Timestamp.now()
    };
    await setDoc(doc(db, this.typesCollection, id), data);
    return (await this.getTypeById(id))!;
  }

  async deleteType(id: string): Promise<void> {
    await deleteDoc(doc(db, this.typesCollection, id));
  }
}
