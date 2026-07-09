import { createBrowserClient as ssrCreateBrowserClient } from "@supabase/ssr";

// ─── Browser client (for React components) ────────────────
export const createClientComponentClient = () => {
  return ssrCreateBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const createBrowserClient = createClientComponentClient;

// ─── Database Types ───────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan: "free" | "one_time" | "monthly";
          analyses_used: number;
          analyses_limit: number;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          result_json: string;
          target_role: string | null;
          resume_text: string | null;
          job_description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["analyses"]["Row"], "id" | "created_at">;
        Update: never;
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_role: string | null;
          target_company: string | null;
          resume_text: string;
          job_description: string | null;
          last_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["resumes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["resumes"]["Insert"]>;
      };
    };
  };
};
