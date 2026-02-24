export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  school_name: string | null;
  role: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UploadedPaper {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  board: string | null;
  status: string;
  grade_level: string | null;
  subject: string | null;
  topics_json: string | null;
  error_message: string | null;
  question_count: number;
  created_at: string;
}

export interface ExtractedQuestion {
  id: number;
  paper_id: number;
  question_text: string;
  answer_text: string | null;
  question_type: string;
  difficulty: string;
  board: string | null;
  grade_level: string | null;
  subject: string | null;
  topic: string | null;
  marks: number | null;
  options_json: string | null;
  correct_option: string | null;
  bloom_level: string | null;
  order_in_paper: number;
}

export interface QuestionStats {
  total_questions: number;
  by_type: Record<string, number>;
  by_difficulty: Record<string, number>;
  by_subject: Record<string, number>;
  by_grade: Record<string, number>;
  by_board: Record<string, number>;
}

export interface GeneratedPaper {
  id: number;
  title: string;
  status: string;
  board: string | null;
  grade_level: string | null;
  subject: string | null;
  topics_json: string | null;
  difficulty_mix_json: string | null;
  total_marks: number | null;
  duration_minutes: number | null;
  content_markdown: string | null;
  answer_key_markdown: string | null;
  error_message: string | null;
  created_at: string;
}

export interface GeneratedPaperListItem {
  id: number;
  title: string;
  status: string;
  board: string | null;
  grade_level: string | null;
  subject: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: number;
  generated_paper_id: number;
  role: string;
  content: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_admins: number;
  total_papers_uploaded: number;
  total_questions: number;
  total_papers_generated: number;
  recent_users: User[];
}

export interface UserPaperItem {
  id: number;
  original_filename: string;
  board: string | null;
  grade_level: string | null;
  subject: string | null;
  status: string;
  question_count: number;
  created_at: string;
}

export interface UserGeneratedItem {
  id: number;
  title: string;
  board: string | null;
  grade_level: string | null;
  subject: string | null;
  status: string;
  created_at: string;
}

export interface UserDetail {
  id: number;
  email: string;
  username: string;
  full_name: string;
  school_name: string | null;
  role: string;
  plain_password: string | null;
  created_at: string;
  papers_uploaded: number;
  questions_extracted: number;
  papers_generated: number;
  uploaded_papers: UserPaperItem[];
  generated_papers: UserGeneratedItem[];
}

export interface GeneratePaperRequest {
  title: string;
  board: string;
  grade_level: string;
  subject: string;
  topics?: string[];
  question_types?: string[];
  difficulty_mix?: Record<string, number>;
  total_marks?: number;
  duration_minutes?: number;
  additional_instructions?: string;
}
