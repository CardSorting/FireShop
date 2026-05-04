/**
 * [LAYER: INFRASTRUCTURE]
 * Firestore Implementation of Knowledgebase Repository
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
  orderBy, 
  limit, 
  increment,
  Timestamp,
  runTransaction,
  getUnifiedDb,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { KnowledgebaseCategory, KnowledgebaseArticle } from '@domain/models';

export class FirestoreKnowledgebaseRepository {
  private readonly categoryCollection = 'knowledgebase_categories';
  private readonly articleCollection = 'knowledgebase_articles';
  private readonly feedbackCollection = 'support_article_feedback';

  private mapDocToCategory(id: string, data: DocumentData): KnowledgebaseCategory {
    return { ...data, id } as KnowledgebaseCategory;
  }

  private mapDocToArticle(id: string, data: DocumentData): KnowledgebaseArticle {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as KnowledgebaseArticle;
  }

  async getCategories(): Promise<KnowledgebaseCategory[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.categoryCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToCategory(d.id, d.data() as any));
  }

  async getArticles(categoryId?: string): Promise<KnowledgebaseArticle[]> {
    let q = query(collection(getUnifiedDb(), this.articleCollection), orderBy('createdAt', 'desc'));
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any));
  }

  async getArticleBySlug(slug: string): Promise<KnowledgebaseArticle | null> {
    const q = query(collection(getUnifiedDb(), this.articleCollection), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToArticle(snapshot.docs[0].id, snapshot.docs[0].data() as any);
  }

  async searchArticles(queryString: string): Promise<KnowledgebaseArticle[]> {
    // Firestore doesn't support 'like' queries. 
    // For now, we'll fetch all and filter in memory or just use a simple prefix match if appropriate.
    // For this migration, memory filter is easiest.
    const snapshot = await getDocs(collection(getUnifiedDb(), this.articleCollection));
    const q = queryString.toLowerCase();
    return snapshot.docs
      .map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any))
      .filter((a: KnowledgebaseArticle) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
      .sort((a: KnowledgebaseArticle, b: KnowledgebaseArticle) => (b.viewCount || 0) - (a.viewCount || 0));
  }

  async getPopularArticles(limitVal: number = 5): Promise<KnowledgebaseArticle[]> {
    const q = query(collection(getUnifiedDb(), this.articleCollection), orderBy('viewCount', 'desc'), limit(limitVal));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any));
  }

  async addFeedback(articleId: string, isHelpful: boolean, userId?: string): Promise<void> {
    await runTransaction(getUnifiedDb(), async (transaction) => {
      const articleRef = doc(getUnifiedDb(), this.articleCollection, articleId);
      const field = isHelpful ? 'helpfulCount' : 'notHelpfulCount';
      transaction.update(articleRef, { [field]: increment(1) });

      const feedbackId = crypto.randomUUID();
      const feedbackRef = doc(getUnifiedDb(), this.feedbackCollection, feedbackId);
      transaction.set(feedbackRef, {
        id: feedbackId,
        articleId,
        isHelpful: isHelpful ? 1 : 0,
        userId: userId || null,
        createdAt: Timestamp.now()
      });
    });
  }

  async saveCategory(category: KnowledgebaseCategory): Promise<void> {
    await setDoc(doc(getUnifiedDb(), this.categoryCollection, category.id), category);
  }

  async saveArticle(article: KnowledgebaseArticle): Promise<void> {
    const data = {
      ...article,
      createdAt: article.createdAt ? Timestamp.fromDate(new Date(article.createdAt)) : Timestamp.now(),
      updatedAt: article.updatedAt ? Timestamp.fromDate(new Date(article.updatedAt)) : Timestamp.now(),
    };
    await setDoc(doc(getUnifiedDb(), this.articleCollection, article.id), data);
  }
}

export const knowledgebaseRepository = new FirestoreKnowledgebaseRepository();
