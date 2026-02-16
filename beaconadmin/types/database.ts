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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_community_assignments: {
        Row: {
          admin_id: string
          assigned_at: string
          assigned_by: string | null
          community_id: string
          id: string
        }
        Insert: {
          admin_id: string
          assigned_at?: string
          assigned_by?: string | null
          community_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          assigned_at?: string
          assigned_by?: string | null
          community_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_community_assignments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_community_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_community_assignments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          must_change_password: boolean
          password_changed_at: string | null
          password_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          must_change_password?: boolean
          password_changed_at?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          category_id: string | null
          community_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          id: string
          is_community_event: boolean | null
          is_private: boolean | null
          like_count: number | null
          location: string | null
          remind_me: boolean | null
          reminder_time: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          community_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          is_community_event?: boolean | null
          is_private?: boolean | null
          like_count?: number | null
          location?: string | null
          remind_me?: boolean | null
          reminder_time?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          community_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          is_community_event?: boolean | null
          is_private?: boolean | null
          like_count?: number | null
          location?: string | null
          remind_me?: boolean | null
          reminder_time?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          created_by_admin_id: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_private: boolean | null
          member_count: number | null
          name: string
          scope: Database["public"]["Enums"]["community_scope"] | null
          university_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_private?: boolean | null
          member_count?: number | null
          name: string
          scope?: Database["public"]["Enums"]["community_scope"] | null
          university_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          scope?: Database["public"]["Enums"]["community_scope"] | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_guidelines: {
        Row: {
          agreement_prompt: string | null
          community_id: string
          created_at: string | null
          guidelines_text: string
          id: string
          requires_agreement: boolean | null
          updated_at: string | null
        }
        Insert: {
          agreement_prompt?: string | null
          community_id: string
          created_at?: string | null
          guidelines_text: string
          id?: string
          requires_agreement?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agreement_prompt?: string | null
          community_id?: string
          created_at?: string | null
          guidelines_text?: string
          id?: string
          requires_agreement?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_guidelines_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_applications: {
        Row: {
          agreed_to_guidelines: boolean | null
          answers: Json
          community_id: string
          created_at: string | null
          id: string
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          agreed_to_guidelines?: boolean | null
          answers?: Json
          community_id: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          agreed_to_guidelines?: boolean | null
          answers?: Json
          community_id?: string
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_applications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_info: {
        Row: {
          button_text: string | null
          community_id: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          community_id: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          community_id?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_join_info_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notices: {
        Row: {
          community_id: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_pinned: boolean | null
          media_urls: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notices_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          community_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_official: boolean | null
          is_pinned: boolean | null
          like_count: number | null
          media_urls: string[] | null
          share_count: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          community_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_official?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          share_count?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          community_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_official?: boolean | null
          is_pinned?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          share_count?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_questions: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          is_required: boolean | null
          max_length: number | null
          placeholder_text: string | null
          question_order: number
          question_text: string
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_length?: number | null
          placeholder_text?: string | null
          question_order?: number
          question_text: string
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_length?: number | null
          placeholder_text?: string | null
          question_order?: number
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_questions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          color_hex: string
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color_hex: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "event_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          event_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
        ]
      }
      event_likes: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_organizer: boolean | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_organizer?: boolean | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_organizer?: boolean | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders_sent: {
        Row: {
          event_id: string
          id: string
          reminder_type: string
          sent_at: string | null
        }
        Insert: {
          event_id: string
          id?: string
          reminder_type?: string
          sent_at?: string | null
        }
        Update: {
          event_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_likes: {
        Row: {
          created_at: string | null
          id: string
          newsletter_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          newsletter_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          newsletter_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_likes_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          newsletter_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          newsletter_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          newsletter_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_views_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          like_count: number | null
          metadata: Json | null
          published_at: string | null
          subtitle: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          subtitle?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          subtitle?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          image_url: string | null
          is_read: boolean | null
          read_at: string | null
          subtitle: string | null
          target_id: string | null
          target_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          subtitle?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          subtitle?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          like_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          like_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          group_id: string | null
          id: string
          message: string | null
          post_id: string
          shared_at: string | null
          shared_by: string
        }
        Insert: {
          group_id?: string | null
          id?: string
          message?: string | null
          post_id: string
          shared_at?: string | null
          shared_by: string
        }
        Update: {
          group_id?: string | null
          id?: string
          message?: string | null
          post_id?: string
          shared_at?: string | null
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          arc_no: string | null
          avatar_url: string | null
          contact_no: string | null
          country_id: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          onboarding_step: string | null
          passport_no: string | null
          profile_completed: boolean | null
          purpose: string | null
          school_industry: string | null
          status: string | null
          university_id: string | null
          unread_count: number | null
          updated_at: string | null
          user_name: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          visa_type: string | null
        }
        Insert: {
          arc_no?: string | null
          avatar_url?: string | null
          contact_no?: string | null
          country_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          onboarding_step?: string | null
          passport_no?: string | null
          profile_completed?: boolean | null
          purpose?: string | null
          school_industry?: string | null
          status?: string | null
          university_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_name?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          visa_type?: string | null
        }
        Update: {
          arc_no?: string | null
          avatar_url?: string | null
          contact_no?: string | null
          country_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          onboarding_step?: string | null
          passport_no?: string | null
          profile_completed?: boolean | null
          purpose?: string | null
          school_industry?: string | null
          status?: string | null
          university_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_name?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_and_conditions: {
        Row: {
          content: string
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean
          is_required: boolean
          title: string
          type: string
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          title: string
          type: string
          updated_at?: string | null
          version?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_required?: boolean
          title?: string
          type?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          country_id: string
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendar_events: {
        Row: {
          added_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          community_id: string
          created_at: string | null
          description: string | null
          id: string
          post_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          community_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          community_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_term_acceptances: {
        Row: {
          accepted_at: string | null
          id: string
          ip_address: unknown
          term_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_address?: unknown
          term_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_address?: unknown
          term_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_term_acceptances_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms_and_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_calendar_view: {
        Row: {
          category_id: string | null
          community_id: string | null
          community_name: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          event_type: string | null
          id: string | null
          is_community_event: boolean | null
          is_private: boolean | null
          remind_me: boolean | null
          reminder_time: string | null
          start_time: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_post: { Args: { p_post_id: string }; Returns: boolean }
      can_admin_access_community: {
        Args: { admin_uuid: string; comm_id: string }
        Returns: boolean
      }
      check_event_status: {
        Args: { p_event_id: string }
        Returns: {
          community_name: string
          event_id: string
          is_community_event: boolean
          member_count: number
          participant_count: number
          recent_notifications: number
          status: string
          title: string
        }[]
      }
      community_requires_application: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      create_comment: {
        Args: {
          p_content: string
          p_parent_comment_id?: string
          p_post_id: string
        }
        Returns: string
      }
      create_community: {
        Args: {
          p_avatar_url?: string
          p_cover_url?: string
          p_description?: string
          p_is_private?: boolean
          p_name: string
        }
        Returns: string
      }
      create_group: {
        Args: { p_community_id: string; p_description?: string; p_name: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_image_url?: string
          p_subtitle?: string
          p_target_id?: string
          p_target_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_official_post:
        | {
            Args: {
              p_community_id: string
              p_content: string
              p_is_pinned?: boolean
              p_media_urls?: string[]
            }
            Returns: string
          }
        | {
            Args: {
              p_community_id: string
              p_content: string
              p_is_pinned?: boolean
              p_media_urls?: string[]
              p_title: string
            }
            Returns: string
          }
      create_user_post:
        | {
            Args: {
              p_community_id: string
              p_content: string
              p_media_urls?: string[]
            }
            Returns: string
          }
        | {
            Args: {
              p_community_id: string
              p_content: string
              p_media_urls?: string[]
              p_title: string
            }
            Returns: string
          }
      deactivate_fcm_token: { Args: { p_platform: string }; Returns: undefined }
      decrement_newsletter_likes: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      delete_community: { Args: { p_community_id: string }; Returns: boolean }
      delete_group_message: { Args: { p_message_id: string }; Returns: boolean }
      demote_from_admin: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      edit_group_message: {
        Args: { p_message_id: string; p_new_content: string }
        Returns: boolean
      }
      get_admin_assigned_communities: {
        Args: { admin_uuid: string }
        Returns: {
          community_id: string
        }[]
      }
      get_badge_count: { Args: { p_user_id: string }; Returns: number }
      get_community_feed: {
        Args: { p_community_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          comment_count: number
          community_cover: string
          community_id: string
          community_image: string
          community_name: string
          content: string
          created_at: string
          display_name: string
          id: string
          is_official: boolean
          is_pinned: boolean
          like_count: number
          media_urls: string[]
          post_id: string
          share_count: number
          title: string
          user_liked: boolean
        }[]
      }
      get_community_join_details: {
        Args: { p_community_id: string }
        Returns: {
          guidelines: Json
          join_info: Json
          questions: Json
        }[]
      }
      get_event_comments_with_authors: {
        Args: { p_event_id: string }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_first_name: string
          author_id: string
          author_last_name: string
          content: string
          created_at: string
          event_id: string
          id: string
          like_count: number
          updated_at: string
          user_liked: boolean
        }[]
      }
      get_filtered_communities_for_user: {
        Args: never
        Returns: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          created_by_admin_id: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_private: boolean | null
          member_count: number | null
          name: string
          scope: Database["public"]["Enums"]["community_scope"] | null
          university_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "communities"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_group_message_count: { Args: { p_group_id: string }; Returns: number }
      get_group_messages: {
        Args: { p_group_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          content: string
          created_at: string
          group_id: string
          is_edited: boolean
          message_id: string
          message_type: string
          reply_author_name: string
          reply_content: string
          reply_to_id: string
          updated_at: string
        }[]
      }
      get_my_communities: {
        Args: never
        Returns: {
          community_avatar: string
          community_id: string
          community_name: string
          joined_at: string
          member_count: number
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_post_comments_with_authors: {
        Args: { p_post_id: string }
        Returns: {
          author_avatar: string
          author_display_name: string
          author_email: string
          author_first_name: string
          author_full_name: string
          author_id: string
          author_last_name: string
          author_user_name: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          like_count: number
          parent_comment_id: string
          post_id: string
          user_liked: boolean
        }[]
      }
      get_upcoming_event_reminders: {
        Args: never
        Returns: {
          community_name: string
          event_id: string
          event_title: string
          hours_until_event: number
          reminder_sent: boolean
          start_time: string
        }[]
      }
      get_user_role: {
        Args: { community_id: string; user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_newsletter_likes: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      increment_newsletter_views: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      increment_unread_count: {
        Args: { p_increment_by?: number; p_user_id: string }
        Returns: number
      }
      is_admin_or_creator: {
        Args: { community_id: string; user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { community_id: string; user_id: string }
        Returns: boolean
      }
      is_creator: {
        Args: { community_id: string; user_id: string }
        Returns: boolean
      }
      join_community:
        | { Args: { p_community_id: string }; Returns: boolean }
        | {
            Args: { p_community_id: string; p_message?: string }
            Returns: Json
          }
      join_group: { Args: { p_group_id: string }; Returns: boolean }
      leave_community: { Args: { p_community_id: string }; Returns: boolean }
      log_admin_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
        }
        Returns: string
      }
      manual_test_event_update: {
        Args: { p_event_id: string; p_new_start_time: string }
        Returns: string
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: number
      }
      process_join_request: {
        Args: {
          p_rejection_reason?: string
          p_request_id: string
          p_status: Database["public"]["Enums"]["request_status"]
        }
        Returns: boolean
      }
      promote_to_admin: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      report_user: {
        Args: {
          p_community_id: string
          p_description?: string
          p_post_id?: string
          p_reason: string
          p_reported_user_id: string
        }
        Returns: string
      }
      reset_unread_count: { Args: { p_user_id: string }; Returns: undefined }
      review_user_report: {
        Args: {
          p_report_id: string
          p_resolution_notes?: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: boolean
      }
      search_communities: {
        Args: { search_term: string }
        Returns: {
          description: string
          id: string
          member_count: number
          name: string
          scope: Database["public"]["Enums"]["community_scope"]
          university_name: string
        }[]
      }
      search_filtered_communities: {
        Args: { search_query: string }
        Returns: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          created_by_admin_id: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_private: boolean | null
          member_count: number | null
          name: string
          scope: Database["public"]["Enums"]["community_scope"] | null
          university_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "communities"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      send_event_reminder_notifications: { Args: never; Returns: undefined }
      send_group_message: {
        Args: { p_content: string; p_group_id: string; p_reply_to_id?: string }
        Returns: string
      }
      send_push_notification_to_user: {
        Args: {
          p_body: string
          p_data?: Json
          p_target_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      send_single_event_reminder: {
        Args: {
          p_community_id: string
          p_community_name: string
          p_end_time: string
          p_event_description: string
          p_event_id: string
          p_event_title: string
          p_start_time: string
          p_user_id: string
        }
        Returns: undefined
      }
      share_post: {
        Args: { p_group_id?: string; p_message?: string; p_post_id: string }
        Returns: string
      }
      submit_community_application:
        | {
            Args: {
              p_agreed_to_guidelines: boolean
              p_answers: Json
              p_community_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_agreed_to_guidelines: boolean
              p_answers: Json
              p_community_id: string
              p_message?: string
            }
            Returns: string
          }
      sync_badge_count: { Args: { p_user_id: string }; Returns: number }
      test_cancel_event: { Args: { p_event_id: string }; Returns: string }
      test_event_update: {
        Args: { p_event_id: string }
        Returns: {
          event_details: Json
          message: string
          notification_count: number
        }[]
      }
      test_send_event_reminder: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      toggle_comment_like: { Args: { p_comment_id: string }; Returns: boolean }
      toggle_event_like: { Args: { p_event_id: string }; Returns: Json }
      toggle_post_like: { Args: { p_post_id: string }; Returns: boolean }
      upsert_fcm_token: {
        Args: { p_device_info?: Json; p_platform: string; p_token: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "super_admin" | "community_admin"
      community_scope: "institutional" | "global"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      request_status: "pending" | "accepted" | "declined"
      user_role: "creator" | "admin" | "user"
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
      admin_role: ["super_admin", "community_admin"],
      community_scope: ["institutional", "global"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      request_status: ["pending", "accepted", "declined"],
      user_role: ["creator", "admin", "user"],
    },
  },
} as const