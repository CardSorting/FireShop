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
  type DocumentData,
  type QueryDocumentSnapshot
} from '../../firebase/bridge';
import type { KnowledgebaseCategory, KnowledgebaseArticle, Author, BlogComment, Subscriber } from '@domain/models';



export class FirestoreKnowledgebaseRepository {
  private readonly categoryCollection = 'knowledgebase_categories';
  private readonly articleCollection = 'knowledgebase_articles';
  private readonly feedbackCollection = 'support_article_feedback';

  private readonly authorCollection = 'blog_authors';
  private readonly commentCollection = 'blog_comments';

  private readonly subscriberCollection = 'crm_subscribers';
  private readonly engagementCollection = 'content_engagements';

  private mapDocToCategory(id: string, data: DocumentData): KnowledgebaseCategory {
    return { ...data, id } as KnowledgebaseCategory;
  }

  private mapDocToArticle(id: string, data: DocumentData): KnowledgebaseArticle {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : (data.publishedAt ? new Date(data.publishedAt) : undefined),
    } as KnowledgebaseArticle;
  }

  private mapDocToAuthor(id: string, data: DocumentData): Author {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Author;
  }

  private mapDocToComment(id: string, data: DocumentData): BlogComment {
    return {
      ...data,
      id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as BlogComment;
  }

  private mapDocToSubscriber(id: string, data: DocumentData): Subscriber {
    return {
      ...data,
      id,
      subscribedAt: data.subscribedAt instanceof Timestamp ? data.subscribedAt.toDate() : new Date(data.subscribedAt),
    } as Subscriber;
  }

  async getCategories(): Promise<KnowledgebaseCategory[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.categoryCollection));
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToCategory(d.id, d.data() as any));
  }

  async getArticles(options?: { categoryId?: string; type?: 'article' | 'blog'; status?: 'published' | 'draft' | 'all' }): Promise<KnowledgebaseArticle[]> {
    let q = query(collection(getUnifiedDb(), this.articleCollection), orderBy('createdAt', 'desc'));
    
    if (options?.categoryId) {
      q = query(q, where('categoryId', '==', options.categoryId));
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

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any));
  }

  async getArticleById(id: string): Promise<KnowledgebaseArticle | null> {
    const d = await getDoc(doc(getUnifiedDb(), this.articleCollection, id));
    if (!d.exists()) return null;
    return this.mapDocToArticle(d.id, d.data() as any);
  }

  async getArticleBySlug(slug: string): Promise<KnowledgebaseArticle | null> {
    const q = query(collection(getUnifiedDb(), this.articleCollection), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return this.mapDocToArticle(snapshot.docs[0].id, snapshot.docs[0].data() as any);
  }

  async searchArticles(queryString: string): Promise<KnowledgebaseArticle[]> {
    const snapshot = await getDocs(collection(getUnifiedDb(), this.articleCollection));
    const q = queryString.toLowerCase();
    return snapshot.docs
      .map((d: QueryDocumentSnapshot) => this.mapDocToArticle(d.id, d.data() as any))
      .filter((a: KnowledgebaseArticle) => 
        a.status === 'published' && 
        (a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q)))
      )
      .sort((a: KnowledgebaseArticle, b: KnowledgebaseArticle) => (b.viewCount || 0) - (a.viewCount || 0));
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
      updatedAt: Timestamp.now(),
      publishedAt: article.publishedAt ? Timestamp.fromDate(new Date(article.publishedAt)) : (article.status === 'published' ? Timestamp.now() : null),
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
    const data = {
      ...author,
      createdAt: author.createdAt ? Timestamp.fromDate(new Date(author.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
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
      postTitle,
      likes: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(doc(getUnifiedDb(), this.commentCollection, id), data);
    return this.mapDocToComment(id, data);
  }


  async updateCommentStatus(commentId: string, status: 'published' | 'spam'): Promise<void> {
    await updateDoc(doc(getUnifiedDb(), this.commentCollection, commentId), { status, updatedAt: Timestamp.now() });
  }

  async deleteComment(commentId: string): Promise<void> {
    await deleteDoc(doc(getUnifiedDb(), this.commentCollection, commentId));
  }

  // CRM & Analytics Implementation
  async subscribe(email: string, source: string): Promise<void> {
    const id = crypto.randomUUID();
    await setDoc(doc(getUnifiedDb(), this.subscriberCollection, id), {
      id,
      email,
      source,
      subscribedAt: Timestamp.now()
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
      createdAt: Timestamp.now()
    });
    
    if (type === 'view') {
      await this.incrementViewCount(postId);
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
      updatedAt: Timestamp.now()
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
