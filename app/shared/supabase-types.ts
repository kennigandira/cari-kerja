export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      job_documents: {
        Row: {
          created_at: string | null
          document_type: string
          error_message: string | null
          id: string
          job_id: string
          latex_path: string | null
          markdown_path: string | null
          pdf_path: string | null
          processing_status: string | null
          regeneration_number: number | null
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          error_message?: string | null
          id?: string
          job_id: string
          latex_path?: string | null
          markdown_path?: string | null
          pdf_path?: string | null
          processing_status?: string | null
          regeneration_number?: number | null
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          error_message?: string | null
          id?: string
          job_id?: string
          latex_path?: string | null
          markdown_path?: string | null
          pdf_path?: string | null
          processing_status?: string | null
          regeneration_number?: number | null
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_name: string | null
          created_at: string | null
          folder_path: string | null
          id: string
          input_content: string
          input_type: string
          job_description_html: string | null
          job_description_text: string | null
          job_type: string | null
          kanban_order: number | null
          location: string | null
          match_analysis: Json | null
          match_percentage: number | null
          original_url: string | null
          position_title: string | null
          posted_date: string | null
          salary_range: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string
          input_content: string
          input_type: string
          job_description_html?: string | null
          job_description_text?: string | null
          job_type?: string | null
          kanban_order?: number | null
          location?: string | null
          match_analysis?: Json | null
          match_percentage?: number | null
          original_url?: string | null
          position_title?: string | null
          posted_date?: string | null
          salary_range?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          folder_path?: string | null
          id?: string
          input_content?: string
          input_type?: string
          job_description_html?: string | null
          job_description_text?: string | null
          job_type?: string | null
          kanban_order?: number | null
          location?: string | null
          match_analysis?: Json | null
          match_percentage?: number | null
          original_url?: string | null
          position_title?: string | null
          posted_date?: string | null
          salary_range?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processing_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_id: string
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          task_data: Json | null
          task_result: Json | null
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          task_data?: Json | null
          task_result?: Json | null
          task_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          task_data?: Json | null
          task_result?: Json | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      regeneration_requests: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          job_id: string
          new_document_id: string | null
          status: string | null
          user_feedback: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          job_id: string
          new_document_id?: string | null
          status?: string | null
          user_feedback: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          job_id?: string
          new_document_id?: string | null
          status?: string | null
          user_feedback?: string
        }
        Relationships: [
          {
            foreignKeyName: "regeneration_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "job_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regeneration_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regeneration_requests_new_document_id_fkey"
            columns: ["new_document_id"]
            isOneToOne: false
            referencedRelation: "job_documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
