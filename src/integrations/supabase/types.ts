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
      acerto_itens_vendidos: {
        Row: {
          acerto_id: string
          commission_rate: number | null
          created_at: string | null
          id: string
          inventory_id: string
          quantity: number
          sale_price: number
          unit_price: number
        }
        Insert: {
          acerto_id: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          inventory_id: string
          quantity?: number
          sale_price: number
          unit_price: number
        }
        Update: {
          acerto_id?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          inventory_id?: string
          quantity?: number
          sale_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "acerto_itens_vendidos_acerto_id_fkey"
            columns: ["acerto_id"]
            isOneToOne: false
            referencedRelation: "acerto_maleta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acerto_itens_vendidos_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      acerto_maleta: {
        Row: {
          created_at: string | null
          data_acerto: string | null
          id: string
          observacoes: string | null
          promoter_id: string
          status: string | null
          suitcase_id: string
          total_comissao: number | null
          total_lucro: number | null
          total_vendido: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_acerto?: string | null
          id?: string
          observacoes?: string | null
          promoter_id: string
          status?: string | null
          suitcase_id: string
          total_comissao?: number | null
          total_lucro?: number | null
          total_vendido?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_acerto?: string | null
          id?: string
          observacoes?: string | null
          promoter_id?: string
          status?: string | null
          suitcase_id?: string
          total_comissao?: number | null
          total_lucro?: number | null
          total_vendido?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acerto_maleta_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acerto_maleta_suitcase_id_fkey"
            columns: ["suitcase_id"]
            isOneToOne: false
            referencedRelation: "suitcases"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          archived: boolean | null
          barcode: string | null
          category_id: string | null
          created_at: string | null
          depth: number | null
          gram_value: number | null
          height: number | null
          id: string
          markup_percentage: number | null
          material_weight: number | null
          min_stock: number | null
          name: string
          packaging_cost: number | null
          plating_type_id: string | null
          popularity: number | null
          price: number
          profit_margin: number | null
          quantity: number | null
          quantity_available: number | null
          quantity_reserved: number | null
          raw_cost: number | null
          reseller_commission: number | null
          sku: string | null
          suggested_price: number | null
          supplier_id: string | null
          unit_cost: number | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          archived?: boolean | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number | null
          name: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number | null
          price?: number
          profit_margin?: number | null
          quantity?: number | null
          quantity_available?: number | null
          quantity_reserved?: number | null
          raw_cost?: number | null
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          archived?: boolean | null
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          depth?: number | null
          gram_value?: number | null
          height?: number | null
          id?: string
          markup_percentage?: number | null
          material_weight?: number | null
          min_stock?: number | null
          name?: string
          packaging_cost?: number | null
          plating_type_id?: string | null
          popularity?: number | null
          price?: number
          profit_margin?: number | null
          quantity?: number | null
          quantity_available?: number | null
          quantity_reserved?: number | null
          raw_cost?: number | null
          reseller_commission?: number | null
          sku?: string | null
          suggested_price?: number | null
          supplier_id?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      inventory_damaged_items: {
        Row: {
          damage_description: string | null
          id: string
          inventory_id: string
          quantity: number
          reported_at: string | null
          resolved: boolean | null
        }
        Insert: {
          damage_description?: string | null
          id?: string
          inventory_id: string
          quantity?: number
          reported_at?: string | null
          resolved?: boolean | null
        }
        Update: {
          damage_description?: string | null
          id?: string
          inventory_id?: string
          quantity?: number
          reported_at?: string | null
          resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_damaged_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_label_history: {
        Row: {
          id: string
          inventory_id: string
          label_type: string | null
          printed_at: string | null
          printed_by: string | null
        }
        Insert: {
          id?: string
          inventory_id: string
          label_type?: string | null
          printed_at?: string | null
          printed_by?: string | null
        }
        Update: {
          id?: string
          inventory_id?: string
          label_type?: string | null
          printed_at?: string | null
          printed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_label_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
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
          created_at: string | null
          id: string
          inventory_id: string
          is_primary: boolean | null
          photo_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          is_primary?: boolean | null
          photo_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          is_primary?: boolean | null
          photo_url?: string
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
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promoters: {
        Row: {
          active: boolean | null
          address: string | null
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resellers: {
        Row: {
          active: boolean | null
          address: string | null
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suitcase_item_sales: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          id: string
          quantity_sold: number
          reseller_id: string | null
          sale_date: string | null
          sale_price: number
          suitcase_item_id: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          quantity_sold?: number
          reseller_id?: string | null
          sale_date?: string | null
          sale_price: number
          suitcase_item_id: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          quantity_sold?: number
          reseller_id?: string | null
          sale_date?: string | null
          sale_price?: number
          suitcase_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suitcase_item_sales_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suitcase_item_sales_suitcase_item_id_fkey"
            columns: ["suitcase_item_id"]
            isOneToOne: false
            referencedRelation: "suitcase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      suitcase_items: {
        Row: {
          added_at: string | null
          id: string
          inventory_id: string
          quantity: number
          status: string | null
          suitcase_id: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          inventory_id: string
          quantity?: number
          status?: string | null
          suitcase_id: string
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          inventory_id?: string
          quantity?: number
          status?: string | null
          suitcase_id?: string
          unit_price?: number
          updated_at?: string | null
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
          code: string
          created_at: string | null
          delivered_at: string | null
          id: string
          promoter_id: string | null
          returned_at: string | null
          status: string | null
          total_items: number | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          promoter_id?: string | null
          returned_at?: string | null
          status?: string | null
          total_items?: number | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          promoter_id?: string | null
          returned_at?: string | null
          status?: string | null
          total_items?: number | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suitcases_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_info: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "promoter" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "promoter", "seller"],
    },
  },
} as const
