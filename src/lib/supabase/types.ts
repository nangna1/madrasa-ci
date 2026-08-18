// Types écrits à la main en miroir de supabase/migrations/0001_init.sql,
// dans la forme attendue par @supabase/supabase-js (Row/Insert/Update/
// Relationships par table, plus Views/Functions/Enums/CompositeTypes).
// À régénérer avec `supabase gen types typescript` une fois le projet
// Supabase créé, pour rester synchronisé avec le schéma réel.

export type SchoolStatus = "non_integree" | "en_cours" | "integree";
export type ProfileRole = "teacher" | "federation_admin";
export type MemoStatus = "todo" | "wip" | "ok";
export type PaymentStatus = "paid" | "pending" | "unpaid";
export type MessageStatus = "draft" | "sent" | "failed";
export type SubjectCategory = "coranique" | "national";

export interface Database {
  public: {
    Tables: {
      federations: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          region: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["federations"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["federations"]["Row"]>;
        Relationships: [];
      };
      schools: {
        Row: {
          id: string;
          federation_id: string | null;
          name: string;
          name_ar: string | null;
          region: string;
          status: SchoolStatus;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> & {
          name: string;
          region: string;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string;
          phone: string | null;
          school_id: string | null;
          federation_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          role: ProfileRole;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          teacher_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          school_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };
      class_schedule_slots: {
        Row: {
          id: string;
          class_id: string;
          jour: number;
          heure_debut: string;
          heure_fin: string;
          subject_code: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["class_schedule_slots"]["Row"]> & {
          class_id: string;
          jour: number;
          heure_debut: string;
          heure_fin: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_schedule_slots"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "class_schedule_slots_subject_code_fkey";
            columns: ["subject_code"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["code"];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          name: string;
          name_ar: string | null;
          category: SubjectCategory;
          sort_order: number;
        };
        Insert: Database["public"]["Tables"]["subjects"]["Row"];
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
        Relationships: [];
      };
      class_subjects: {
        Row: {
          id: string;
          class_id: string;
          subject_code: string;
          teacher_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["class_subjects"]["Row"]> & {
          class_id: string;
          subject_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_subjects"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "class_subjects_subject_code_fkey";
            columns: ["subject_code"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["code"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          class_id: string | null;
          full_name: string;
          name_ar: string | null;
          age: number | null;
          parent_name: string | null;
          parent_phone: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          school_id: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };
      sourates: {
        Row: {
          id: number;
          num: number;
          name: string;
          name_ar: string;
        };
        Insert: Database["public"]["Tables"]["sourates"]["Row"];
        Update: Partial<Database["public"]["Tables"]["sourates"]["Row"]>;
        Relationships: [];
      };
      memorization_progress: {
        Row: {
          id: string;
          student_id: string;
          sourate_id: number;
          status: MemoStatus;
          validated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["memorization_progress"]["Row"]> & {
          student_id: string;
          sourate_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["memorization_progress"]["Row"]>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          present: boolean | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance"]["Row"]> & {
          student_id: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          period: string;
          amount: number;
          status: PaymentStatus;
          method: string | null;
          receipt_no: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          student_id: string;
          period: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          school_id: string;
          student_id: string | null;
          channel: string;
          template: string | null;
          body: string;
          status: MessageStatus;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          school_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile: {
        Args: Record<string, never>;
        Returns: { role: ProfileRole; school_id: string | null; federation_id: string | null }[];
      };
      next_receipt_no: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
