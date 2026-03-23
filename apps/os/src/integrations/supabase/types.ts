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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_id: string
          created_at: string | null
          created_by: string | null
          id: string
          messages: Json | null
          project_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          messages?: Json | null
          project_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          messages?: Json | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ratings: {
        Row: {
          agent_id: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          rating: number | null
        }
        Insert: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
        }
        Update: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_usage: {
        Row: {
          agent_id: string
          agent_name: string
          created_at: string | null
          estimated_cost: number | null
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          provider: string
          response_time_ms: number | null
          total_tokens: number | null
        }
        Insert: {
          agent_id: string
          agent_name: string
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string
          response_time_ms?: number | null
          total_tokens?: number | null
        }
        Update: {
          agent_id?: string
          agent_name?: string
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string
          response_time_ms?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          colors: Json | null
          fonts: Json | null
          id: string
          logo_url: string | null
          project_id: string | null
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string | null
        }
        Insert: {
          colors?: Json | null
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          project_id?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Update: {
          colors?: Json | null
          fonts?: Json | null
          id?: string
          logo_url?: string | null
          project_id?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          health_score: number | null
          id: string
          industry: string | null
          name: string
          phone: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          health_score?: number | null
          id?: string
          industry?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      custom_agents: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          model: string
          name: string
          provider: string
          role: string
          skills: string[]
          system_prompt: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          model?: string
          name: string
          provider?: string
          role?: string
          skills?: string[]
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          model?: string
          name?: string
          provider?: string
          role?: string
          skills?: string[]
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_skills: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          created_by_orchestrator: boolean
          description: string
          enabled: boolean
          icon: string
          id: string
          name: string
          parameters: Json
          skill_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          created_by_orchestrator?: boolean
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          name: string
          parameters?: Json
          skill_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          created_by_orchestrator?: boolean
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          name?: string
          parameters?: Json
          skill_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_briefings: {
        Row: {
          content: Json | null
          generated_at: string | null
          id: string
        }
        Insert: {
          content?: Json | null
          generated_at?: string | null
          id?: string
        }
        Update: {
          content?: Json | null
          generated_at?: string | null
          id?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          widget_order: Json
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          widget_order?: Json
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          widget_order?: Json
        }
        Relationships: []
      }
      generated_websites: {
        Row: {
          client_id: string | null
          client_name: string
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          design: Json | null
          html: string | null
          id: string
          industry: string | null
          pages: string[] | null
          project_id: string | null
          research: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_name: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design?: Json | null
          html?: string | null
          id?: string
          industry?: string | null
          pages?: string[] | null
          project_id?: string | null
          research?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design?: Json | null
          html?: string | null
          id?: string
          industry?: string | null
          pages?: string[] | null
          project_id?: string | null
          research?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_websites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_websites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_submissions: {
        Row: {
          budget_range: string | null
          company: string | null
          created_at: string | null
          description: string | null
          email: string
          id: string
          industry: string | null
          name: string
          phone: string | null
          processed: boolean | null
          project_type: string | null
          status: string | null
          timeline: string | null
          website_url: string | null
        }
        Insert: {
          budget_range?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          industry?: string | null
          name: string
          phone?: string | null
          processed?: boolean | null
          project_type?: string | null
          status?: string | null
          timeline?: string | null
          website_url?: string | null
        }
        Update: {
          budget_range?: string | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          industry?: string | null
          name?: string
          phone?: string | null
          processed?: boolean | null
          project_type?: string | null
          status?: string | null
          timeline?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      intelligence_snapshots: {
        Row: {
          created_at: string | null
          data_summary: Json | null
          id: string
          insights: Json
          recommendations: Json
          snapshot_type: string
        }
        Insert: {
          created_at?: string | null
          data_summary?: Json | null
          id?: string
          insights?: Json
          recommendations?: Json
          snapshot_type?: string
        }
        Update: {
          created_at?: string | null
          data_summary?: Json | null
          id?: string
          insights?: Json
          recommendations?: Json
          snapshot_type?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_at: string | null
          project_id: string | null
          proposal_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          proposal_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          proposal_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_nurturing_status: {
        Row: {
          completed: boolean
          created_at: string
          current_step: number
          id: string
          lead_id: string
          next_action_at: string | null
          paused: boolean
          sequence_id: string
          started_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          lead_id: string
          next_action_at?: string | null
          paused?: boolean
          sequence_id: string
          started_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          lead_id?: string
          next_action_at?: string | null
          paused?: boolean
          sequence_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_nurturing_status_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_nurturing_status_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "nurturing_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          name: string | null
          notes: string | null
          score: number | null
          status: string | null
          url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          notes?: string | null
          score?: number | null
          status?: string | null
          url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string | null
          notes?: string | null
          score?: number | null
          status?: string | null
          url?: string | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      nurturing_sequences: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          trigger_conditions: Json
          trigger_type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          trigger_conditions?: Json
          trigger_type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
        }
        Relationships: []
      }
      nurturing_steps: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string
          delay_hours: number
          id: string
          sequence_id: string
          step_name: string
          step_order: number
        }
        Insert: {
          action_data?: Json
          action_type: string
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id: string
          step_name: string
          step_order: number
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id?: string
          step_name?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "nurturing_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "nurturing_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestrator_results: {
        Row: {
          context_input: string | null
          created_at: string | null
          created_by: string | null
          id: string
          plan_summary: string | null
          project_id: string | null
          results: Json
          task_input: string
        }
        Insert: {
          context_input?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_summary?: string | null
          project_id?: string | null
          results?: Json
          task_input: string
        }
        Update: {
          context_input?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          plan_summary?: string | null
          project_id?: string | null
          results?: Json
          task_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "orchestrator_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_logs: {
        Row: {
          body_preview: string | null
          converted: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string | null
          meeting_booked: boolean | null
          method: string | null
          notes: string | null
          opened: boolean | null
          replied: boolean | null
          resend_email_id: string | null
          sent_at: string | null
          subject: string | null
          template: string | null
        }
        Insert: {
          body_preview?: string | null
          converted?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          meeting_booked?: boolean | null
          method?: string | null
          notes?: string | null
          opened?: boolean | null
          replied?: boolean | null
          resend_email_id?: string | null
          sent_at?: string | null
          subject?: string | null
          template?: string | null
        }
        Update: {
          body_preview?: string | null
          converted?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          meeting_booked?: boolean | null
          method?: string | null
          notes?: string | null
          opened?: boolean | null
          replied?: boolean | null
          resend_email_id?: string | null
          sent_at?: string | null
          subject?: string | null
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_deals: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_contact: string | null
          lead_id: string | null
          next_action: string | null
          notes: string | null
          stage: string | null
          value: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_contact?: string | null
          lead_id?: string | null
          next_action?: string | null
          notes?: string | null
          stage?: string | null
          value?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_contact?: string | null
          lead_id?: string | null
          next_action?: string | null
          notes?: string | null
          stage?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brief: string | null
          client_id: string | null
          client_name: string
          created_at: string | null
          created_by: string | null
          deadline: string | null
          hours_logged: number | null
          id: string
          project_type: string | null
          public_updates: Json | null
          share_token: string | null
          status: string | null
          value: number | null
        }
        Insert: {
          brief?: string | null
          client_id?: string | null
          client_name: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          hours_logged?: number | null
          id?: string
          project_type?: string | null
          public_updates?: Json | null
          share_token?: string | null
          status?: string | null
          value?: number | null
        }
        Update: {
          brief?: string | null
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          hours_logged?: number | null
          id?: string
          project_type?: string | null
          public_updates?: Json | null
          share_token?: string | null
          status?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          agent_id: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          title: string | null
          use_count: number | null
          variables: Json | null
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          title?: string | null
          use_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          features: string[] | null
          id: string
          industry: string | null
          lead_id: string | null
          notes: string | null
          pages: number | null
          project_id: string | null
          result: string | null
          sent_at: string | null
          status: string | null
          title: string
          value: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          notes?: string | null
          pages?: number | null
          project_id?: string | null
          result?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          value?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          id?: string
          industry?: string | null
          lead_id?: string | null
          notes?: string | null
          pages?: number | null
          project_id?: string | null
          result?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_executions: {
        Row: {
          agent_id: string
          agent_name: string
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          skill_id: string
          skill_name: string
          success: boolean
        }
        Insert: {
          agent_id: string
          agent_name: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          skill_id: string
          skill_name: string
          success?: boolean
        }
        Update: {
          agent_id?: string
          agent_name?: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          skill_id?: string
          skill_name?: string
          success?: boolean
        }
        Relationships: []
      }
      skill_overrides: {
        Row: {
          auto_disabled: boolean
          disabled_reason: string | null
          enabled: boolean
          id: string
          skill_id: string
          updated_at: string
        }
        Insert: {
          auto_disabled?: boolean
          disabled_reason?: string | null
          enabled?: boolean
          id?: string
          skill_id: string
          updated_at?: string
        }
        Update: {
          auto_disabled?: boolean
          disabled_reason?: string | null
          enabled?: boolean
          id?: string
          skill_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          description: string | null
          hours: number | null
          id: string
          logged_at: string | null
          logged_by: string | null
          project_id: string | null
        }
        Insert: {
          description?: string | null
          hours?: number | null
          id?: string
          logged_at?: string | null
          logged_by?: string | null
          project_id?: string | null
        }
        Update: {
          description?: string | null
          hours?: number | null
          id?: string
          logged_at?: string | null
          logged_by?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      website_audits: {
        Row: {
          created_at: string | null
          created_by: string | null
          findings: Json | null
          id: string
          lead_id: string | null
          overall_score: number | null
          recommendations: Json | null
          scores: Json | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          findings?: Json | null
          id?: string
          lead_id?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          scores?: Json | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          findings?: Json | null
          id?: string
          lead_id?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          scores?: Json | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_audits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
