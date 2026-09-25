export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      library_items: {
        Row: {
          id: string;
          user_id: string;
          book_code: string;
          title: string;
          normalized_title: string;
          author: string | null;
          normalized_author: string | null;
          isbn10: string | null;
          isbn13: string | null;
          barcode: string | null;
          publisher: string | null;
          edition: string | null;
          published_year: number | null;
          language: string | null;
          category: string | null;
          cover_url: string | null;
          cover_storage_path: string | null;
          cover_hash: string | null;
          ocr_text: string | null;
          metadata_source: string | null;
          ocr_language: string | null;
          quantity: number;
          purchase_price: number | null;
          purchase_date: string | null;
          purchase_place: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_code: string;
          title: string;
          normalized_title: string;
          author?: string | null;
          normalized_author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          barcode?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          language?: string | null;
          category?: string | null;
          cover_url?: string | null;
          cover_storage_path?: string | null;
          cover_hash?: string | null;
          ocr_text?: string | null;
          metadata_source?: string | null;
          ocr_language?: string | null;
          quantity?: number;
          purchase_price?: number | null;
          purchase_date?: string | null;
          purchase_place?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_code?: string;
          title?: string;
          normalized_title?: string;
          author?: string | null;
          normalized_author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          barcode?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          language?: string | null;
          category?: string | null;
          cover_url?: string | null;
          cover_storage_path?: string | null;
          cover_hash?: string | null;
          ocr_text?: string | null;
          metadata_source?: string | null;
          ocr_language?: string | null;
          quantity?: number;
          purchase_price?: number | null;
          purchase_date?: string | null;
          purchase_place?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      scan_history: {
        Row: {
          id: string;
          user_id: string;
          scanned_isbn: string | null;
          detected_title: string | null;
          detected_author: string | null;
          detected_publisher: string | null;
          detected_edition: string | null;
          cover_hash: string | null;
          ocr_text: string | null;
          match_type: "OWNED" | "POSSIBLE_DUPLICATE" | "NEW" | "UNKNOWN";
          match_confidence: number | null;
          matched_library_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scanned_isbn?: string | null;
          detected_title?: string | null;
          detected_author?: string | null;
          detected_publisher?: string | null;
          detected_edition?: string | null;
          cover_hash?: string | null;
          ocr_text?: string | null;
          match_type: "OWNED" | "POSSIBLE_DUPLICATE" | "NEW" | "UNKNOWN";
          match_confidence?: number | null;
          matched_library_item_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scanned_isbn?: string | null;
          detected_title?: string | null;
          detected_author?: string | null;
          detected_publisher?: string | null;
          detected_edition?: string | null;
          cover_hash?: string | null;
          ocr_text?: string | null;
          match_type?: "OWNED" | "POSSIBLE_DUPLICATE" | "NEW" | "UNKNOWN";
          match_confidence?: number | null;
          matched_library_item_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_history_matched_library_item_id_fkey";
            columns: ["matched_library_item_id"];
            isOneToOne: false;
            referencedRelation: "library_items";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          library_item_id: string | null;
          title: string;
          author: string | null;
          isbn10: string | null;
          isbn13: string | null;
          publisher: string | null;
          edition: string | null;
          published_year: number | null;
          cover_url: string | null;
          source: string | null;
          estimated_price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          library_item_id?: string | null;
          title: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          cover_url?: string | null;
          source?: string | null;
          estimated_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          library_item_id?: string | null;
          title?: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          cover_url?: string | null;
          source?: string | null;
          estimated_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_library_item_id_fkey";
            columns: ["library_item_id"];
            isOneToOne: false;
            referencedRelation: "library_items";
            referencedColumns: ["id"];
          }
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          isbn10: string | null;
          isbn13: string | null;
          publisher: string | null;
          edition: string | null;
          published_year: number | null;
          cover_url: string | null;
          source: string | null;
          price: number | null;
          quantity: number;
          seller: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          cover_url?: string | null;
          source?: string | null;
          price?: number | null;
          quantity?: number;
          seller?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          publisher?: string | null;
          edition?: string | null;
          published_year?: number | null;
          cover_url?: string | null;
          source?: string | null;
          price?: number | null;
          quantity?: number;
          seller?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      purchase_history: {
        Row: {
          id: string;
          user_id: string;
          library_item_id: string | null;
          title: string;
          author: string | null;
          isbn10: string | null;
          isbn13: string | null;
          edition: string | null;
          cover_url: string | null;
          quantity: number;
          price: number | null;
          seller: string | null;
          purchase_date: string;
          total_amount: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          library_item_id?: string | null;
          title: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          edition?: string | null;
          cover_url?: string | null;
          quantity?: number;
          price?: number | null;
          seller?: string | null;
          purchase_date?: string;
          total_amount?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          library_item_id?: string | null;
          title?: string;
          author?: string | null;
          isbn10?: string | null;
          isbn13?: string | null;
          edition?: string | null;
          cover_url?: string | null;
          quantity?: number;
          price?: number | null;
          seller?: string | null;
          purchase_date?: string;
          total_amount?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_history_library_item_id_fkey";
            columns: ["library_item_id"];
            isOneToOne: false;
            referencedRelation: "library_items";
            referencedColumns: ["id"];
          }
        ];
      };
      remote_scan_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          status: "waiting" | "connected" | "scanned" | "expired" | "closed";
          scanned_value: string | null;
          device_connected: boolean;
          device_info: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          status?: "waiting" | "connected" | "scanned" | "expired" | "closed";
          scanned_value?: string | null;
          device_connected?: boolean;
          device_info?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          status?: "waiting" | "connected" | "scanned" | "expired" | "closed";
          scanned_value?: string | null;
          device_connected?: boolean;
          device_info?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "remote_scan_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      mark_cart_item_purchased: {
        Args: {
          p_cart_item_id: string;
          p_purchase_date?: string;
          p_price?: number | null;
          p_quantity?: number;
          p_seller?: string | null;
          p_notes?: string | null;
        };
        Returns: {
          success: boolean;
          library_item_id: string;
          purchase_history_id: string;
          is_existing_copy: boolean;
        };
      };
      get_remote_scan_session: {
        Args: {
          p_session_id: string;
          p_token: string;
        };
        Returns: Json;
      };
      connect_remote_scan_session: {
        Args: {
          p_session_id: string;
          p_token: string;
          p_device_info?: string | null;
        };
        Returns: Json;
      };
      submit_remote_scan_barcode: {
        Args: {
          p_session_id: string;
          p_token: string;
          p_barcode: string;
        };
        Returns: Json;
      };
      disconnect_remote_scan_session: {
        Args: {
          p_session_id: string;
          p_token: string;
        };
        Returns: Json;
      };
      lookup_community_book_by_isbn: {
        Args: {
          p_isbn: string;
        };
        Returns: Json;
      };
      suggest_authors: {
        Args: {
          p_query?: string;
          p_limit?: number;
        };
        Returns: Array<{
          author: string;
          book_count: number;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
