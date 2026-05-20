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
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount_cents: number
          created_at: string
          id: string
          month_number: number
          paid_at: string | null
          referral_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          created_at?: string
          id?: string
          month_number: number
          paid_at?: string | null
          referral_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          created_at?: string
          id?: string
          month_number?: number
          paid_at?: string | null
          referral_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_rate: number
          created_at: string
          customer_email: string
          id: string
          monthly_amount: number
          months_remaining: number
          status: string
          stripe_subscription_id: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_rate?: number
          created_at?: string
          customer_email: string
          id?: string
          monthly_amount?: number
          months_remaining?: number
          status?: string
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_rate?: number
          created_at?: string
          customer_email?: string
          id?: string
          monthly_amount?: number
          months_remaining?: number
          status?: string
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          created_at: string
          email: string
          full_name: string
          id: string
          instagram_handle: string | null
          payout_details: Json | null
          payout_method: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          instagram_handle?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          instagram_handle?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      au_postcode_coords: {
        Row: {
          lat: number
          lng: number
          locality: string | null
          postcode: string
        }
        Insert: {
          lat: number
          lng: number
          locality?: string | null
          postcode: string
        }
        Update: {
          lat?: number
          lng?: number
          locality?: string | null
          postcode?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_time: string
          company: string
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          quotes_per_week: string | null
          staff_notes: string | null
          status: string
          timezone: string
          updated_at: string | null
          zoom_link: string | null
          zoom_meeting_id: string | null
        }
        Insert: {
          booking_time: string
          company: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          quotes_per_week?: string | null
          staff_notes?: string | null
          status?: string
          timezone?: string
          updated_at?: string | null
          zoom_link?: string | null
          zoom_meeting_id?: string | null
        }
        Update: {
          booking_time?: string
          company?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          quotes_per_week?: string | null
          staff_notes?: string | null
          status?: string
          timezone?: string
          updated_at?: string | null
          zoom_link?: string | null
          zoom_meeting_id?: string | null
        }
        Relationships: []
      }
      business_subscriptions: {
        Row: {
          business_id: string
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          employee_limit: number | null
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          employee_limit?: number | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          employee_limit?: number | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          abn: string | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          inbound_email_alias: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          preferred_suppliers: Json | null
          quote_font: string | null
          quote_primary_color: string | null
          quote_secondary_color: string | null
          quote_template: string | null
          subscription_exempt: boolean | null
          updated_at: string | null
        }
        Insert: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inbound_email_alias?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id: string
          phone?: string | null
          preferred_suppliers?: Json | null
          quote_font?: string | null
          quote_primary_color?: string | null
          quote_secondary_color?: string | null
          quote_template?: string | null
          subscription_exempt?: boolean | null
          updated_at?: string | null
        }
        Update: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inbound_email_alias?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id?: string
          phone?: string | null
          preferred_suppliers?: Json | null
          quote_font?: string | null
          quote_primary_color?: string | null
          quote_secondary_color?: string | null
          quote_template?: string | null
          subscription_exempt?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          crew_id: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["chat_channel_type"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          crew_id?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["chat_channel_type"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          crew_id?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["chat_channel_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          channel_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          mentions: string[] | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          channel_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[] | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          channel_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: string[] | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          business_id: string
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      concrete_tests: {
        Row: {
          actual_strength: number | null
          created_at: string | null
          id: string
          job_id: string
          lab_report_url: string | null
          notes: string | null
          passed: boolean | null
          pour_date: string | null
          pour_id: string | null
          sample_count: number | null
          supplier: string | null
          target_strength: number | null
          test_date: string | null
          test_id: string
          test_type: Database["public"]["Enums"]["test_type"]
          updated_at: string | null
        }
        Insert: {
          actual_strength?: number | null
          created_at?: string | null
          id?: string
          job_id: string
          lab_report_url?: string | null
          notes?: string | null
          passed?: boolean | null
          pour_date?: string | null
          pour_id?: string | null
          sample_count?: number | null
          supplier?: string | null
          target_strength?: number | null
          test_date?: string | null
          test_id: string
          test_type: Database["public"]["Enums"]["test_type"]
          updated_at?: string | null
        }
        Update: {
          actual_strength?: number | null
          created_at?: string | null
          id?: string
          job_id?: string
          lab_report_url?: string | null
          notes?: string | null
          passed?: boolean | null
          pour_date?: string | null
          pour_id?: string | null
          sample_count?: number | null
          supplier?: string | null
          target_strength?: number | null
          test_date?: string | null
          test_id?: string
          test_type?: Database["public"]["Enums"]["test_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concrete_tests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concrete_tests_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string | null
          crew_id: string
          employee_id: string
          id: string
          is_supervisor: boolean | null
        }
        Insert: {
          created_at?: string | null
          crew_id: string
          employee_id: string
          id?: string
          is_supervisor?: boolean | null
        }
        Update: {
          created_at?: string | null
          crew_id?: string
          employee_id?: string
          id?: string
          is_supervisor?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_campaigns: {
        Row: {
          created_at: string
          filter_type: string | null
          html_body: string
          id: string
          recipient_count: number | null
          sent_at: string | null
          sent_by: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          filter_type?: string | null
          html_body: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          filter_type?: string | null
          html_body?: string
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          subject?: string
        }
        Relationships: []
      }
      crm_email_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          contact_type: string
          email: string
          id: string
          resend_email_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          contact_type: string
          email: string
          id?: string
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          contact_type?: string
          email?: string
          id?: string
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_email_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_inbox: {
        Row: {
          body_html: string | null
          body_text: string | null
          from_email: string
          from_name: string | null
          id: string
          in_reply_to_campaign_id: string | null
          is_read: boolean | null
          received_at: string
          staff_replied_at: string | null
          staff_reply: string | null
          subject: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          in_reply_to_campaign_id?: string | null
          is_read?: boolean | null
          received_at?: string
          staff_replied_at?: string | null
          staff_reply?: string | null
          subject?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          in_reply_to_campaign_id?: string | null
          is_read?: boolean | null
          received_at?: string
          staff_replied_at?: string | null
          staff_reply?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_inbox_in_reply_to_campaign_id_fkey"
            columns: ["in_reply_to_campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          business_id: string
          caption: string | null
          category: Database["public"]["Enums"]["document_category"]
          created_at: string | null
          diary_stage: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          is_cover: boolean
          pour_id: string | null
          reference_id: string | null
          subfolder: string | null
          taken_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          business_id: string
          caption?: string | null
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          diary_stage?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          is_cover?: boolean
          pour_id?: string | null
          reference_id?: string | null
          subfolder?: string | null
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          business_id?: string
          caption?: string | null
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          diary_stage?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_cover?: boolean
          pour_id?: string | null
          reference_id?: string | null
          subfolder?: string | null
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_tickets: {
        Row: {
          created_at: string | null
          document_url: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          ticket_number: string | null
          ticket_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          ticket_number?: string | null
          ticket_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          ticket_number?: string | null
          ticket_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_quote_pricing_config: {
        Row: {
          complexity_multipliers: Json
          created_at: string
          default_assumptions: string | null
          id: string
          integrations: Json
          modules: Json
          strategic_fees: Json
          support_plans: Json
          tiers: Json
          updated_at: string
          urgency_multipliers: Json
        }
        Insert: {
          complexity_multipliers?: Json
          created_at?: string
          default_assumptions?: string | null
          id?: string
          integrations?: Json
          modules?: Json
          strategic_fees?: Json
          support_plans?: Json
          tiers?: Json
          updated_at?: string
          urgency_multipliers?: Json
        }
        Update: {
          complexity_multipliers?: Json
          created_at?: string
          default_assumptions?: string | null
          id?: string
          integrations?: Json
          modules?: Json
          strategic_fees?: Json
          support_plans?: Json
          tiers?: Json
          updated_at?: string
          urgency_multipliers?: Json
        }
        Relationships: []
      }
      enterprise_quote_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          integrations: Json
          is_active: boolean
          modules: Json
          name: string
          support_key: string | null
          tier_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          integrations?: Json
          is_active?: boolean
          modules?: Json
          name: string
          support_key?: string | null
          tier_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          integrations?: Json
          is_active?: boolean
          modules?: Json
          name?: string
          support_key?: string | null
          tier_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_quotes: {
        Row: {
          base_subtotal_high: number
          base_subtotal_low: number
          business_name: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          complexity_multiplier: number
          complexity_settings: Json
          concurrent_jobs: number | null
          confidence_rating: string | null
          created_at: string
          created_by: string | null
          crew_count: number | null
          estimate_high: number
          estimate_low: number
          estimated_hours: number | null
          id: string
          integrations_subtotal: number
          internal_notes: string | null
          meeting_notes: string | null
          modules_subtotal: number
          monthly_support: number
          profit_margin_pct: number | null
          quote_number: string
          recommended_quote: number
          region: string | null
          selected_integrations: Json
          selected_modules: Json
          selected_support: Json | null
          selected_tier: Json | null
          status: string
          strategic_fees: Json
          strategic_fees_total: number
          team_size: number | null
          updated_at: string
          urgency_multiplier: number
        }
        Insert: {
          base_subtotal_high?: number
          base_subtotal_low?: number
          business_name?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          complexity_multiplier?: number
          complexity_settings?: Json
          concurrent_jobs?: number | null
          confidence_rating?: string | null
          created_at?: string
          created_by?: string | null
          crew_count?: number | null
          estimate_high?: number
          estimate_low?: number
          estimated_hours?: number | null
          id?: string
          integrations_subtotal?: number
          internal_notes?: string | null
          meeting_notes?: string | null
          modules_subtotal?: number
          monthly_support?: number
          profit_margin_pct?: number | null
          quote_number: string
          recommended_quote?: number
          region?: string | null
          selected_integrations?: Json
          selected_modules?: Json
          selected_support?: Json | null
          selected_tier?: Json | null
          status?: string
          strategic_fees?: Json
          strategic_fees_total?: number
          team_size?: number | null
          updated_at?: string
          urgency_multiplier?: number
        }
        Update: {
          base_subtotal_high?: number
          base_subtotal_low?: number
          business_name?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          complexity_multiplier?: number
          complexity_settings?: Json
          concurrent_jobs?: number | null
          confidence_rating?: string | null
          created_at?: string
          created_by?: string | null
          crew_count?: number | null
          estimate_high?: number
          estimate_low?: number
          estimated_hours?: number | null
          id?: string
          integrations_subtotal?: number
          internal_notes?: string | null
          meeting_notes?: string | null
          modules_subtotal?: number
          monthly_support?: number
          profit_margin_pct?: number | null
          quote_number?: string
          recommended_quote?: number
          region?: string | null
          selected_integrations?: Json
          selected_modules?: Json
          selected_support?: Json | null
          selected_tier?: Json | null
          status?: string
          strategic_fees?: Json
          strategic_fees_total?: number
          team_size?: number | null
          updated_at?: string
          urgency_multiplier?: number
        }
        Relationships: []
      }
      enterprise_redirects: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          id: string
          notes: string | null
          subdomain: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          subdomain: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          last_service_date: string | null
          name: string
          next_service_date: string | null
          purchase_date: string | null
          serial_number: string | null
          service_interval_days: number | null
          service_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          last_service_date?: string | null
          name: string
          next_service_date?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_interval_days?: number | null
          service_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          last_service_date?: string | null
          name?: string
          next_service_date?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_interval_days?: number | null
          service_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          quantity: number
          sort_order: number | null
          total: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_takeoffs: {
        Row: {
          created_at: string
          current_page: number | null
          estimate_id: string
          id: string
          page_count: number | null
          plan_type: string | null
          plan_url: string | null
          scale_calibration_method: string | null
          scale_pixels_per_meter: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number | null
          estimate_id: string
          id?: string
          page_count?: number | null
          plan_type?: string | null
          plan_url?: string | null
          scale_calibration_method?: string | null
          scale_pixels_per_meter?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number | null
          estimate_id?: string
          id?: string
          page_count?: number | null
          plan_type?: string | null
          plan_url?: string | null
          scale_calibration_method?: string | null
          scale_pixels_per_meter?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_takeoffs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_usage: {
        Row: {
          business_id: string
          created_at: string | null
          estimate_count: number | null
          id: string
          month_year: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          estimate_count?: number | null
          id?: string
          month_year: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          estimate_count?: number | null
          id?: string
          month_year?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          action_snoozed_until: string | null
          business_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_signature: string | null
          client_signature_name: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          deposit_percentage: number | null
          description: string | null
          estimate_number: string | null
          estimate_type: string
          follow_up_date: string | null
          id: string
          notes: string | null
          payment_terms_type: string | null
          quote_validity_days: number | null
          scope_data: Json | null
          selected_scopes: Json | null
          signed_at: string | null
          signing_token: string | null
          signing_token_expires_at: string | null
          site_address: string
          site_visit_date: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          action_snoozed_until?: string | null
          business_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_signature?: string | null
          client_signature_name?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_percentage?: number | null
          description?: string | null
          estimate_number?: string | null
          estimate_type?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          payment_terms_type?: string | null
          quote_validity_days?: number | null
          scope_data?: Json | null
          selected_scopes?: Json | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          site_address: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          action_snoozed_until?: string | null
          business_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_signature?: string | null
          client_signature_name?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_percentage?: number | null
          description?: string | null
          estimate_number?: string | null
          estimate_type?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          payment_terms_type?: string | null
          quote_validity_days?: number | null
          scope_data?: Json | null
          selected_scopes?: Json | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          site_address?: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_invite_events: {
        Row: {
          event_at: string
          event_type: string
          external_invite_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          event_at?: string
          event_type: string
          external_invite_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          event_at?: string
          event_type?: string
          external_invite_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_invite_events_external_invite_id_fkey"
            columns: ["external_invite_id"]
            isOneToOne: false
            referencedRelation: "external_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      external_invites: {
        Row: {
          batch_id: string | null
          batch_token_hash: string | null
          business_id: string
          created_at: string
          created_by: string | null
          email_delivery_status: string | null
          email_error_message: string | null
          email_message_id: string | null
          id: string
          invite_type: string
          job_id: string
          job_pour_id: string
          notes: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          responded_at: string | null
          responder_user_id: string | null
          role: string
          sent_at: string | null
          sent_via: string | null
          sms_delivery_status: string | null
          sms_error_message: string | null
          sms_message_sid: string | null
          start_time: string | null
          status: string
          token_expires_at: string
          token_hash: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          batch_id?: string | null
          batch_token_hash?: string | null
          business_id: string
          created_at?: string
          created_by?: string | null
          email_delivery_status?: string | null
          email_error_message?: string | null
          email_message_id?: string | null
          id?: string
          invite_type?: string
          job_id: string
          job_pour_id: string
          notes?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          responded_at?: string | null
          responder_user_id?: string | null
          role: string
          sent_at?: string | null
          sent_via?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          start_time?: string | null
          status?: string
          token_expires_at?: string
          token_hash: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          batch_id?: string | null
          batch_token_hash?: string | null
          business_id?: string
          created_at?: string
          created_by?: string | null
          email_delivery_status?: string | null
          email_error_message?: string | null
          email_message_id?: string | null
          id?: string
          invite_type?: string
          job_id?: string
          job_pour_id?: string
          notes?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          responded_at?: string | null
          responder_user_id?: string | null
          role?: string
          sent_at?: string | null
          sent_via?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          start_time?: string | null
          status?: string
          token_expires_at?: string
          token_hash?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invites_job_pour_id_fkey"
            columns: ["job_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          business_id: string
          content: string
          created_at: string
          crew_mentions: string[] | null
          id: string
          mentions: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          business_id: string
          content: string
          created_at?: string
          crew_mentions?: string[] | null
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          business_id?: string
          content?: string
          created_at?: string
          crew_mentions?: string[] | null
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_contacts: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      itp_templates: {
        Row: {
          business_id: string | null
          checklist_items: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          itp_type: Database["public"]["Enums"]["itp_type"]
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          checklist_items?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          itp_type: Database["public"]["Enums"]["itp_type"]
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          checklist_items?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          itp_type?: Database["public"]["Enums"]["itp_type"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_boq: {
        Row: {
          created_at: string
          id: string
          items: Json
          job_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          job_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          job_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_boq_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_dates: {
        Row: {
          business_id: string
          created_at: string
          date: string
          date_type: string
          description: string | null
          id: string
          is_completed: boolean
          job_id: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          date_type?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          job_id: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          date_type?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          job_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_dates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_dates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_equipment: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          job_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          job_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_itps: {
        Row: {
          assigned_to: string | null
          checklist_data: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          employee_signature: string | null
          employee_signed_at: string | null
          id: string
          itp_type: Database["public"]["Enums"]["itp_type"]
          job_id: string
          name: string
          notes: string | null
          pour_id: string | null
          status: string | null
          supervisor_signature: string | null
          supervisor_signed_at: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_signature?: string | null
          employee_signed_at?: string | null
          id?: string
          itp_type: Database["public"]["Enums"]["itp_type"]
          job_id: string
          name: string
          notes?: string | null
          pour_id?: string | null
          status?: string | null
          supervisor_signature?: string | null
          supervisor_signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_signature?: string | null
          employee_signed_at?: string | null
          id?: string
          itp_type?: Database["public"]["Enums"]["itp_type"]
          job_id?: string
          name?: string
          notes?: string | null
          pour_id?: string | null
          status?: string | null
          supervisor_signature?: string | null
          supervisor_signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_itps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_itps_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_itps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_pours: {
        Row: {
          actual_m3: number | null
          batch_ticket_refs: string[] | null
          concrete_supplier: string | null
          created_at: string | null
          docket_numbers: string[] | null
          estimated_m3: number | null
          id: string
          job_id: string
          mpa_strength: string | null
          notes: string | null
          pour_date: string | null
          pour_name: string
          scheduled_time: string | null
          scopes: Json | null
          slump: string | null
          status: string | null
          updated_at: string | null
          visit_type: string | null
        }
        Insert: {
          actual_m3?: number | null
          batch_ticket_refs?: string[] | null
          concrete_supplier?: string | null
          created_at?: string | null
          docket_numbers?: string[] | null
          estimated_m3?: number | null
          id?: string
          job_id: string
          mpa_strength?: string | null
          notes?: string | null
          pour_date?: string | null
          pour_name: string
          scheduled_time?: string | null
          scopes?: Json | null
          slump?: string | null
          status?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Update: {
          actual_m3?: number | null
          batch_ticket_refs?: string[] | null
          concrete_supplier?: string | null
          created_at?: string | null
          docket_numbers?: string[] | null
          estimated_m3?: number | null
          id?: string
          job_id?: string
          mpa_strength?: string | null
          notes?: string | null
          pour_date?: string | null
          pour_name?: string
          scheduled_time?: string | null
          scopes?: Json | null
          slump?: string | null
          status?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_pours_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_swms: {
        Row: {
          content: Json
          created_at: string | null
          hazards: Json
          id: string
          job_id: string
          name: string
          required_signers: string[] | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          hazards?: Json
          id?: string
          job_id: string
          name: string
          required_signers?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          hazards?: Json
          id?: string
          job_id?: string
          name?: string
          required_signers?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_swms_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_swms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "swms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_variations: {
        Row: {
          amount: number
          approval_reference: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          client_signature: string | null
          client_signature_name: string | null
          created_at: string | null
          created_by: string | null
          days_extension: number | null
          description: string
          id: string
          items: Json
          job_id: string
          notes: string | null
          reason: string | null
          sent_via: string | null
          signed_at: string | null
          signing_token: string | null
          signing_token_expires_at: string | null
          sms_delivery_status: string | null
          sms_error_message: string | null
          sms_message_sid: string | null
          status: string
          submitted_at: string | null
          submitted_to_email: string | null
          submitted_to_phone: string | null
          updated_at: string | null
          variation_number: string
        }
        Insert: {
          amount?: number
          approval_reference?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          client_signature?: string | null
          client_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          days_extension?: number | null
          description: string
          id?: string
          items?: Json
          job_id: string
          notes?: string | null
          reason?: string | null
          sent_via?: string | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          status?: string
          submitted_at?: string | null
          submitted_to_email?: string | null
          submitted_to_phone?: string | null
          updated_at?: string | null
          variation_number: string
        }
        Update: {
          amount?: number
          approval_reference?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          client_signature?: string | null
          client_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          days_extension?: number | null
          description?: string
          id?: string
          items?: Json
          job_id?: string
          notes?: string | null
          reason?: string | null
          sent_via?: string | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          status?: string
          submitted_at?: string | null
          submitted_to_email?: string | null
          submitted_to_phone?: string | null
          updated_at?: string | null
          variation_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_variations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          builder_client: string | null
          business_id: string
          concrete_supplier: string | null
          created_at: string | null
          created_by: string | null
          crew_id: string | null
          estimated_m3: number | null
          finish_type: string | null
          id: string
          job_notes: string | null
          job_number: string | null
          job_type: string
          mpa_strength: string | null
          name: string
          ordered_m3: number | null
          po_number: string | null
          pour_time: string | null
          scheduled_date: string | null
          site_address: string
          slump: string | null
          source_estimate_id: string | null
          startup_completed: boolean | null
          startup_dismissed_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
        }
        Insert: {
          builder_client?: string | null
          business_id: string
          concrete_supplier?: string | null
          created_at?: string | null
          created_by?: string | null
          crew_id?: string | null
          estimated_m3?: number | null
          finish_type?: string | null
          id?: string
          job_notes?: string | null
          job_number?: string | null
          job_type?: string
          mpa_strength?: string | null
          name: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address: string
          slump?: string | null
          source_estimate_id?: string | null
          startup_completed?: boolean | null
          startup_dismissed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Update: {
          builder_client?: string | null
          business_id?: string
          concrete_supplier?: string | null
          created_at?: string | null
          created_by?: string | null
          crew_id?: string | null
          estimated_m3?: number | null
          finish_type?: string | null
          id?: string
          job_notes?: string | null
          job_number?: string | null
          job_type?: string
          mpa_strength?: string | null
          name?: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address?: string
          slump?: string | null
          source_estimate_id?: string | null
          startup_completed?: boolean | null
          startup_dismissed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          business_id: string
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          document_type: string
          email_body: string | null
          extracted_data: Json | null
          file_name: string
          file_url: string
          from_email: string
          id: string
          linked_job_id: string | null
          linked_pour_id: string | null
          match_confidence: number | null
          match_status: string | null
          received_at: string
          rejection_reason: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          document_type?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name: string
          file_url: string
          from_email: string
          id?: string
          linked_job_id?: string | null
          linked_pour_id?: string | null
          match_confidence?: number | null
          match_status?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          document_type?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_url?: string
          from_email?: string
          id?: string
          linked_job_id?: string | null
          linked_pour_id?: string | null
          match_confidence?: number | null
          match_status?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_documents_linked_job_id_fkey"
            columns: ["linked_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_documents_linked_pour_id_fkey"
            columns: ["linked_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_general: {
        Row: {
          business_id: string
          created_at: string
          email_body: string | null
          file_name: string | null
          file_url: string | null
          from_email: string
          from_name: string | null
          id: string
          notes: string | null
          received_at: string
          rejection_reason: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email_body?: string | null
          file_name?: string | null
          file_url?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email_body?: string | null
          file_name?: string | null
          file_url?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_general_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          accepted_at: string | null
          email: string
          full_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          email: string
          full_name: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      pending_plans: {
        Row: {
          business_id: string
          created_at: string
          email_body: string | null
          extracted_data: Json | null
          file_name: string
          file_url: string
          from_email: string
          from_name: string | null
          id: string
          linked_estimate_id: string | null
          received_at: string
          rejection_reason: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name: string
          file_url: string
          from_email: string
          from_name?: string | null
          id?: string
          linked_estimate_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_url?: string
          from_email?: string
          from_name?: string | null
          id?: string
          linked_estimate_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_plans_linked_estimate_id_fkey"
            columns: ["linked_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_quotes: {
        Row: {
          business_id: string
          created_at: string
          email_body: string | null
          extracted_data: Json | null
          file_name: string | null
          file_url: string | null
          from_email: string
          from_name: string | null
          id: string
          linked_job_id: string | null
          linked_rfq_id: string | null
          received_at: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_url?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          linked_job_id?: string | null
          linked_rfq_id?: string | null
          received_at?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_url?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          linked_job_id?: string | null
          linked_rfq_id?: string | null
          received_at?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_quotes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_quotes_linked_job_id_fkey"
            columns: ["linked_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_quotes_linked_rfq_id_fkey"
            columns: ["linked_rfq_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_test_results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          email_body: string | null
          extracted_data: Json | null
          from_email: string
          id: string
          lab_report_url: string | null
          linked_job_id: string | null
          linked_pour_id: string | null
          match_confidence: number | null
          match_status: string | null
          matched_job_id: string | null
          matched_pour_id: string | null
          received_at: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["pending_test_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          from_email: string
          id?: string
          lab_report_url?: string | null
          linked_job_id?: string | null
          linked_pour_id?: string | null
          match_confidence?: number | null
          match_status?: string | null
          matched_job_id?: string | null
          matched_pour_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["pending_test_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          email_body?: string | null
          extracted_data?: Json | null
          from_email?: string
          id?: string
          lab_report_url?: string | null
          linked_job_id?: string | null
          linked_pour_id?: string | null
          match_confidence?: number | null
          match_status?: string | null
          matched_job_id?: string | null
          matched_pour_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["pending_test_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_test_results_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_linked_job_id_fkey"
            columns: ["linked_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_linked_pour_id_fkey"
            columns: ["linked_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_matched_job_id_fkey"
            columns: ["matched_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_matched_pour_id_fkey"
            columns: ["matched_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_counted_estimates: {
        Row: {
          estimate_id: string
        }
        Insert: {
          estimate_id: string
        }
        Update: {
          estimate_id?: string
        }
        Relationships: []
      }
      platform_counters: {
        Row: {
          id: string
          total_quoted_value: number
        }
        Insert: {
          id?: string
          total_quoted_value?: number
        }
        Update: {
          id?: string
          total_quoted_value?: number
        }
        Relationships: []
      }
      pour_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          pour_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          pour_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          pour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pour_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pour_employees_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      pour_equipment: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          pour_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          pour_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          pour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pour_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pour_equipment_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          business_id: string
          category: string
          created_at: string | null
          custom_price: number | null
          default_price: number
          id: string
          is_active: boolean | null
          item_code: string
          item_name: string
          notes: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string | null
          custom_price?: number | null
          default_price: number
          id?: string
          is_active?: boolean | null
          item_code: string
          item_name: string
          notes?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string | null
          custom_price?: number | null
          default_price?: number
          id?: string
          is_active?: boolean | null
          item_code?: string
          item_name?: string
          notes?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          position: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          phone?: string | null
          position?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          position?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_startup: {
        Row: {
          caulking_required: boolean | null
          client: string | null
          client_contact_email: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          communication_setup: boolean | null
          completion_percentage: number | null
          concrete_supplier: string | null
          concrete_supply: boolean | null
          concrete_testing: boolean | null
          created_at: string | null
          curing_required: boolean | null
          id: string
          invoice_billing_address: string | null
          invoice_payment_terms: string | null
          itps_prepared: boolean | null
          job_id: string
          long_longs_required: boolean | null
          mix_design_approval: boolean | null
          mix_design_approval_notes: string | null
          mix_design_file_url: string | null
          mix_design_text: string | null
          plans_printed: boolean | null
          project_name: string | null
          reo_fixing_subcontractor: boolean | null
          reo_fixing_who: string | null
          reo_supplier: string | null
          reo_supply: boolean | null
          risk_assessment_completed: boolean | null
          site_manager: string | null
          swms_prepared: boolean | null
          updated_at: string | null
        }
        Insert: {
          caulking_required?: boolean | null
          client?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          communication_setup?: boolean | null
          completion_percentage?: number | null
          concrete_supplier?: string | null
          concrete_supply?: boolean | null
          concrete_testing?: boolean | null
          created_at?: string | null
          curing_required?: boolean | null
          id?: string
          invoice_billing_address?: string | null
          invoice_payment_terms?: string | null
          itps_prepared?: boolean | null
          job_id: string
          long_longs_required?: boolean | null
          mix_design_approval?: boolean | null
          mix_design_approval_notes?: string | null
          mix_design_file_url?: string | null
          mix_design_text?: string | null
          plans_printed?: boolean | null
          project_name?: string | null
          reo_fixing_subcontractor?: boolean | null
          reo_fixing_who?: string | null
          reo_supplier?: string | null
          reo_supply?: boolean | null
          risk_assessment_completed?: boolean | null
          site_manager?: string | null
          swms_prepared?: boolean | null
          updated_at?: string | null
        }
        Update: {
          caulking_required?: boolean | null
          client?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          communication_setup?: boolean | null
          completion_percentage?: number | null
          concrete_supplier?: string | null
          concrete_supply?: boolean | null
          concrete_testing?: boolean | null
          created_at?: string | null
          curing_required?: boolean | null
          id?: string
          invoice_billing_address?: string | null
          invoice_payment_terms?: string | null
          itps_prepared?: boolean | null
          job_id?: string
          long_longs_required?: boolean | null
          mix_design_approval?: boolean | null
          mix_design_approval_notes?: string | null
          mix_design_file_url?: string | null
          mix_design_text?: string | null
          plans_printed?: boolean | null
          project_name?: string | null
          reo_fixing_subcontractor?: boolean | null
          reo_fixing_who?: string | null
          reo_supplier?: string | null
          reo_supply?: boolean | null
          risk_assessment_completed?: boolean | null
          site_manager?: string | null
          swms_prepared?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_startup_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          boq_id: string
          business_id: string
          created_at: string | null
          created_by: string | null
          delivery_address: string
          delivery_date: string | null
          id: string
          items: Json
          job_id: string
          notes: string | null
          po_number: string
          sent_at: string | null
          sent_via: string | null
          site_contact_id: string | null
          site_contact_name: string | null
          site_contact_phone: string | null
          status: string | null
          supplier_contact_id: string | null
          supplier_email: string | null
          supplier_name: string
          supplier_phone: string | null
          updated_at: string | null
        }
        Insert: {
          boq_id: string
          business_id: string
          created_at?: string | null
          created_by?: string | null
          delivery_address: string
          delivery_date?: string | null
          id?: string
          items?: Json
          job_id: string
          notes?: string | null
          po_number: string
          sent_at?: string | null
          sent_via?: string | null
          site_contact_id?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          status?: string | null
          supplier_contact_id?: string | null
          supplier_email?: string | null
          supplier_name: string
          supplier_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          boq_id?: string
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          delivery_address?: string
          delivery_date?: string | null
          id?: string
          items?: Json
          job_id?: string
          notes?: string | null
          po_number?: string
          sent_at?: string | null
          sent_via?: string | null
          site_contact_id?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          status?: string | null
          supplier_contact_id?: string | null
          supplier_email?: string | null
          supplier_name?: string
          supplier_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_boq_id_fkey"
            columns: ["boq_id"]
            isOneToOne: false
            referencedRelation: "job_boq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_site_contact_id_fkey"
            columns: ["site_contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_contact_id_fkey"
            columns: ["supplier_contact_id"]
            isOneToOne: false
            referencedRelation: "supplier_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_directory_profiles: {
        Row: {
          abn: string | null
          abn_verified: boolean | null
          availability_status: string | null
          base_postcode: string | null
          bio: string | null
          created_at: string
          email: string | null
          entity_type: string | null
          first_name: string | null
          gst_registered: boolean | null
          has_white_card: boolean | null
          id: string
          insurance_certificate_url: string | null
          last_name: string | null
          legal_name: string | null
          phone: string | null
          profile_photo_url: string | null
          service_radius_km: number | null
          show_availability_in_directory: boolean
          trade_types: string[] | null
          updated_at: string
          user_id: string
          white_card_document_url: string | null
          white_card_number: string | null
          years_experience: number | null
        }
        Insert: {
          abn?: string | null
          abn_verified?: boolean | null
          availability_status?: string | null
          base_postcode?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          first_name?: string | null
          gst_registered?: boolean | null
          has_white_card?: boolean | null
          id?: string
          insurance_certificate_url?: string | null
          last_name?: string | null
          legal_name?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          service_radius_km?: number | null
          show_availability_in_directory?: boolean
          trade_types?: string[] | null
          updated_at?: string
          user_id: string
          white_card_document_url?: string | null
          white_card_number?: string | null
          years_experience?: number | null
        }
        Update: {
          abn?: string | null
          abn_verified?: boolean | null
          availability_status?: string | null
          base_postcode?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          first_name?: string | null
          gst_registered?: boolean | null
          has_white_card?: boolean | null
          id?: string
          insurance_certificate_url?: string | null
          last_name?: string | null
          legal_name?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          service_radius_km?: number | null
          show_availability_in_directory?: boolean
          trade_types?: string[] | null
          updated_at?: string
          user_id?: string
          white_card_document_url?: string | null
          white_card_number?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      subcontractor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_business_name: string | null
          reviewer_name: string | null
          reviewer_user_id: string
          subcontractor_profile_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_business_name?: string | null
          reviewer_name?: string | null
          reviewer_user_id: string
          subcontractor_profile_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_business_name?: string | null
          reviewer_name?: string | null
          reviewer_user_id?: string
          subcontractor_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_reviews_subcontractor_profile_id_fkey"
            columns: ["subcontractor_profile_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_directory_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_unavailable_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          business_id: string
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      supplier_contacts: {
        Row: {
          business_id: string
          category: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          abn: string | null
          categories: string[] | null
          company_name: string
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          phone: string | null
          service_areas: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          abn?: string | null
          categories?: string[] | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          service_areas?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          abn?: string | null
          categories?: string[] | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          phone?: string | null
          service_areas?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      supplier_registrations: {
        Row: {
          abn: string | null
          categories: string[] | null
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_areas: string[] | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          abn?: string | null
          categories?: string[] | null
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          abn?: string | null
          categories?: string[] | null
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_areas?: string[] | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      supplier_reps: {
        Row: {
          branch_address: string | null
          branch_name: string | null
          brand_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          last_verified_at: string | null
          lat: number | null
          lng: number | null
          mobile: string | null
          name: string
          phone: string | null
          postcodes: string[]
          region: string | null
          role: string | null
          service_radius_km: number | null
          source_url: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          branch_address?: string | null
          branch_name?: string | null
          brand_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          name: string
          phone?: string | null
          postcodes?: string[]
          region?: string | null
          role?: string | null
          service_radius_km?: number | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          branch_address?: string | null
          branch_name?: string | null
          brand_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          mobile?: string | null
          name?: string
          phone?: string | null
          postcodes?: string[]
          region?: string | null
          role?: string | null
          service_radius_km?: number | null
          source_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reps_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reps_staging: {
        Row: {
          branch_address: string | null
          branch_name: string | null
          brand_id: string
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          name: string | null
          phone: string | null
          postcodes: string[]
          raw: Json | null
          region: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string | null
          source_url: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          branch_address?: string | null
          branch_name?: string | null
          brand_id: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string | null
          phone?: string | null
          postcodes?: string[]
          raw?: Json | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          source_url?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          branch_address?: string | null
          branch_name?: string | null
          brand_id?: string
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string | null
          phone?: string | null
          postcodes?: string[]
          raw?: Json | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          source_url?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reps_staging_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "supplier_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_signoffs: {
        Row: {
          employee_id: string | null
          employee_name: string
          id: string
          signature_data: string | null
          signed_at: string | null
          swms_id: string
        }
        Insert: {
          employee_id?: string | null
          employee_name: string
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          swms_id: string
        }
        Update: {
          employee_id?: string | null
          employee_name?: string
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          swms_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_signoffs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swms_signoffs_swms_id_fkey"
            columns: ["swms_id"]
            isOneToOne: false
            referencedRelation: "job_swms"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_templates: {
        Row: {
          business_id: string | null
          content: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      takeoff_files: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          page_count: number | null
          sort_order: number | null
          takeoff_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          page_count?: number | null
          sort_order?: number | null
          takeoff_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          page_count?: number | null
          sort_order?: number | null
          takeoff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_files_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "estimate_takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoff_markups: {
        Row: {
          area_sqm: number | null
          color: string | null
          created_at: string
          depth_mm: number | null
          diameter_mm: number | null
          file_id: string | null
          height_mm: number | null
          id: string
          length_m: number | null
          markup_type: string | null
          name: string | null
          page_number: number | null
          parent_markup_id: string | null
          perimeter_m: number | null
          pier_quantity: number | null
          pod_count: number | null
          pod_thickness_mm: number | null
          points: Json
          scope_id: string
          shape_type: string
          spacer_2way_count: number | null
          spacer_4way_count: number | null
          takeoff_id: string
          toe_depth_mm: number | null
          toe_mm: number | null
          toe_width_mm: number | null
          width_mm: number | null
        }
        Insert: {
          area_sqm?: number | null
          color?: string | null
          created_at?: string
          depth_mm?: number | null
          diameter_mm?: number | null
          file_id?: string | null
          height_mm?: number | null
          id?: string
          length_m?: number | null
          markup_type?: string | null
          name?: string | null
          page_number?: number | null
          parent_markup_id?: string | null
          perimeter_m?: number | null
          pier_quantity?: number | null
          pod_count?: number | null
          pod_thickness_mm?: number | null
          points?: Json
          scope_id: string
          shape_type: string
          spacer_2way_count?: number | null
          spacer_4way_count?: number | null
          takeoff_id: string
          toe_depth_mm?: number | null
          toe_mm?: number | null
          toe_width_mm?: number | null
          width_mm?: number | null
        }
        Update: {
          area_sqm?: number | null
          color?: string | null
          created_at?: string
          depth_mm?: number | null
          diameter_mm?: number | null
          file_id?: string | null
          height_mm?: number | null
          id?: string
          length_m?: number | null
          markup_type?: string | null
          name?: string | null
          page_number?: number | null
          parent_markup_id?: string | null
          perimeter_m?: number | null
          pier_quantity?: number | null
          pod_count?: number | null
          pod_thickness_mm?: number | null
          points?: Json
          scope_id?: string
          shape_type?: string
          spacer_2way_count?: number | null
          spacer_4way_count?: number | null
          takeoff_id?: string
          toe_depth_mm?: number | null
          toe_mm?: number | null
          toe_width_mm?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_markups_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "takeoff_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_markups_parent_markup_id_fkey"
            columns: ["parent_markup_id"]
            isOneToOne: false
            referencedRelation: "takeoff_markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_markups_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "estimate_takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoff_page_scales: {
        Row: {
          created_at: string
          file_id: string
          id: string
          page_number: number
          scale_pixels_per_meter: number
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          page_number?: number
          scale_pixels_per_meter: number
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          page_number?: number
          scale_pixels_per_meter?: number
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_page_scales_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "takeoff_files"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_clocked_out: boolean | null
          break_applied_at: string | null
          break_applied_by: string | null
          break_end: string | null
          break_start: string | null
          business_id: string
          clock_in: string
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_out: string | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          created_at: string | null
          edited_at: string | null
          edited_by: string | null
          employee_id: string
          id: string
          notes: string | null
          pour_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_clocked_out?: boolean | null
          break_applied_at?: string | null
          break_applied_by?: string | null
          break_end?: string | null
          break_start?: string | null
          business_id: string
          clock_in: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          pour_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_clocked_out?: boolean | null
          break_applied_at?: string | null
          break_applied_by?: string | null
          break_end?: string | null
          break_start?: string | null
          business_id?: string
          clock_in?: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          pour_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_break_applied_by_fkey"
            columns: ["break_applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          page_views: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          bonus_estimates: number | null
          business_name: string | null
          checkout_tier: string | null
          checkout_url: string | null
          created_at: string | null
          email: string
          founder_reward: string | null
          founder_status: boolean | null
          full_name: string | null
          id: string
          invited_at: string | null
          last_position_email_at: string | null
          last_position_notified: number | null
          outreach_status: string
          phone: string | null
          referral_code: string | null
          referral_count: number | null
          referred_by: string | null
          staff_notes: string | null
          stripe_session_id: string | null
          vip_status: boolean | null
        }
        Insert: {
          bonus_estimates?: number | null
          business_name?: string | null
          checkout_tier?: string | null
          checkout_url?: string | null
          created_at?: string | null
          email: string
          founder_reward?: string | null
          founder_status?: boolean | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          last_position_email_at?: string | null
          last_position_notified?: number | null
          outreach_status?: string
          phone?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          staff_notes?: string | null
          stripe_session_id?: string | null
          vip_status?: boolean | null
        }
        Update: {
          bonus_estimates?: number | null
          business_name?: string | null
          checkout_tier?: string | null
          checkout_url?: string | null
          created_at?: string | null
          email?: string
          founder_reward?: string | null
          founder_status?: boolean | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          last_position_email_at?: string | null
          last_position_notified?: number | null
          outreach_status?: string
          phone?: string | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          staff_notes?: string | null
          stripe_session_id?: string | null
          vip_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "waiting_list"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_subcontractor_role: {
        Args: { _user_id: string }
        Returns: undefined
      }
      calculate_queue_position: { Args: { _user_id: string }; Returns: number }
      check_employee_limit: { Args: { _business_id: string }; Returns: Json }
      check_invite_email: { Args: { _email: string }; Returns: boolean }
      ensure_team_channel: { Args: { _business_id: string }; Returns: string }
      generate_unique_email_alias: {
        Args: { business_name: string }
        Returns: string
      }
      get_all_affiliates: {
        Args: never
        Returns: {
          affiliate_code: string
          created_at: string
          email: string
          full_name: string
          id: string
          instagram_handle: string
          payout_method: string
          referral_count: number
          status: string
          total_earned: number
        }[]
      }
      get_all_subcontractor_profiles: {
        Args: never
        Returns: {
          abn: string | null
          abn_verified: boolean | null
          availability_status: string | null
          base_postcode: string | null
          bio: string | null
          created_at: string
          email: string | null
          entity_type: string | null
          first_name: string | null
          gst_registered: boolean | null
          has_white_card: boolean | null
          id: string
          insurance_certificate_url: string | null
          last_name: string | null
          legal_name: string | null
          phone: string | null
          profile_photo_url: string | null
          service_radius_km: number | null
          show_availability_in_directory: boolean
          trade_types: string[] | null
          updated_at: string
          user_id: string
          white_card_document_url: string | null
          white_card_number: string | null
          years_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "subcontractor_directory_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_all_users_for_staff: {
        Args: never
        Returns: {
          business_id: string
          business_name: string
          created_at: string
          email: string
          estimates_created: number
          estimates_sent: number
          full_name: string
          id: string
          last_sign_in_at: string
          role: string
          subscription_exempt: boolean
          subscription_status: string
        }[]
      }
      get_channel_business: { Args: { _channel_id: string }; Returns: string }
      get_churn_stats: { Args: never; Returns: Json }
      get_crm_contacts: {
        Args: { _filter?: string }
        Returns: {
          company_name: string
          contact_id: string
          contact_type: string
          created_at: string
          email: string
          full_name: string
          phone: string
          source_detail: string
        }[]
      }
      get_dashboard_stats: { Args: { p_business_id: string }; Returns: Json }
      get_directory_profiles_near_postcode: {
        Args: { _postcode: string }
        Returns: {
          abn_verified: boolean
          availability_status: string
          avg_rating: number
          base_postcode: string
          bio: string
          distance_km: number
          first_name: string
          gst_registered: boolean
          has_white_card: boolean
          id: string
          last_name: string
          legal_name: string
          profile_photo_url: string
          review_count: number
          service_radius_km: number
          show_availability_in_directory: boolean
          trade_types: string[]
          years_experience: number
        }[]
      }
      get_or_create_dm: { Args: { _other_user: string }; Returns: string }
      get_public_directory_profile: {
        Args: { _id: string }
        Returns: {
          abn_verified: boolean
          availability_status: string
          avg_rating: number
          base_postcode: string
          bio: string
          first_name: string
          gst_registered: boolean
          has_white_card: boolean
          id: string
          last_name: string
          legal_name: string
          profile_photo_url: string
          review_count: number
          service_radius_km: number
          show_availability_in_directory: boolean
          trade_types: string[]
          years_experience: number
        }[]
      }
      get_public_directory_profiles: {
        Args: never
        Returns: {
          abn_verified: boolean
          availability_status: string
          avg_rating: number
          base_postcode: string
          bio: string
          first_name: string
          gst_registered: boolean
          has_white_card: boolean
          id: string
          last_name: string
          legal_name: string
          profile_photo_url: string
          review_count: number
          service_radius_km: number
          show_availability_in_directory: boolean
          trade_types: string[]
          years_experience: number
        }[]
      }
      get_public_unavailable_dates: {
        Args: { _id: string }
        Returns: {
          date: string
        }[]
      }
      get_referrer_by_code: { Args: { code: string }; Returns: string }
      get_signup_trends: {
        Args: { days_back?: number }
        Returns: {
          business_count: number
          signup_date: string
          user_count: number
        }[]
      }
      get_subscription_stats: { Args: never; Returns: Json }
      get_team_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          position: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_team_profiles_safe: {
        Args: never
        Returns: {
          avatar_url: string
          business_id: string
          full_name: string
          id: string
          position: string
        }[]
      }
      get_total_quoted_value: { Args: never; Returns: number }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      get_user_crew_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_estimate_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_job_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_pour_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_swms_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_team_ids: { Args: { _user_id: string }; Returns: string[] }
      get_waiting_list_count: { Args: never; Returns: number }
      get_waiting_list_entries: {
        Args: never
        Returns: {
          business_name: string
          checkout_tier: string
          checkout_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          invited_at: string
          outreach_status: string
          phone: string
          referral_count: number
          staff_notes: string
        }[]
      }
      get_waitlist_by_email: { Args: { _email: string }; Returns: Json }
      get_waitlist_status: { Args: { _user_id: string }; Returns: Json }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_worked_with_subcontractor: {
        Args: { _profile_id: string; _user_id: string }
        Returns: boolean
      }
      import_crm_leads: { Args: { _leads: Json }; Returns: Json }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_pourhub_staff: { Args: { _user_id: string }; Returns: boolean }
      is_subcontractor: { Args: { _user_id: string }; Returns: boolean }
      is_supplier: { Args: { _user_id: string }; Returns: boolean }
      join_waitlist: {
        Args: {
          _business_name?: string
          _email: string
          _full_name?: string
          _phone?: string
          _referred_by?: string
        }
        Returns: Json
      }
      mark_channel_read: { Args: { _channel_id: string }; Returns: undefined }
      register_affiliate: {
        Args: { _email: string; _full_name: string; _instagram_handle?: string }
        Returns: Json
      }
      update_waitlist_outreach: {
        Args: {
          _checkout_tier?: string
          _checkout_url?: string
          _id: string
          _invited_at?: string
          _outreach_status: string
          _staff_notes?: string
          _stripe_session_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "pourhub_staff"
        | "supplier"
        | "subcontractor"
      booking_status: "pending" | "contacted" | "converted" | "cancelled"
      chat_channel_type: "team" | "crew" | "dm"
      customer_type: "retail" | "industrial"
      document_category:
        | "itp"
        | "swms"
        | "project_startup"
        | "concrete_test"
        | "equipment"
        | "employee"
        | "job"
        | "general"
      document_type: "swms" | "risk_assessment" | "permit" | "jsa" | "other"
      estimate_status: "draft" | "pending" | "sent" | "accepted" | "declined"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      itp_type:
        | "formwork"
        | "reinforcement"
        | "pre_pour"
        | "post_pour"
        | "custom"
      job_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      job_type: "retail" | "industrial"
      leave_status: "pending" | "approved" | "rejected"
      pending_test_status: "pending" | "approved" | "rejected"
      service_type: "industrial" | "automotive" | "restoration" | "other"
      test_type:
        | "7_day"
        | "14_day"
        | "28_day"
        | "slump"
        | "cylinder"
        | "air"
        | "other"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
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
    Enums: {
      app_role: [
        "admin",
        "staff",
        "pourhub_staff",
        "supplier",
        "subcontractor",
      ],
      booking_status: ["pending", "contacted", "converted", "cancelled"],
      chat_channel_type: ["team", "crew", "dm"],
      customer_type: ["retail", "industrial"],
      document_category: [
        "itp",
        "swms",
        "project_startup",
        "concrete_test",
        "equipment",
        "employee",
        "job",
        "general",
      ],
      document_type: ["swms", "risk_assessment", "permit", "jsa", "other"],
      estimate_status: ["draft", "pending", "sent", "accepted", "declined"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      itp_type: [
        "formwork",
        "reinforcement",
        "pre_pour",
        "post_pour",
        "custom",
      ],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      job_type: ["retail", "industrial"],
      leave_status: ["pending", "approved", "rejected"],
      pending_test_status: ["pending", "approved", "rejected"],
      service_type: ["industrial", "automotive", "restoration", "other"],
      test_type: [
        "7_day",
        "14_day",
        "28_day",
        "slump",
        "cylinder",
        "air",
        "other",
      ],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
