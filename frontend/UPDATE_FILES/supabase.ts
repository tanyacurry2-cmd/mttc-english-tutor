import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvezdpkcxcpypusgfndl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZXpkcGtjeGNweXB1c2dmbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDYxMDksImV4cCI6MjA4MzI4MjEwOX0.-GPHMgYe2eTgfAuI7ZK8dAEXGmgJEIVyB4JLO3ZJz9s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface MCQRow {
  id: string;
  subarea: string;
  objective: string;
  stem: string;
  options: string[];
  correct_index: number;
  rationales: string[];
  difficulty: number;
  assessment: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FlashcardRow {
  id: string;
  subarea: string;
  objective: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: number;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}
