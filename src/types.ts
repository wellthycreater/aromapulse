// 아로마펄스 타입 정의

export type UserType = 'B2C' | 'B2B' | 'Unknown';
export type B2CStressType = 'daily' | 'work';
export type B2BBusinessType = 'perfumer' | 'company' | 'shop';

export type ProductConcept = 'symptom_care' | 'refresh';
export type ProductCareType = 'custom' | 'ready_made';
export type ProductCategory = '룸스프레이' | '디퓨저' | '향수' | '섬유향수' | '캔들' | '섬유탈취제';
export type ProductStatus = 'active' | 'preparing' | 'inactive';

export type Symptom = '불면' | '우울' | '불안' | '스트레스';
export type ReviewSentiment = 'positive' | 'negative' | 'neutral';
export type ReviewIntent = '관심' | '문의' | '체험후기' | '구매의향';
export type ReviewSource = 'blog' | 'platform';

export type PatchApplicationStatus = 'pending' | 'approved' | 'shipped' | 'completed';
export type SurveyType = 'before' | 'after';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  user_type: UserType;
  b2c_stress_type?: B2CStressType;
  b2b_business_type?: B2BBusinessType;
  region?: string;
  symptoms?: Symptom[];
  interests?: string[];
  source?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  type: ProductCategory;
  concept: ProductConcept;
  care_type?: ProductCareType;
  brand?: string;
  volume?: string;
  description?: string;
  symptoms?: Symptom[];
  region?: string;
  price: number;
  stock: number;
  is_b2b: number;
  b2b_available: number;
  workshop_available?: number;
  supplier_name?: string;
  supplier_contact?: string;
  main_image?: string;
  detail_image?: string;
  image_url?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface Workshop {
  id: number;
  name: string;
  region: string;
  type?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  user_id?: number;
  post_id?: number;
  content: string;
  rating?: number;
  source: ReviewSource;
  source_url?: string;
  sentiment?: ReviewSentiment;
  intent?: ReviewIntent;
  keywords?: string[];
  auto_user_type?: UserType;
  is_tagged: number;
  created_at: string;
}

export interface BlogPost {
  id: number;
  post_id: string;
  title: string;
  content?: string;
  link: string;
  published_at?: string;
  category?: string;
  tags?: string[];
  view_count: number;
  comment_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: number;
  comment_id?: string;
  post_id: number;
  author_name?: string;
  author_id?: string;
  content: string;
  parent_id?: number;
  is_secret: number;
  like_count: number;
  sentiment?: ReviewSentiment;
  intent?: ReviewIntent;
  keywords?: string[];
  is_tagged: number;
  created_at: string;
  imported_at: string;
}

export interface PatchApplication {
  id: number;
  user_id?: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  symptoms?: Symptom[];
  notes?: string;
  status: PatchApplicationStatus;
  created_at: string;
  processed_at?: string;
}

export interface Survey {
  id: number;
  user_id?: number;
  application_id?: number;
  survey_type: SurveyType;
  stress_level?: number;
  sleep_quality?: number;
  anxiety_level?: number;
  depression_level?: number;
  feedback?: string;
  created_at: string;
}

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

// Cloudflare Bindings
export type Bindings = {
  DB: D1Database;
};
