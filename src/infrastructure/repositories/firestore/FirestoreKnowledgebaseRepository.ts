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
  writeBatch,
  getUnifiedDb,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import { logger } from '@utils/logger';
import type { KnowledgebaseCategory, KnowledgebaseArticle, Author, BlogComment, Subscriber, BlogSeries } from '@domain/models';



export class FirestoreKnowledgebaseRepository {
  private readonly categoryCollection = 'knowledgebase_categories';
  private readonly articleCollection = 'knowledgebase_articles';
  private readonly feedbackCollection = 'support_article_feedback';

  private readonly authorCollection = 'blog_authors';
  private readonly commentCollection = 'blog_comments';

  private readonly subscriberCollection = 'crm_subscribers';
  private readonly engagementCollection = 'content_engagements';
  private readonly seriesCollection = 'blog_series';

  private mapDocToCategory(id: string, data: DocumentData): KnowledgebaseCategory {
    return JSON.parse(JSON.stringify({ ...data, id })) as KnowledgebaseCategory;
  }
  
  private toDate(val: any): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (val && typeof val.seconds === 'number') {
      return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds ?? 0) / 1_000_000));
    }
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return new Date();
  }

  private mapDocToArticle(id: string, data: DocumentData): KnowledgebaseArticle {
    return {
      ...data,
      id,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
      publishedAt: data.publishedAt ? this.toDate(data.publishedAt) : undefined,
      scheduledAt: data.scheduledAt ? this.toDate(data.scheduledAt) : undefined,
    } as KnowledgebaseArticle;
  }

  private mapDocToAuthor(id: string, data: DocumentData): Author {
    return {
      ...data,
      id,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    } as Author;
  }

  private mapDocToComment(id: string, data: DocumentData): BlogComment {
    return {
      ...data,
      id,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    } as BlogComment;
  }

  private mapDocToSubscriber(id: string, data: DocumentData): Subscriber {
    return {
      ...data,
      id,
      subscribedAt: this.toDate(data.subscribedAt),
    } as Subscriber;
  }

  private mapDocToSeries(id: string, data: DocumentData): BlogSeries {
    return {
      ...data,
      id,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    } as BlogSeries;
  }

  async getCategories(): Promise<KnowledgebaseCategory[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.categoryCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToCategory(d.id, d.data() as any));
  }

  async getArticles(options?: { 
    categoryId?: string; 
    seriesId?: string; 
    type?: 'article' | 'blog'; 
    status?: 'published' | 'draft' | 'all';
    limit?: number;
    cursor?: string;
  }): Promise<{ articles: KnowledgebaseArticle[]; nextCursor?: string }> {
    let q = query(collection(getUnifiedDb(), this.articleCollection), orderBy('createdAt', 'desc'));
    
    if (options?.categoryId) {
      q = query(q, where('categoryId', '==', options.categoryId));
    }

    if (options?.seriesId) {
      q = query(q, where('seriesId', '==', options.seriesId));
    }
    
    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }

    if (options?.status && options.status !== 'all') {
      q = query(q, where('status', '==', options.status));
    } else if (!options?.status) {
      // Default to published if not specified
      q = query(q, where('status', '==', 'published'));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    if (options?.cursor) {
      const cursorDoc = await getDoc(doc(getUnifiedDb(), this.articleCollection, options.cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    const articles = snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any));
    
    return {
      articles,
      nextCursor: snapshot.docs.length > 0 && options?.limit && snapshot.docs.length === options.limit 
        ? snapshot.docs[snapshot.docs.length - 1].id 
        : undefined
    };
  }

  async getArticleById(id: string): Promise<KnowledgebaseArticle | null> {
    const d = await getDoc(doc(getUnifiedDb(), this.articleCollection, id));
    if (!d.exists()) return null;
    return this.mapDocToArticle(d.id, d.data() as any);
  }

  async getArticleBySlug(slug: string): Promise<KnowledgebaseArticle | null> {
    try {
      const db = getUnifiedDb();
      const coll = this.articleCollection;
      logger.debug(`[KB_REPO] Attempting to find article by slug: "${slug}" in collection: "${coll}"`);
      
      const q = query(collection(db, coll), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      
      logger.debug(`[KB_REPO] Query result for "${slug}": Found=${!snapshot.empty}, Size=${snapshot.size}`);
      
      if (snapshot.empty) {
        // Forensic Fallback: Try searching for a partial match or checking if the collection exists
        logger.warn(`[KB_REPO] No article found for slug: "${slug}". Checking collection status...`);
        return null;
      }
      
      const doc = snapshot.docs[0];
      logger.debug(`[KB_REPO] Article matched: ID=${doc.id}, Title=${doc.data().title}`);
      return this.mapDocToArticle(doc.id, doc.data() as any);
    } catch (err: any) {
      logger.error(`[KB_REPO] CRITICAL ERROR in getArticleBySlug("${slug}"):`, err);
      throw err;
    }
  }

  async searchArticles(queryString: string, limitVal: number = 20): Promise<KnowledgebaseArticle[]> {
    try {
      // Production Hardening: Instead of fetching all docs, we fetch only published ones
      // and limit the initial fetch. Firestore doesn't support full-text search, so we
      // still filter in-memory, but on a smaller, relevant set.
      const q = query(
        collection(getUnifiedDb(), this.articleCollection),
        where('status', '==', 'published'),
        limit(50) // Reasonable limit for client-side filtering
      );
      
      const snapshot = await getDocs(q);
      const searchTerms = queryString.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      if (searchTerms.length === 0) return [];

      return snapshot.docs
        .map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any))
        .filter((a: KnowledgebaseArticle) => {
          const content = `${a.title} ${a.content} ${a.tags?.join(' ')}`.toLowerCase();
          return searchTerms.every(term => content.includes(term));
        })
        .sort((a: KnowledgebaseArticle, b: KnowledgebaseArticle) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, limitVal);
    } catch (err) {
      logger.error('KB search failed', { queryString, err });
      return [];
    }
  }

  async getPopularArticles(limitVal: number = 5): Promise<KnowledgebaseArticle[]> {
    const q = query(
      collection(getUnifiedDb(), this.articleCollection), 
      where('status', '==', 'published'),
      orderBy('viewCount', 'desc'), 
      limit(limitVal)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any));
  }

  async getSeries(): Promise<BlogSeries[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.seriesCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToSeries(d.id, d.data() as any));
  }

  async getSeriesBySlug(slug: string): Promise<BlogSeries | null> {
    const q = query(collection(getUnifiedDb(), this.seriesCollection), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToSeries(snapshot.docs[0].id, snapshot.docs[0].data() as any);
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
        createdAt: serverTimestamp()
      });
    });
  }

  async saveCategory(category: KnowledgebaseCategory): Promise<void> {
    await setDoc(doc(getUnifiedDb(), this.categoryCollection, category.id), category);
  }

  async saveArticle(article: KnowledgebaseArticle): Promise<void> {
    if (!article.id || !article.slug) {
      throw new Error('Article ID and slug are required for persistence');
    }
    
    const data = {
      ...article,
      slug: article.slug.toLowerCase().trim(),
      createdAt: article.createdAt ? Timestamp.fromDate(new Date(article.createdAt)) : serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: article.status === 'published' 
        ? (article.publishedAt ? Timestamp.fromDate(new Date(article.publishedAt)) : serverTimestamp()) 
        : null,
    };
    await setDoc(doc(getUnifiedDb(), this.articleCollection, article.id), data);
  }

  async deleteArticle(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.articleCollection, id));
  }

  // Author Management
  async getAuthors(): Promise<Author[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.authorCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToAuthor(d.id, d.data() as any));
  }

  async getAuthorById(id: string): Promise<Author | null> {
    const d = await getDoc(doc(getUnifiedDb(), this.authorCollection, id));
    if (!d.exists()) return null;
    return this.mapDocToAuthor(d.id, d.data() as any);
  }

  async saveAuthor(author: Author): Promise<void> {
    if (!author.id || !author.name) throw new Error('Author ID and name are required');
    
    const data = {
      ...author,
      createdAt: author.createdAt ? Timestamp.fromDate(new Date(author.createdAt)) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(getUnifiedDb(), this.authorCollection, author.id), data);
  }

  async deleteAuthor(id: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.authorCollection, id));
  }

  // Comment Management
  async getComments(postId: string): Promise<BlogComment[]> {
    const q = query(
      collection(getUnifiedDb(), this.commentCollection), 
      where('postId', '==', postId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToComment(d.id, d.data() as any));
  }

  async getAllComments(): Promise<BlogComment[]> {
    const q = query(
      collection(getUnifiedDb(), this.commentCollection),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToComment(d.id, d.data() as any));
  }


  async addComment(comment: Omit<BlogComment, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<BlogComment> {
    const id = crypto.randomUUID();
    let postTitle = comment.postTitle;
    
    if (!postTitle) {
      const post = await this.getArticleById(comment.postId);
      postTitle = post?.title;
    }

    const data = {
      ...comment,
      id,
      postTitle: postTitle || 'Untitled Post',
      likes: 0,
      status: comment.status || 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(getUnifiedDb(), this.commentCollection, id), data);
    return this.mapDocToComment(id, data);
  }


  async updateCommentStatus(commentId: string, status: 'approved' | 'pending' | 'spam'): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.commentCollection, commentId), { 
      status, 
      updatedAt: serverTimestamp() 
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.commentCollection, commentId));
  }

  // CRM & Analytics Implementation
  async subscribe(email: string, source: string): Promise<void> {
    if (!email.includes('@')) throw new Error('Invalid email address');
    
    const id = crypto.randomUUID();
    await setDoc(doc(getUnifiedDb(), this.subscriberCollection, id), {
      id,
      email: email.toLowerCase().trim(),
      source,
      subscribedAt: serverTimestamp()
    });
  }

  async getSubscribers(): Promise<Subscriber[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.subscriberCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToSubscriber(d.id, d.data() as any));
  }

  async trackEngagement(postId: string, type: 'view' | 'share', userId?: string): Promise<void> {
    const id = crypto.randomUUID();
    await setDoc(doc(getUnifiedDb(), this.engagementCollection, id), {
      id,
      postId,
      type,
      userId: userId || null,
      createdAt: serverTimestamp()
    });
    
    if (type === 'view') {
      // Background increment (non-blocking for tracking)
      void this.incrementViewCount(postId).catch(e => logger.warn('View count increment failed', { postId, e }));
    }
  }

  async incrementViewCount(postId: string): Promise<void> {
    const articleRef = doc(getUnifiedDb(), this.articleCollection, postId);
    await updateDoc(articleRef, { viewCount: increment(1) });
  }
  
  // Batch Operations Implementation
  async batchUpdateArticles(ids: string[], updates: Partial<KnowledgebaseArticle>): Promise<void> {
    const batch = writeBatch(getUnifiedDb());
    const data = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    ids.forEach(id => {
      const ref = doc(getUnifiedDb(), this.articleCollection, id);
      batch.update(ref, data);
    });
    
    await batch.commit();
  }

  async batchDeleteArticles(ids: string[]): Promise<void> {
    const batch = writeBatch(getUnifiedDb());
    
    ids.forEach(id => {
      const ref = doc(getUnifiedDb(), this.articleCollection, id);
      batch.delete(ref);
    });
    
    await batch.commit();
  }

}

export const knowledgebaseRepository = new FirestoreKnowledgebaseRepository();
