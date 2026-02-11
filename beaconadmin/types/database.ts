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
          password_hash: string
          role: string | null
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
          password_hash: string
          role?: string | null
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
          password_hash?: string
          role?: string | null
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
          remind_me: boolean | null
          reminder_time: string | null
          start_time: string
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
          remind_me?: boolean | null
          reminder_time?: string | null
          start_time: string
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
          remind_me?: boolean | null
          reminder_time?: string | null
          start_time?: string
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
      communities: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
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
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
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
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          scope?: Database["public"]["Enums"]["community_scope"] | null
          university_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string | null
          event_id: string
          id: string
          is_mandatory: boolean | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          event_id: string
          id?: string
          is_mandatory?: boolean | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
          is_mandatory?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_calendar_view"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_applications: {
        Row: {
          community_id: string
          id: string
          join_request_id: string | null
          message: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
          answers: Json | null
          agreed_to_guidelines: boolean | null
        }
        Insert: {
          community_id: string
          id?: string
          join_request_id?: string | null
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
          answers?: Json | null
          agreed_to_guidelines?: boolean | null
        }
        Update: {
          community_id?: string
          id?: string
          join_request_id?: string | null
          message?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
          answers?: Json | null
          agreed_to_guidelines?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "community_join_applications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_join_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
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
          avatar_url: string | null
          country_id: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          university_id: string | null
          updated_at: string | null
          user_name: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_name?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_name?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
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
      get_community_feed: {
        Args: { p_community_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          comment_count: number
          community_id: string
          community_image: string
          community_name: string
          content: string
          created_at: string
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
        Args: Record<PropertyKey, never>
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
          author: Json
          author_avatar: string
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          parent_comment_id: string
          post_id: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { community_id: string; user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
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
      join_community: {
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
      process_join_application: {
        Args: {
          p_rejection_reason?: string
          p_application_id: string
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
      send_group_message: {
        Args: { p_content: string; p_group_id: string; p_reply_to_id?: string }
        Returns: string
      }
      share_post: {
        Args: { p_group_id?: string; p_message?: string; p_post_id: string }
        Returns: string
      }
      toggle_post_like: { Args: { p_post_id: string }; Returns: boolean }
    }
    Enums: {
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
      community_scope: ["institutional", "global"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      request_status: ["pending", "accepted", "declined"],
      user_role: ["creator", "admin", "user"],
    },
  },
} as const