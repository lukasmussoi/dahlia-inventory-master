export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          barcode: string | null
          category_id: string
          created_at: string
          depth: number | null
          gram_value: number | null
          height: number | null
          id: string
          markup_percentage: number | null
          material_weight: number | null
          min_stock: number
          name: string
          packaging_cost: number | null
          plating_type_id: string | null
          popularity: number
          price: number
          profit_margin: number | null
          quantity: number
          reseller_commission: number | null
          sku: string | null
          suggested_price: number
          supplier_id: string | null
          unit_cost: number
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          category_id: string
          created_at?: string
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number
          name: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number
          price: number
          profit_margin?: number | null
          quantity?: number
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string
          created_at?: string
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number
          name?: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number
          price?: number
          profit_margin?: number | null
          quantity?: number
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_plating_type_id_fkey"
            columns: ["plating_type_id"]
            isOneToOne: false
            referencedRelation: "plating_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reason: string
          unit_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reason: string
          unit_cost: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reason?: string
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_photos: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          is_primary: boolean | null
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          is_primary?: boolean | null
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          is_primary?: boolean | null
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_photos_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      plating_types: {
        Row: {
          created_at: string
          description: string | null
          gram_value: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gram_value?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gram_value?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      suitcase_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          quantity: number
          status: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          quantity?: number
          status?: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["suitcase_item_status"] | null
          suitcase_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcase_items_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcases: {
        Row: {
          created_at: string
          id: string
          seller_id: string
          sent_at: string
          status: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          seller_id: string
          sent_at?: string
          status?: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          seller_id?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["suitcase_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_info: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_password: {
        Args: {
          user_id: string
          new_password: string
        }
        Returns: undefined
      }
      check_is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      plating_type: "ouro" | "prata" | "rose" | "rhodium" | "sem_banho"
      suitcase_item_status: "in_possession" | "sold" | "returned" | "lost"
      suitcase_status: "in_use" | "returned" | "in_audit" | "lost"
      user_role: "admin" | "promoter" | "seller"
      user_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
