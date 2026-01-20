export interface TranslationData {
  title: string;
  content: string;
  timestamp: number; // To check if translation is stale compared to lastUpdated
}

export interface Article {
  id: string;
  categoryId: string;
  title: string;
  content: string; // Markdown content (Original / PT)
  lastUpdated: number;
  // Cache translations by language code (e.g., 'JA', 'EN-US')
  translations?: Record<string, TranslationData>; 
}

export interface Category {
  id: string;
  name: string;
}

export type ViewMode = 'view' | 'edit';
export type Language = 'PT' | 'JA' | 'EN-US';
