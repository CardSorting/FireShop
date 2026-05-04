import type { KnowledgebaseArticle, Author, KnowledgebaseCategory } from '@domain/models';

export interface AdminBlogFormProps {
  initialData?: Partial<KnowledgebaseArticle>;
}

export type EditorTab = 'publish' | 'seo' | 'social' | 'history';

export interface EditorState {
  formData: Partial<KnowledgebaseArticle>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<KnowledgebaseArticle>>>;
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  isSubmitting: boolean;
  authors: Author[];
  categories: KnowledgebaseCategory[];
  wordCount: number;
  readingTime: number;
}
