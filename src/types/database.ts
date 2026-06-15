export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          icon: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          icon?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fields: {
        Row: {
          id: string;
          table_id: string;
          name: string;
          type: string;
          config: Json | null;
          sort_order: number;
          width: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          name: string;
          type: string;
          config?: Json | null;
          sort_order?: number;
          width?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          name?: string;
          type?: string;
          config?: Json | null;
          sort_order?: number;
          width?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      field_options: {
        Row: {
          id: string;
          field_id: string;
          label: string;
          color: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_id: string;
          label: string;
          color?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_id?: string;
          label?: string;
          color?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      records: {
        Row: {
          id: string;
          table_id: string;
          workspace_id: string;
          title: string;
          sort_order: number;
          word_count: number | null;
          is_archived: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          workspace_id: string;
          title: string;
          sort_order?: number;
          word_count?: number | null;
          is_archived?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          workspace_id?: string;
          title?: string;
          sort_order?: number;
          word_count?: number | null;
          is_archived?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      cell_values: {
        Row: {
          record_id: string;
          field_id: string;
          value: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          record_id: string;
          field_id: string;
          value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          record_id?: string;
          field_id?: string;
          value?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      views: {
        Row: {
          id: string;
          table_id: string;
          name: string;
          type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'form';
          is_default: boolean;
          is_shared: boolean;
          filters: Json | null;
          sorts: Json | null;
          group_by: Json | null;
          columns: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          name: string;
          type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'form';
          is_default?: boolean;
          is_shared?: boolean;
          filters?: Json | null;
          sorts?: Json | null;
          group_by?: Json | null;
          columns?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          name?: string;
          type?: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'form';
          is_default?: boolean;
          is_shared?: boolean;
          filters?: Json | null;
          sorts?: Json | null;
          group_by?: Json | null;
          columns?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          record_id: string;
          workspace_id: string;
          user_id: string;
          content: string;
          parent_comment_id: string | null;
          is_resolved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          workspace_id: string;
          user_id: string;
          content: string;
          parent_comment_id?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          workspace_id?: string;
          user_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          is_resolved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentions: {
        Row: {
          id: string;
          comment_id: string;
          mentioned_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          mentioned_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          mentioned_user_id?: string;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          workspace_id: string;
          record_id: string | null;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          changes: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          record_id?: string | null;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          changes?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          record_id?: string | null;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          changes?: Json | null;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          record_id: string;
          workspace_id: string;
          user_id: string;
          filename: string;
          url: string;
          mime_type: string | null;
          size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          workspace_id: string;
          user_id: string;
          filename: string;
          url: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          workspace_id?: string;
          user_id?: string;
          filename?: string;
          url?: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          workspace_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          category: string;
          field_definitions: Json;
          status_definitions: Json;
          sample_records: Json | null;
          is_system: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          category: string;
          field_definitions?: Json;
          status_definitions?: Json;
          sample_records?: Json | null;
          is_system?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string | null;
          name?: string;
          description?: string | null;
          icon?: string | null;
          category?: string;
          field_definitions?: Json;
          status_definitions?: Json;
          sample_records?: Json | null;
          is_system?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
